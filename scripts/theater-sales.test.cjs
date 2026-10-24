const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const ts = require("typescript");
// Compile the application's TypeScript for Node's test runner without a second
// copy of the business rules or requiring a browser/test-specific dependency.
require.extensions[".ts"] = (module, file) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText,
    file,
  );
const {
  DEFAULT_DESIGN,
} = require("../src/components/theater-builder/design.ts");
const {
  calculateQuote,
  compatibility,
  applyProjector,
} = require("../src/lib/theater/quote.ts");
const {
  parseProject,
  priceChanges,
} = require("../src/lib/theater/validation.ts");
const products = require("../src/data/theater/products.json");
const sources = require("../src/data/theater/sources.json");
const { feetAndInches, formatLength, lengthStep, METRES_PER_FOOT, METRES_PER_INCH } = require("../src/lib/theater/measurements.ts");
const { visualDesign } = require("../src/lib/theater/visual-design.ts");
const {
  calculateDesign,
} = require("../src/components/theater-builder/design.ts");
const product = (id) => {
  const p = products.find((p) => p.id === id);
  assert.ok(p, id);
  return p;
};

test("feet-first measurements carry twelve rounded inches and retain negative clearances", () => {
  assert.equal(formatLength(4.8), "15 ft 9 in");
  assert.equal(formatLength(7), "23 ft 0 in");
  assert.deepEqual(feetAndInches(11.999 * METRES_PER_INCH), { feet: 1, inches: 0 });
  assert.equal(formatLength(-1.5 * METRES_PER_FOOT), "−1 ft 6 in");
  assert.equal(formatLength(-0.001), "0 ft 0 in");
  assert.equal(formatLength(4.8, "m"), "4.80 m");
});

