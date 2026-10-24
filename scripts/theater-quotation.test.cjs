require("./theater-test-loader.cjs");
const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const { PDFDocument, PDFName, PDFRawStream } = require("pdf-lib");
const { sampleQuote } = require("./theater-quotation-fixture.cjs");
const {
  quotationPdf,
  QUOTATION_TEMPLATE_VERSION,
} = require("../src/lib/theater/pdf.ts");
const { theaterReturnTo } = require("../src/lib/theater/navigation.ts");
const {
  localQuotationImage,
  quotationProduct,
} = require("../src/lib/theater/quotation-assets.ts");

test("sign-in returns to the builder by default and preserves safe theatre destinations", () => {
  for (const target of [
    null,
    "",
    "https://evil.example",
    "//evil.example",
    "/home-theater-builder-evil",
    "/home-theater-builder/login",
    "/admin",
    "/home-theater-builder/\\evil.example",
  ])
    assert.equal(theaterReturnTo(target), "/home-theater-builder");
  assert.equal(
    theaterReturnTo("/home-theater-builder?project=123"),
    "/home-theater-builder?project=123",
  );
  assert.equal(
    theaterReturnTo("/home-theater-builder/dashboard"),
    "/home-theater-builder/dashboard",
  );
});
test("every catalog model has a local photo and a bounded quotation JPEG", async () => {
  const products = require("../src/data/theater/products.json");
  assert.equal(products.length, 415);
  for (const p of products) {
    assert.ok(p.image, p.id);
    assert.ok(fs.existsSync(path.join(__dirname, "../public", p.image)), p.id);
    const bytes = await localQuotationImage(p);
    assert.ok(bytes?.length > 50, p.id);
    assert.equal(
      Buffer.from(bytes).subarray(0, 2).toString("hex"),
      "ffd8",
      p.id,
    );
  }
  assert.equal(
    await localQuotationImage({
      id: "unknown",
      quoteImage: "/../../secret.txt",
    }),
    null,
  );
});
test("illustrated PDF embeds model photos and preserves the saved quote values", async () => {
  const q = sampleQuote(),
    before = JSON.stringify(q),
    bytes = await quotationPdf(q);
  assert.equal(JSON.stringify(q), before);
  const pdf = await PDFDocument.load(bytes);
  assert.equal(pdf.getTitle(), q.number + " - Epix Infra");
  assert.ok(pdf.getPageCount() >= 2);
  const images = pdf.context
    .enumerateIndirectObjects()
    .filter(
      ([, v]) =>
        v instanceof PDFRawStream &&
        v.dict.get(PDFName.of("Subtype")) === PDFName.of("Image"),
    );
  assert.ok(
    images.length >= q.products.length,
    `Expected product images; got ${images.length}`,
  );
  for (const p of pdf.getPages()) {
    assert.equal(p.getWidth(), 595.28);
    assert.equal(p.getHeight(), 841.89);
  }
  assert.equal(QUOTATION_TEMPLATE_VERSION, "v2-illustrated");
});
test("old quote-line keys still resolve photos without using model-name guesses", () => {
  const q = sampleQuote(),
    line = q.calculation.lines.find((l) => l.productId);
  const old = { ...line };
  delete old.productId;
  assert.equal(quotationProduct(old, q.products).id, line.productId);
  assert.equal(
    quotationProduct({ ...old, key: "missing-model|Black" }, q.products),
    undefined,
  );
});
test("long scope and exclusions paginate without changing financial totals", async () => {
  const q = sampleQuote();
  q.state.terms =
    "A long installation-scope clause for pagination review. ".repeat(70);
  q.state.exclusions = "VeryLongIdentifier".repeat(200);
  const total = q.calculation.totalPaise;
  const pdf = await PDFDocument.load(await quotationPdf(q));
  assert.ok(pdf.getPageCount() > 2);
  assert.equal(q.calculation.totalPaise, total);
});
