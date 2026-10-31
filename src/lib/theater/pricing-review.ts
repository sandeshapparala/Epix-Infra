import type { Product } from "./types";

export const PRICING_REVIEW_TYPES = [
  { value: "price", label: "Missing price" },
  { value: "unit", label: "Billing quantity" },
  { value: "conflict", label: "Source conflict" },
  { value: "details", label: "Product / order details" },
] as const;
export type PricingReviewKind = (typeof PRICING_REVIEW_TYPES)[number]["value"];
export type PricingReviewReason = { kind: PricingReviewKind; text: string };

// Ordering ambiguities need a recorded admin confirmation. Installation checks,
// unpictured accessories and historic tax metadata are not pricing review tasks.
export function catalogDetailIssues(p: Product): string[] {
  return p.issues.filter((issue) =>
    /accessory code only:|confirm the order code/i.test(issue),
  );
}
export function catalogReviewSourceKey(p: Product): string {
  return JSON.stringify([
    p.source.sha256,
    p.source.page,
    p.model,
    catalogDetailIssues(p),
  ]);
}
export function catalogDetailsConfirmed(p: Product): boolean {
  return !!(
    p.review?.confirmed && p.review.sourceKey === catalogReviewSourceKey(p)
  );
}
export function pricingReviewReasons(p: Product): PricingReviewReason[] {
  const reasons: PricingReviewReason[] = [];
  const missingPrice = p.price.amountPaise === null;
  const missingUnit = p.price.unit === "unknown" || p.price.packSize === null;
  if (missingPrice)
    reasons.push({
      kind: "price",
      text: "Enter the confirmed final selling price.",
    });
  if (missingUnit)
    reasons.push({
      kind: "unit",
      text: "Confirm one piece, a pair, or a set and its quantity.",
    });
  if (missingPrice)
    for (const issue of p.issues.filter((i) =>
      /different prices for this same/i.test(i),
    ))
      reasons.push({ kind: "conflict", text: issue });
  if (missingUnit)
    for (const issue of p.issues.filter((i) =>
      /source model says Unit; description says Pair/i.test(i),
    ))
      reasons.push({ kind: "conflict", text: issue });
  if (!catalogDetailsConfirmed(p))
    for (const issue of catalogDetailIssues(p))
      reasons.push({ kind: "details", text: issue });
  return reasons;
}
