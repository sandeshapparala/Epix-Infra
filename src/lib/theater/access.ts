import type { Product, SalesProject } from "./types";
import { lineDiscountLimit, selectedDiscountBrands } from "./discounts";
import { ACOUSTICS_CODE, ACOUSTICS_DESCRIPTION } from "./sound-services";
export type TheaterRole = "admin" | "employee";
export type TheaterMember = {
  uid: string;
  email: string;
  displayName: string;
  role: TheaterRole;
  active: boolean;
  maxDiscountPercent: number;
  revision: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
};
export type Actor = TheaterMember;
export type Attribution = { uid: string; name: string; email: string };
export const attribution = (actor: Actor): Attribution => ({
  uid: actor.uid,
  name: actor.displayName,
  email: actor.email,
});
export class AccessError extends Error {
  constructor(
    message: string,
    public status = 403,
  ) {
    super(message);
  }
}
export function requireActive(
  actor: Actor | null | undefined,
): asserts actor is Actor {
  if (
    !actor ||
    !actor.active ||
    !["admin", "employee"].includes(actor.role) ||
    !Number.isFinite(actor.maxDiscountPercent) ||
    actor.maxDiscountPercent < 0 ||
    actor.maxDiscountPercent > 100
  )
    throw new AccessError(
      "Your theatre workspace access is not active. Contact your administrator.",
    );
}
export function requireAdmin(actor: Actor) {
  requireActive(actor);
  if (actor.role !== "admin")
    throw new AccessError(
      "Only administrators can change prices, rates or team access.",
    );
}
export function requireOwner(actor: Actor, ownerUid: string) {
  requireActive(actor);
  if (actor.role !== "admin" && actor.uid !== ownerUid)
    throw new AccessError("Project not found.", 404);
}
export function requireDiscount(actor: Actor, discount: number) {
  requireActive(actor);
  const max = actor.role === "admin" ? 100 : actor.maxDiscountPercent;
  if (!Number.isFinite(discount) || discount < 0 || discount > max)
    throw new AccessError(
      `Your maximum allowed discount is ${max}%. Enter a discount from 0% to ${max}%.`,
    );
}
export function requireItemDiscounts(
  actor: Actor,
  state: SalesProject,
  products: Product[],
) {
  requireDiscount(actor, state.discountPercent);
  const employeeLimit = actor.role === "admin" ? 100 : actor.maxDiscountPercent;
  const brands = selectedDiscountBrands(state, products);
  for (const [key, discount] of Object.entries(state.lineDiscounts ?? {})) {
    const limit = lineDiscountLimit(brands.get(key) ?? "", employeeLimit);
    if (!Number.isFinite(discount) || discount < 0 || discount > limit)
      throw new AccessError(
        `This item's maximum allowed discount is ${limit}%. Review its discount before saving.`,
      );
  }
}
export function requireSelfSafe(
  actor: Actor,
  target: string,
  role: TheaterRole,
  active: boolean,
) {
  requireAdmin(actor);
  if (target === actor.uid && (role !== "admin" || !active))
    throw new AccessError("You cannot remove your own administrator access.");
}
export type ServiceRate = {
  id: string;
  category:
    | "installation"
    | "display"
    | "screen"
    | "seating"
    | "cabling"
    | "acoustics"
    | "other";
  description: string;
  unit: string;
  amountPaise: number;
  gstRate: number;
  active: boolean;
  revision: number;
};
export function requireServiceRates(
  actor: Actor,
  lines: {
    rateId?: string;
    amountPaise: number;
    gstRate: number;
    category: string;
    serviceCode?: string;
    description?: string;
    quantity?: number;
  }[],
  rates: ServiceRate[],
) {
  requireActive(actor);
  if (actor.role === "admin") return;
  for (const line of lines) {
    if (
      line.serviceCode === ACOUSTICS_CODE &&
      line.category === "acoustics" &&
      line.description === ACOUSTICS_DESCRIPTION &&
      line.quantity === 1 &&
      Number.isInteger(line.amountPaise) &&
      line.amountPaise >= 0 &&
      line.amountPaise <= 10_000_000_000
    )
      continue;
    const rate = rates.find((r) => r.id === line.rateId);
    if (
      !rate?.active ||
      rate.amountPaise !== line.amountPaise ||
      rate.category !== line.category
    )
      throw new AccessError(
        "Project-work rates must match the administrator's approved rates. Refresh rates and select the work again.",
      );
  }
}