test("imperial increments use one exact inch without changing metric geometry", () => {
  const width = 15 * METRES_PER_FOOT + 9 * METRES_PER_INCH;
  assert.equal(formatLength(width), "15 ft 9 in");
  assert.equal(formatLength(width + lengthStep("ft")), "15 ft 10 in");
  assert.equal(lengthStep("m"), 0.05);
  const restored = parseProject({ ...state(), design: { ...DEFAULT_DESIGN, width } });
  assert.equal(restored.design.width, width);
});
function state() {
  return {
    design: { ...DEFAULT_DESIGN },
    equipment: { mode: "components", slots: {}, extras: [] },
    customer: {
      name: "Test customer",
      phone: "",
      email: "",
      project: "Validation cinema",
      address: "",
    },
    services: [],
    discountPercent: 0,
    validityDays: 15,
    terms: "",
    exclusions: "",
  };
}
test("all nine source catalogs import with unique identifiers and existing images", () => {
  assert.equal(products.length, 415);
  assert.equal(sources.length, 9);
  assert.equal(new Set(products.map((p) => p.id)).size, 415);
  assert.deepEqual(
    sources.map((s) => s.products),
    [86, 6, 56, 13, 72, 85, 15, 13, 69],
  );
  assert.equal(products.filter((p) => p.image).length, 415);
  for (const p of products) {
    assert.ok(p.description || p.model);
    assert.ok(p.source.page > 0);
    assert.ok(p.source.sha256.length === 64);
    if (p.image)
      assert.ok(fs.existsSync(path.join(__dirname, "../public", p.image)));
  }
});
test("source ambiguities remain unresolved and accessory grilles are not offered as speakers", () => {
  assert.equal(product("polk-r200-unit").price.unit, "unknown");
  assert.equal(product("faith-fc-690").price.taxBasis, "exclusive");
  assert.equal(product("canton-alpha-1").price.amountPaise, null);
  assert.ok(
    products.filter(
      (p) => p.brand === "Klipsch" && p.price.amountPaise === null,
    ).length > 0,
  );
  assert.ok(
    products
      .filter((p) => p.description === "GRILL")
      .every(
        (p) =>
          p.category === "accessory" &&
          p.roles.length === 1 &&
          p.roles[0] === "extra",
      ),
  );
  assert.deepEqual(
    products
      .filter((p) => p.brand === "SVS")
      .map((p) => p.price.amountPaise / 100),
    [
      145500, 188500, 288500, 495000, 570000, 104500, 154500, 174500, 160500,
      199500, 219500, 400000, 495000, 299000, 449000,
    ],
  );
  assert.ok(
    products
      .filter((p) => p.price.amountPaise !== null)
      .every((p) => p.price.amountPaise >= 100000),
    "Currency prefixes must not turn rupees into fractional prices",
  );
  assert.equal(product("polk-rc80i-round-pair").category, "ceiling");
  assert.equal(product("kef-ci250trb").category, "subwoofer");
});
test("the same pair SKU assigned to side and rear channels is combined before pack rounding", () => {
  const s = state();
  const p = product("polk-es15-pair");
  s.equipment.slots.surround = { productId: p.id, finish: p.finishes[0] };
  s.equipment.slots.rear = { productId: p.id, finish: p.finishes[0] };
  const q = calculateQuote(s, products);
  assert.equal(q.lines.length, 1);
  assert.equal(q.lines[0].required, 4);
  assert.equal(q.lines[0].quantity, 2);
  assert.equal(q.lines[0].spare, 0);
  assert.equal(q.totalPaise, p.price.amountPaise * 2);
});
test("odd speaker requirements round to whole purchasable pairs and disclose the spare", () => {
  const s = state();
  const p = product("polk-es15-pair");
  s.equipment.slots.front = { productId: p.id, finish: p.finishes[0] };
  s.equipment.slots.center = { productId: p.id, finish: p.finishes[0] };
  const l = calculateQuote(s, products).lines[0];
  assert.equal(l.required, 3);
  assert.equal(l.quantity, 2);
  assert.equal(l.spare, 1);
});
test("tax-inclusive list prices are not taxed twice; discounts apply before GST", () => {
  const s = state();
  const p = product("jvc-dla-nz500be");
  s.equipment.slots.projector = { productId: p.id, finish: "" };
  let q = calculateQuote(s, products);
  assert.equal(q.totalPaise, 73999900);
  assert.equal(q.subtotalPaise + q.taxPaise, q.totalPaise);
  s.discountPercent = 10;
  q = calculateQuote(s, products);
  assert.ok(Math.abs(q.totalPaise - 73999900 * 0.9) <= 1);
  assert.equal(q.totalPaise, q.subtotalPaise - q.discountPaise + q.taxPaise);
  for (const p of products.filter(
    (p) =>
      p.price.taxBasis === "inclusive" &&
      p.price.gstRate !== null &&
      p.price.unit !== "unknown" &&
      p.price.amountPaise !== null,
  )) {
    const sample = state();
    sample.equipment.extras = [
      {
        productId: p.id,
        finish: p.finishes[0] ?? "",
        quantity: p.price.packSize,
      },
    ];
    assert.equal(
      calculateQuote(sample, products).totalPaise,
      p.price.amountPaise,
      `${p.id} must preserve its inclusive price exactly`,
    );
  }
});
test("unconfirmed prices are excluded from the known total and never become free products", () => {
  const s = state();
  s.equipment.slots.front = { productId: "canton-alpha-1", finish: "" };
  const q = calculateQuote(s, products);
  assert.equal(q.totalPaise, 0);
  assert.equal(q.pending, 1);
  assert.equal(q.complete, false);
  assert.equal(q.lines[0].totalPaise, null);
});
test("receiver processing and amplification are checked separately", () => {
  const s = state();
  const receiver = product("denon-avc-x3800h");
  s.equipment.slots.receiver = { productId: receiver.id, finish: "" };
  const warnings = compatibility(receiver, "receiver", s);
  assert.ok(warnings.some((w) => w.text.includes("2 additional")));
  assert.ok(
    calculateQuote(s, products).missing.includes("Additional power amplifier"),
  );
  assert.ok(
    compatibility(product("denon-avr-x1800h"), "receiver", s).some(
      (w) => w.level === "error",
    ),
  );
});
test("projector selection applies verified lens and brightness values and resets its track override", () => {
  const d = {
    ...DEFAULT_DESIGN,
    positions: { projector: [0, 2, 5], "row-0": [0, 0, 3.8] },
  };
  const next = applyProjector(d, product("jvc-dla-nz500be"));
  assert.equal(next.throwMin, 1.34);
  assert.equal(next.throwMax, 2.14);
  assert.equal(next.lumens, 2000);
  assert.equal(next.positions.projector, undefined);
  assert.equal(next.positions["row-0"][2], 3.8);
});
test("complete packages suppress component charging while retaining dormant selections for later", () => {
  const s = state();
  s.design.audio = "5.1";
  s.equipment.mode = "package";
  s.equipment.slots.package = { productId: "onkyo-hts-3910", finish: "Black" };
  s.equipment.slots.front = { productId: "polk-es60-pair", finish: "BLACK" };
  s.equipment.slots.receiver = { productId: "denon-avr-x1800h", finish: "" };
  s.equipment.slots.amplifier = { productId: "denon-pma-600ne", finish: "" };
  const q = calculateQuote(s, products);
  assert.equal(q.lines.length, 1);
  assert.equal(q.lines[0].model, "HTS-3910");
  assert.equal(q.issues.filter((i) => i.level === "error").length, 0);
});
test("saved state and price update validation reject malformed values and pack mismatches", () => {
  assert.equal(parseProject(state()).design.width, DEFAULT_DESIGN.width);
  assert.throws(() => parseProject({ ...state(), discountPercent: 101 }));
  const p = product("polk-es15-pair");
  assert.throws(() =>
    priceChanges.parse({
      changes: [
        {
          productId: p.id,
          expectedRevision: 0,
          price: { ...p.price, packSize: 1 },
        },
      ],
    }),
  );
  assert.throws(() =>
    parseProject({
      ...state(),
      equipment: {
        ...state().equipment,
        slots: { __unexpected__: { productId: p.id, finish: "" } },
      },
    }),
  );
});
test("custom project work adds a screen and calculates its quantity, discount and GST", () => {
  const s = state();
  s.services = [
    {
      id: "screen",
      category: "screen",
      description: "Projection screen",
      quantity: 1,
      amountPaise: 1000000,
      gstRate: 18,
    },
  ];
  s.discountPercent = 10;
  const q = calculateQuote(s, products);
  assert.equal(q.totalPaise, 1062000);
  assert.ok(!q.missing.some((s) => s.startsWith("Projection screen")));
});
test("database updates are durable, conflict checked and quotation snapshots are immutable", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "epix-sales-test-"));
  process.env.THEATER_DATABASE_URL =
    "file:" + path.join(dir, "studio.db").replaceAll("\\", "/");
  const db = require("../src/lib/theater/database.ts");
  const original = (await db.catalog()).find((p) => p.id === "jvc-dla-nz500be");
  const id = crypto.randomUUID(),
    request = crypto.randomUUID();
  const s = state();
  s.equipment.slots.projector = { productId: original.id, finish: "" };
  const project = await db.saveProject(id, 0, s);
  assert.equal(project.version, 1);
  assert.equal((await db.getProject(id)).state.customer.name, s.customer.name);
  await assert.rejects(db.saveProject(id, 0, s), db.Conflict);
  const snapshot = await db.saveQuote(request, id, (qid, revision, number) => ({
    id: qid,
    revision,
    number,
    projectId: id,
    createdAt: new Date().toISOString(),
    validUntil: new Date().toISOString(),
    state: s,
    calculation: calculateQuote(s, awaitedProducts),
    products: [original],
  }));
  await db.updatePrices([
    {
      productId: original.id,
      expectedRevision: 0,
      price: { ...original.price, amountPaise: 80000000 },
    },
  ]);
  await assert.rejects(
    db.updatePrices([
      { productId: original.id, expectedRevision: 0, price: original.price },
    ]),
    db.Conflict,
  );
  assert.equal(
    (await db.catalog()).find((p) => p.id === original.id).price.amountPaise,
    80000000,
  );
  assert.equal(
    (await db.getQuote(snapshot.id)).products[0].price.amountPaise,
    73999900,
  );
  const repeated = await db.saveQuote(request, id, () => {
    throw new Error("Idempotency failed");
  });
  assert.equal(repeated.id, snapshot.id);
  const conn = await db.database();
  assert.ok(fs.statSync(path.join(dir, "studio.db")).size > 0);
  conn.close();
  // Windows native libSQL handles can release after process exit; retain this
  // isolated OS-temp test database instead of deleting an open native handle.
});
const awaitedProducts = products;

