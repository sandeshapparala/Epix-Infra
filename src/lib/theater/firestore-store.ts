import { createHash, randomUUID } from "node:crypto";
import { type Transaction } from "firebase-admin/firestore";
import seed from "../../data/theater/products.json";
import quotationCompany from "../../data/theater/quotation-company.json";
import { theaterDb } from "./firebase-admin";
import {
  AccessError,
  attribution,
  requireActive,
  requireAdmin,
  requireDiscount,
  requireOwner,
  requireServiceRates,
  type Actor,
  type ServiceRate,
} from "./access";
import type {
  Price,
  Product,
  SalesProject,
  SavedProject,
  QuoteSnapshot,
} from "./types";
import { activeSlots, calculateQuote } from "./quote";
import { storePreview } from "./media";

const products = seed as Product[];
export const collection = (name: string) =>
  theaterDb().collection(`theater${name}`);
export class StoreConflict extends AccessError {
  constructor(message: string) {
    super(message, 409);
  }
}
const clean = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const noPreview = (state: SalesProject) => {
  const { preview: _preview, ...rest } = state;
  return rest;
};

async function freshActor(tx: Transaction, actor: Actor): Promise<Actor> {
  const doc = await tx.get(collection("Users").doc(actor.uid));
  const current = doc.exists
    ? ({ ...doc.data(), uid: actor.uid } as Actor)
    : null;
  requireActive(current);
  return current;
}
async function serviceRatesFor(
  tx: Transaction,
  state: SalesProject,
): Promise<ServiceRate[]> {
  const ids = [
    ...new Set(state.services.flatMap((s) => (s.rateId ? [s.rateId] : []))),
  ];
  return ids.length
    ? (await tx.getAll(...ids.map((id) => collection("ServiceRates").doc(id))))
        .filter((d) => d.exists)
        .map((d) => ({ ...d.data(), id: d.id }) as ServiceRate)
    : [];
}
export async function catalog(): Promise<Product[]> {
  const overrides = await collection("Prices").get();
  const map = new Map(
    overrides.docs.map((d) => [d.id, d.data().price as Price]),
  );
  return products.map((p) => ({ ...p, price: map.get(p.id) ?? p.price }));
}
export async function listServiceRates(actor: Actor) {
  const docs = await collection("ServiceRates").get();
  return docs.docs
    .map((d) => ({ ...d.data(), id: d.id }) as ServiceRate)
    .filter((r) => actor.role === "admin" || r.active);
}
export async function updatePrices(
  actor: Actor,
  changes: { productId: string; expectedRevision: number; price: Price }[],
) {
  return theaterDb().runTransaction(async (tx) => {
    requireAdmin(await freshActor(tx, actor));
    const docs = await tx.getAll(
      ...changes.map((c) => collection("Prices").doc(c.productId)),
    );
    const now = new Date().toISOString();
    const result = changes.map((c, i) => {
      const source = products.find((p) => p.id === c.productId);
      if (!source) throw new AccessError("Unknown catalog product.", 400);
      const old = docs[i].exists
        ? (docs[i].data()!.price as Price)
        : source.price;
      if (old.revision !== c.expectedRevision)
        throw new StoreConflict(
          "A price changed in another window. Refresh prices and try again.",
        );
      const price = { ...c.price, revision: old.revision + 1, updatedAt: now };
      tx.set(docs[i].ref, { price, updatedBy: attribution(actor) });
      tx.create(collection("Audit").doc(), {
        action: "price_updated",
        productId: c.productId,
        previous: old,
        price,
        actor: attribution(actor),
        createdAt: now,
      });
      return { productId: c.productId, price };
    });
    return result;
  });
}
export async function saveServiceRate(actor: Actor, rate: ServiceRate) {
  return theaterDb().runTransaction(async (tx) => {
    const current = await freshActor(tx, actor);
    requireAdmin(current);
    const ref = collection("ServiceRates").doc(rate.id),
      existing = await tx.get(ref);
    if ((existing.data()?.revision ?? 0) !== rate.revision)
      throw new StoreConflict(
        "This service rate changed. Refresh before saving.",
      );
    const next = { ...rate, revision: rate.revision + 1 };
    tx.set(ref, next);
    tx.create(collection("Audit").doc(), {
      action: "service_rate_updated",
      rate: next,
      actor: attribution(current),
      createdAt: new Date().toISOString(),
    });
    return next;
  });
}
export async function saveProject(
  actor: Actor,
  id: string,
  version: number,
  state: SalesProject,
): Promise<SavedProject> {
  requireDiscount(actor, state.discountPercent);
  const before = await collection("Projects").doc(id).get();
  if (before.exists) requireOwner(actor, before.data()!.ownerUid);
  const ownerUid = before.data()?.ownerUid ?? actor.uid;
  const previewPath = await storePreview(ownerUid, id, state.preview);
  return theaterDb().runTransaction(async (tx) => {
    const current = await freshActor(tx, actor);
    const ref = collection("Projects").doc(id),
      existing = await tx.get(ref);
    const rates = await serviceRatesFor(tx, state);
    requireDiscount(current, state.discountPercent);
    requireServiceRates(current, state.services, rates);
    if (existing.exists) requireOwner(current, existing.data()!.ownerUid);
    if (
      (existing.data()?.version ?? 0) !== version ||
      (!existing.exists && version !== 0)
    )
      throw new StoreConflict(
        "This project changed in another window. Reopen its latest version before saving.",
      );
    const now = new Date().toISOString();
    const project: SavedProject = clean({
      id,
      version: version + 1,
      name: state.customer.project || state.customer.name || "Untitled cinema",
      state: noPreview(state),
      ownerUid: existing.data()?.ownerUid ?? current.uid,
      createdBy: existing.data()?.createdBy ?? attribution(current),
      createdAt: existing.data()?.createdAt ?? now,
      updatedBy: attribution(current),
      updatedAt: now,
      previewPath: previewPath ?? existing.data()?.previewPath,
    });
    if (Buffer.byteLength(JSON.stringify(project)) > 800_000)
      throw new AccessError(
        "This project is too large. Reduce its notes or project-work lines.",
        400,
      );
    tx.set(ref, project, { merge: true });
    return project;
  });
}
export type ProjectSummary = Omit<SavedProject, "state">;
export async function listProjects(
  actor: Actor,
  cursor?: string,
  ownerUid?: string,
) {
  requireActive(actor);
  if (ownerUid && actor.role !== "admin" && ownerUid !== actor.uid)
    throw new AccessError("Project not found.", 404);
  let q =
    actor.role === "admin" && !ownerUid
      ? collection("Projects").orderBy("updatedAt", "desc")
      : collection("Projects")
          .where("ownerUid", "==", ownerUid ?? actor.uid)
          .orderBy("updatedAt", "desc");
  if (cursor) {
    const doc = await collection("Projects").doc(cursor).get();
    if (!doc.exists) throw new AccessError("Invalid project cursor.", 400);
    requireOwner(actor, doc.data()!.ownerUid);
    q = q.startAfter(doc);
  }
  const docs = await q.limit(51).get();
  return {
    projects: docs.docs.slice(0, 50).map((doc) => {
      const { state: _state, ...summary } = doc.data();
      return summary as ProjectSummary;
    }),
    nextCursor: docs.size > 50 ? docs.docs[49].id : null,
  };
}
export async function getProject(
  actor: Actor,
  id: string,
): Promise<SavedProject> {
  const doc = await collection("Projects").doc(id).get();
  if (!doc.exists) throw new AccessError("Project not found.", 404);
  const project = doc.data() as SavedProject;
  requireOwner(actor, project.ownerUid!);
  return project;
}
export async function listQuotes(
  actor: Actor,
  projectId?: string,
  cursor?: string,
) {
  requireActive(actor);
  if (projectId) await getProject(actor, projectId);
  let q = collection("Quotes").orderBy("createdAt", "desc");
  if (projectId) q = q.where("projectId", "==", projectId);
  else if (actor.role !== "admin") q = q.where("ownerUid", "==", actor.uid);
  if (cursor) {
    const doc = await collection("Quotes").doc(cursor).get();
    if (!doc.exists) throw new AccessError("Invalid quotation cursor.", 400);
    requireOwner(actor, doc.data()!.ownerUid);
    q = q.startAfter(doc);
  }
  const docs = await q.limit(51).get();
  return {
    quotes: docs.docs.slice(0, 50).map((d) => {
      const q = d.data() as QuoteSnapshot;
      return {
        id: q.id,
        number: q.number,
        revision: q.revision,
        projectId: q.projectId,
        createdAt: q.createdAt,
        ownerUid: q.ownerUid,
        createdBy: q.createdBy,
        customer: q.state.customer.name,
        project: q.state.customer.project,
        totalPaise: q.calculation.totalPaise,
        complete: q.calculation.complete,
      };
    }),
    nextCursor: docs.size > 50 ? docs.docs[49].id : null,
  };
}
export async function getQuote(
  actor: Actor,
  id: string,
): Promise<QuoteSnapshot> {
  const doc = await collection("Quotes").doc(id).get();
  if (!doc.exists) throw new AccessError("Quotation not found.", 404);
  const quote = doc.data() as QuoteSnapshot;
  requireOwner(actor, quote.ownerUid!);
  return quote;
}
export async function saveQuote(
  actor: Actor,
  input: {
    requestId: string;
    projectId: string;
    priceRevisions: Record<string, number>;
  },
  state: SalesProject,
): Promise<QuoteSnapshot> {
  const fingerprint = createHash("sha256")
    .update(
      JSON.stringify(
        clean({
          projectId: input.projectId,
          state: noPreview(state),
          priceRevisions: input.priceRevisions,
        }),
      ),
    )
    .digest("hex");
  return theaterDb().runTransaction(async (tx) => {
    const current = await freshActor(tx, actor);
    const projectRef = collection("Projects").doc(input.projectId),
      projectDoc = await tx.get(projectRef);
    if (!projectDoc.exists)
      throw new AccessError(
        "Save this project before generating a quotation.",
        400,
      );
    const project = projectDoc.data() as SavedProject;
    requireOwner(current, project.ownerUid!);
    const requestRef = collection("Requests").doc(
        `${actor.uid}_${input.requestId}`,
      ),
      requestDoc = await tx.get(requestRef);
    if (requestDoc.exists) {
      if (requestDoc.data()!.fingerprint !== fingerprint)
        throw new StoreConflict(
          "This quotation request was already used for different settings. Review and generate again.",
        );
      return (
        await tx.get(collection("Quotes").doc(requestDoc.data()!.quoteId))
      ).data() as QuoteSnapshot;
    }
    const selectedIds = new Set([
      ...activeSlots(state, products).flatMap((slot) =>
        slot === "extra"
          ? []
          : state.equipment.slots[slot]?.productId
            ? [state.equipment.slots[slot]!.productId]
            : [],
      ),
      ...state.equipment.extras.map((s) => s.productId),
    ]);
    const selected = products.filter((p) => selectedIds.has(p.id));
    if (selected.length !== selectedIds.size)
      throw new AccessError(
        "A selected model is no longer in the catalog. Refresh the model library.",
        400,
      );
    const prices = selected.length
      ? await tx.getAll(...selected.map((p) => collection("Prices").doc(p.id)))
      : [];
    const currentProducts = selected.map((p, i) => ({
      ...p,
      price: prices[i].exists ? (prices[i].data()!.price as Price) : p.price,
    }));
    const rates = await serviceRatesFor(tx, state);
    requireDiscount(current, state.discountPercent);
    requireServiceRates(current, state.services, rates);
    if (
      currentProducts.some(
        (p) => input.priceRevisions[p.id] !== p.price.revision,
      )
    )
      throw new StoreConflict(
        "Catalog prices changed. Refresh the library and review the total before generating.",
      );
    if (!state.customer.name.trim())
      throw new AccessError("Enter the customer's name first.", 400);
    const id = randomUUID(),
      revision = (projectDoc.data()!.quoteRevision ?? 0) + 1,
      createdAt = new Date().toISOString();
    const snapshot: QuoteSnapshot = clean({
      templateVersion: 2,
      company: quotationCompany,
      id,
      number: `EPIX-${new Date().getFullYear()}-${id.slice(0, 8).toUpperCase()}-R${revision}`,
      revision,
      projectId: input.projectId,
      ownerUid: project.ownerUid,
      createdBy: attribution(current),
      createdAt,
      validUntil: new Date(
        Date.now() + state.validityDays * 86400000,
      ).toISOString(),
      state: noPreview(state),
      previewPath: project.previewPath,
      calculation: calculateQuote(state, currentProducts),
      products: currentProducts,
    });
    tx.create(collection("Quotes").doc(id), snapshot);
    tx.create(requestRef, {
      fingerprint,
      quoteId: id,
      ownerUid: project.ownerUid,
    });
    tx.update(projectRef, { quoteRevision: revision });
    return snapshot;
  });
}
