import type { Product } from "./types";

const CATEGORIES: Record<string, { label: string; type: string }> = {
  floorstanding: { label: "Floorstanding speakers", type: "speakers" },
  bookshelf: { label: "Bookshelf speakers", type: "speakers" },
  center: { label: "Centre speakers", type: "speakers" },
  height: { label: "Height / Atmos speakers", type: "speakers" },
  "on-wall": { label: "On-wall speakers", type: "speakers" },
  ceiling: { label: "In-ceiling speakers", type: "speakers" },
  "in-wall": { label: "In-wall speakers", type: "speakers" },
  "active-speaker": { label: "Active speakers", type: "speakers" },
  soundbar: { label: "Soundbars", type: "speakers" },
  outdoor: { label: "Outdoor speakers", type: "speakers" },
  "stereo-speaker": { label: "Stereo speakers", type: "speakers" },
  subwoofer: { label: "Subwoofers", type: "subwoofers" },
  projector: { label: "Projectors", type: "projectors" },
  receiver: { label: "AV receivers", type: "electronics" },
  amplifier: { label: "Amplifiers", type: "electronics" },
  package: { label: "Theatre packages", type: "packages" },
  accessory: { label: "Accessories", type: "accessories" },
  other: { label: "Other equipment", type: "accessories" },
};

export const PRICING_TYPES = [
  { value: "speakers", label: "Speakers" },
  { value: "subwoofers", label: "Subwoofers" },
  { value: "projectors", label: "Projectors" },
  { value: "electronics", label: "Receivers & amplifiers" },
  { value: "packages", label: "Theatre packages" },
  { value: "accessories", label: "Accessories & other equipment" },
];

export function pricingType(category: string): string {
  return CATEGORIES[category]?.type ?? "accessories";
}

export function pricingCategoryLabel(category: string): string {
  return CATEGORIES[category]?.label ?? category.replaceAll("-", " ");
}

export type PricingFilters = {
  search: string;
  brand: string;
  type: string;
  category: string;
  pending: boolean;
};

export function filterPricingProducts(
  products: Product[],
  filters: PricingFilters,
) {
  const query = filters.search.trim().toLowerCase();
  return products.filter(
    (p) =>
      (!filters.type || pricingType(p.category) === filters.type) &&
      (!filters.category || p.category === filters.category) &&
      (!filters.brand || p.brand === filters.brand) &&
      (!query ||
        `${p.id} ${p.brand} ${p.model} ${p.series} ${pricingCategoryLabel(p.category)}`
          .toLowerCase()
          .includes(query)) &&
      (!filters.pending ||
        p.price.amountPaise === null ||
        p.price.taxBasis === "unknown" ||
        p.price.unit === "unknown" ||
        p.price.gstRate === null),
  );
}