test("selected source dimensions scale the scene and take part in room-fit calculations", () => {
  const s = state();
  s.equipment.slots.front = { productId: "polk-es60-pair", finish: "BLACK" };
  const visual = visualDesign(s.design, s.equipment, products);
  assert.deepEqual(visual.equipmentSizes.L, [0.2159, 1.1303, 0.39878]);
  assert.deepEqual(
    calculateDesign(visual).sound.speakers.find((x) => x.id === "L").size,
    [0.2159, 1.1303, 0.39878],
  );
  assert.equal(s.design.equipmentSizes, undefined);
});
test("resetting room defaults cannot detach selected projector specifications from its drag track", () => {
  const s = state();
  s.equipment.slots.projector = { productId: "jvc-dla-nz500be", finish: "" };
  const visual = visualDesign({ ...DEFAULT_DESIGN }, s.equipment, products);
  assert.equal(visual.throwMin, 1.34);
  assert.equal(visual.throwMax, 2.14);
  assert.equal(visual.lumens, 2000);
});
test("physical room conflicts appear in quotation review instead of a complete quotation", () => {
  const s = state();
  s.design.width = 3;
  s.design.seats = 5;
  const q = calculateQuote(s, products);
  assert.equal(q.complete, false);
  assert.ok(
    q.issues.some((i) => i.level === "error" && /exceed|outside/i.test(i.text)),
  );
});

