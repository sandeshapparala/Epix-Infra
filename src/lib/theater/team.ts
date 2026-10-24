import { z } from "zod";
import { theaterAuth, theaterDb } from "./firebase-admin";
import { collection, StoreConflict } from "./firestore-store";
import {
  AccessError,
  attribution,
  requireActive,
  requireAdmin,
  requireSelfSafe,
  type Actor,
  type TheaterMember,
} from "./access";
export const memberCreate = z
  .object({
    email: z
      .string()
      .email()
      .max(160)
      .transform((v) => v.toLowerCase()),
    displayName: z.string().trim().min(1).max(100),
    role: z.enum(["admin", "employee"]),
    maxDiscountPercent: z.number().min(0).max(100),
  })
  .strict();
export const memberUpdate = z
  .object({
    displayName: z.string().trim().min(1).max(100),
    role: z.enum(["admin", "employee"]),
    active: z.boolean(),
    maxDiscountPercent: z.number().min(0).max(100),
    expectedRevision: z.number().int().min(0),
  })
  .strict();
export async function listMembers(cursor?: string) {
  let q = collection("Users").orderBy("uid");
  if (cursor) q = q.startAfter(cursor);
  const docs = await q.limit(51).get();
  return {
    members: docs.docs.slice(0, 50).map((d) => d.data() as TheaterMember),
    nextCursor: docs.size > 50 ? docs.docs[49].id : null,
  };
}
export async function createMember(
  actor: Actor,
  input: z.infer<typeof memberCreate>,
) {
  requireAdmin(actor);
  const auth = theaterAuth();
  let user;
  try {
    user = await auth.getUserByEmail(input.email);
  } catch (e) {
    if ((e as { code?: string }).code !== "auth/user-not-found") throw e;
    user = await auth.createUser({
      email: input.email,
      displayName: input.displayName,
      emailVerified: false,
    });
  }
  if (user.disabled)
    throw new AccessError(
      "This Firebase account is disabled. Restore its authentication access before adding it.",
      400,
    );
  return theaterDb().runTransaction(async (tx) => {
    const current = (
      await tx.get(collection("Users").doc(actor.uid))
    ).data() as Actor;
    requireAdmin(current);
    const ref = collection("Users").doc(user.uid),
      existing = await tx.get(ref);
    if (existing.exists)
      throw new StoreConflict(
        "This account already belongs to the team. Edit its existing profile.",
      );
    const now = new Date().toISOString();
    const member: TheaterMember = {
      ...input,
      uid: user.uid,
      active: true,
      revision: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: actor.uid,
    };
    tx.create(ref, member);
    tx.create(collection("Audit").doc(), {
      action: "member_created",
      actor: attribution(current),
      targetUid: member.uid,
      createdAt: now,
    });
    return member;
  });
}
export async function updateMember(
  actor: Actor,
  uid: string,
  input: z.infer<typeof memberUpdate>,
) {
  return theaterDb().runTransaction(async (tx) => {
    const current = (
      await tx.get(collection("Users").doc(actor.uid))
    ).data() as Actor;
    requireActive(current);
    requireSelfSafe(current, uid, input.role, input.active);
    const ref = collection("Users").doc(uid),
      existing = await tx.get(ref);
    if (!existing.exists) throw new AccessError("Team member not found.", 404);
    const previous = existing.data() as TheaterMember;
    if (previous.revision !== input.expectedRevision)
      throw new StoreConflict(
        "This member changed in another window. Refresh and try again.",
      );
    const { expectedRevision: _revision, ...fields } = input;
    const member = {
      ...previous,
      ...fields,
      revision: previous.revision + 1,
      updatedAt: new Date().toISOString(),
    };
    tx.set(ref, member);
    tx.create(collection("Audit").doc(), {
      action: "member_updated",
      actor: attribution(current),
      targetUid: uid,
      previous: {
        role: previous.role,
        active: previous.active,
        maxDiscountPercent: previous.maxDiscountPercent,
      },
      next: fields,
      createdAt: member.updatedAt,
    });
    return member;
  });
}
