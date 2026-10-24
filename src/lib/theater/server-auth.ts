import { theaterAuth, theaterDb } from "./firebase-admin";
import { AccessError, requireActive, requireAdmin, type Actor } from "./access";

export async function authenticate(
  request: Request,
  adminOnly = false,
): Promise<Actor> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ") || header.length > 12000)
    throw new AccessError("Sign in with an authorized Epix team account.", 401);
  let uid: string;
  const auth = theaterAuth();
  try {
    uid = (await auth.verifyIdToken(header.slice(7), true)).uid;
  } catch {
    throw new AccessError(
      "Your session expired or was revoked. Sign in again.",
      401,
    );
  }
  const record = await theaterDb().collection("theaterUsers").doc(uid).get();
  const actor = record.exists ? ({ ...record.data(), uid } as Actor) : null;
  requireActive(actor);
  if (adminOnly) requireAdmin(actor);
  return actor;
}