test("fractional project-work quantities round once to whole paise before tax", () => {
  const s = state();
  s.services = [
    {
      id: "wire",
      category: "cabling",
      description: "Cable run",
      quantity: 0.333,
      amountPaise: 999,
      gstRate: 18,
    },
  ];
  const q = calculateQuote(s, products);
  assert.equal(q.subtotalPaise, 333);
  assert.equal(q.taxPaise, 60);
  assert.equal(q.totalPaise, 393);
});

test("a dual-subwoofer set supplies two cabinets with one billable set", () => {
  const s = state();
  s.equipment.slots.subwoofer = {
    productId: "svs-3000-in-wall-dual-subwoofer-system",
    finish: "",
  };
  const q = calculateQuote(s, products);
  assert.equal(q.lines[0].required, 2);
  assert.equal(q.lines[0].quantity, 1);
  assert.equal(q.lines[0].totalPaise, 44900000);
});
test("an LCR-only package still requires surrounds, bass and amplification", () => {
  const s = state();
  s.design.audio = "5.1";
  s.equipment.mode = "package";
  s.equipment.slots.package = {
    productId: "polk-es-on-wall-l-c-r-package",
    finish: "",
  };
  s.equipment.slots.front = { productId: "polk-es60-pair", finish: "BLACK" };
  const q = calculateQuote(s, products);
  assert.equal(q.lines.length, 1);
  assert.ok(q.missing.includes("Side surrounds"));
  assert.ok(q.missing.includes("Subwoofers"));
  assert.ok(q.missing.includes("AV receiver"));
  assert.ok(!q.missing.includes("Front left & right"));
});
test("a packaged receiver cannot silently support an eleven-channel upgrade", () => {
  const s = state();
  s.equipment.mode = "package";
  s.equipment.slots.package = { productId: "onkyo-hts-3910", finish: "Black" };
  const q = calculateQuote(s, products);
  assert.ok(
    q.issues.some(
      (i) => i.level === "error" && i.text.includes("included receiver"),
    ),
  );
});
