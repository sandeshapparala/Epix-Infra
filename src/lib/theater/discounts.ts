import type { Product, SalesProject } from "./types";

// Brand policies apply to every item, including items added under extras.
export const BRAND_DISCOUNT_CAPS: Record<string, number> = { rotel: 10 };
export function brandDiscountCap(brand: string) {
  const key = brand.trim().toLowerCase();
  return Object.hasOwn(BRAND_DISCOUNT_CAPS, key)
    ? BRAND_DISCOUNT_CAPS[key]
    : 100;
}
export const lineDiscountLimit = (brand: string, employeeLimit: number) =>
  Math.min(brandDiscountCap(brand), employeeLimit);
export function appliedDiscount(
  state: Pick<SalesProject, "discountPercent" | "lineDiscounts">,
  key: string,
  brand: string,
) {
  const requested =
    state.lineDiscounts && Object.hasOwn(state.lineDiscounts, key)
      ? state.lineDiscounts[key]
      : state.discountPercent;
  return Math.min(requested, brandDiscountCap(brand));
}
export function selectedDiscountBrands(
  state: SalesProject,
  products: Product[],
) {
  const byId = new Map(products.map((p) => [p.id, p]));
  const brands = new Map<string, string>();
  for (const selection of [
    ...Object.values(state.equipment.slots),
    ...state.equipment.extras,
  ]) {
    const p = selection && byId.get(selection.productId);
    if (p) brands.set(p.id + "|" + selection!.finish, p.brand);
  }
  for (const s of state.services) brands.set(`service:${s.id}`, "Epix Infra");
  return brands;
}
