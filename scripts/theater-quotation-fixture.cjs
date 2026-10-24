require("./theater-test-loader.cjs");
const { randomUUID } = require("node:crypto");
const {
  DEFAULT_DESIGN,
} = require("../src/components/theater-builder/design.ts");
const { calculateQuote } = require("../src/lib/theater/quote.ts");
const catalog = require("../src/data/theater/products.json");
const company = require("../src/data/theater/quotation-company.json");

function sampleQuote() {
  const slots = {
    projector: "jvc-lx-nz30b",
    front: "polk-es55-pair",
    center: "polk-es30-unit",
    surround: "polk-es10-pair",
    rear: "polk-es10-pair",
    height: "polk-rc60i-round-pair",
    subwoofer: "svs-sb-1000-pro",
    receiver: "denon-avc-x6800h",
  };
  const products = catalog
    .filter((p) => Object.values(slots).includes(p.id))
    .map((p) => ({ ...p, price: { ...p.price } }));
  // This is a local visual fixture, never a change to catalog or client pricing.
  // The Denon source has inclusive GST without a numeric rate; 18% below is an
  // explicitly disclosed demonstration assumption, not an approved selling rate.
  products.find((p) => p.id === slots.receiver).price.gstRate = 18;
  const state = {
    design: { ...DEFAULT_DESIGN },
    equipment: {
      mode: "components",
      slots: Object.fromEntries(
        Object.entries(slots).map(([slot, id]) => {
          const p = products.find((p) => p.id === id);
          return [slot, { productId: id, finish: p.finishes[0] ?? "" }];
        }),
      ),
      extras: [],
    },
    customer: {
      name: "Demonstration client",
      project: "The Cinema Collection",
      phone: "",
      email: "",
      address: "Nellore, Andhra Pradesh",
    },
    services: [
      {
        id: randomUUID(),
        category: "screen",
        description: "Demonstration fixed-frame projection screen",
        quantity: 1,
        amountPaise: 5000000,
        gstRate: 18,
      },
      {
        id: randomUUID(),
        category: "installation",
        description: "Demonstration installation and calibration scope",
        quantity: 1,
        amountPaise: 2800000,
        gstRate: 18,
      },
    ],
    discountPercent: 5,
    validityDays: 15,
    terms:
      "TEMPLATE DEMONSTRATION ONLY - NOT A COMMERCIAL OFFER.\nPrices shown are catalog reference values. The receiver GST rate is assumed at 18% for this visual example and requires administrator confirmation. Project-work prices are demonstration amounts.\nPayment schedule, delivery timeline, installation scope and warranty terms must be confirmed in the actual customer quotation.",
    exclusions:
      "Civil works, electrical preparation, acoustic treatment, network infrastructure and other work are included only when expressly listed in the customer scope.",
  };
  return {
    id: randomUUID(),
    number: "EPIX-DEMO-ILLUSTRATED-R1",
    revision: 1,
    projectId: randomUUID(),
    createdAt: "2026-10-24T06:30:00.000Z",
    validUntil: "2026-11-08T06:30:00.000Z",
    state,
    products,
    calculation: calculateQuote(state, products),
    createdBy: {
      uid: "template-demo",
      name: "Epix design team",
      email: "hello@epixinfra.com",
    },
    templateVersion: 2,
    company,
  };
}
module.exports = { sampleQuote };
