require("./theater-test-loader.cjs");
const test = require("node:test"),
  assert = require("node:assert/strict");
const products = require("../src/data/theater/products.json");
const {
  pricingReviewReasons,
  catalogReviewSourceKey,
  catalogDetailsConfirmed,
} = require("../src/lib/theater/pricing-review.ts");
const {
  filterPricingProducts,
} = require("../src/lib/theater/pricing-filters.ts");
const { catalogReviewChange } = require("../src/lib/theater/validation.ts");
const find = (id) => {
  const p = products.find((p) => p.id === id);
  assert.ok(p, id);
  return p;
};
const filters = {
  search: "",
  brand: "",
  type: "",
  category: "",
  pending: true,
};

test("manual review combines missing prices, quantities, source conflicts and order details with existing filters", () => {
  const pending = filterPricingProducts(products, filters);
  assert.equal(pending.length, 32);
  assert.equal(
    pending.filter((p) =>
      pricingReviewReasons(p).some((r) => r.kind === "price"),
    ).length,
    14,
  );
  assert.equal(
    pending.filter((p) =>
      pricingReviewReasons(p).some((r) => r.kind === "unit"),
    ).length,
    16,
  );
  assert.equal(
    filterPricingProducts(products, {
      ...filters,
      brand: "KEF",
      review: "unit",
    }).length,
    12,
  );
  assert.equal(
    filterPricingProducts(products, {
      ...filters,
      brand: "Sonus faber",
      review: "details",
      search: "Arena",
    }).length,
    2,
  );
  const conflicts = filterPricingProducts(products, {
    ...filters,
    review: "conflict",
  });
  assert.equal(conflicts.length, 3);
  assert.ok(conflicts.some((p) => p.id === "polk-r200-unit"));
  assert.ok(
    !pending.some((p) => p.brand === "Marantz"),
    "Tax metadata and reference-card images are not review tasks",
  );
});

test("current confirmed price and quantity resolve stale source warnings without hiding unresolved amounts", () => {
  const alpha = find("canton-alpha-1");
  assert.ok(pricingReviewReasons(alpha).some((r) => r.kind === "price"));
  assert.deepEqual(
    pricingReviewReasons({
      ...alpha,
      price: { ...alpha.price, amountPaise: 45000000, revision: 3 },
    }),
    [],
  );
  const polk = find("polk-r200-unit");
  assert.ok(pricingReviewReasons(polk).some((r) => r.kind === "conflict"));
  assert.deepEqual(
    pricingReviewReasons({
      ...polk,
      price: { ...polk.price, unit: "pair", packSize: 2 },
    }),
    [],
  );
  const kit = products.find(
    (p) => p.brand === "Sonus faber" && p.model.includes("KIT320FIN"),
  );
  assert.ok(kit);
  assert.ok(pricingReviewReasons(kit).some((r) => r.kind === "conflict"));
  assert.deepEqual(
    pricingReviewReasons({
      ...kit,
      price: { ...kit.price, amountPaise: 5090000, revision: 1 },
    }),
    [],
  );
});

test("source confirmation requires a matching source and cannot conceal missing prices or billing quantities", () => {
  const sony = find("sony-zm2810-1y");
  assert.deepEqual(
    pricingReviewReasons(sony).map((r) => r.kind),
    ["unit", "details"],
  );
  const reviewed = {
    ...sony,
    review: {
      confirmed: true,
      note: "Company confirmed the coverage and order reference.",
      sourceKey: catalogReviewSourceKey(sony),
      revision: 1,
    },
  };
  assert.equal(catalogDetailsConfirmed(reviewed), true);
  assert.deepEqual(
    pricingReviewReasons(reviewed).map((r) => r.kind),
    ["unit"],
  );
  assert.deepEqual(
    pricingReviewReasons({
      ...reviewed,
      price: { ...sony.price, amountPaise: null },
    }).map((r) => r.kind),
    ["price", "unit"],
  );
  assert.equal(
    catalogDetailsConfirmed({
      ...reviewed,
      source: { ...sony.source, sha256: "changed-source" },
    }),
    false,
  );
  assert.ok(
    pricingReviewReasons({
      ...reviewed,
      review: { ...reviewed.review, confirmed: false },
    }).some((r) => r.kind === "details"),
  );
});

test("eight explicitly per-unit KEF descriptions no longer ask the company to reconfirm them", () => {
  const names = [
    "CI 200RR",
    "Ci200QR",
    "Ci200ER",
    "Ci130ER",
    "Ci130QR",
    "Ci130QS",
    "Ci160ER",
    "Ci160QR",
  ];
  const expected = [62000, 38000, 22000, 15000, 24000, 31500, 16000, 26000];
  names.forEach((name, i) => {
    const p = products.find((p) => p.brand === "KEF" && p.model === name);
    assert.ok(p, name);
    assert.match(p.description, /\bunit\b/i);
    assert.equal(p.price.unit, "unit");
    assert.equal(p.price.packSize, 1);
    assert.equal(p.price.amountPaise, expected[i] * 100);
    assert.deepEqual(pricingReviewReasons(p), []);
  });
});

test("review validation rejects client-authored attribution, empty evidence and stale-shaped revisions", () => {
  const input = {
    productId: "sony-zm2810-1y",
    expectedRevision: 0,
    note: "Company confirmed the accessory description.",
    confirmed: true,
  };
  assert.equal(catalogReviewChange.parse(input).confirmed, true);
  for (const change of [
    { note: "  " },
    { expectedRevision: -1 },
    { expectedRevision: 0.5 },
    { updatedBy: "forged" },
    { sourceKey: "forged" },
    { note: "x".repeat(2001) },
  ])
    assert.equal(
      catalogReviewChange.safeParse({ ...input, ...change }).success,
      false,
    );
});
