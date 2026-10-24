require("./theater-test-loader.cjs");
if (
  process.env.FIREBASE_ADMIN_PROJECT_ID !== "demo-epix-theater" ||
  !process.env.FIREBASE_AUTH_EMULATOR_HOST ||
  !process.env.FIRESTORE_EMULATOR_HOST
)
  throw new Error("This command only seeds demo-epix-theater emulators.");
const { theaterAuth } = require("../src/lib/theater/firebase-admin.ts"),
  store = require("../src/lib/theater/firestore-store.ts");
const {
    DEFAULT_DESIGN,
  } = require("../src/components/theater-builder/design.ts"),
  { EMPTY_CUSTOMER, EMPTY_EQUIPMENT } = require("../src/lib/theater/types.ts");
const crypto = require("node:crypto");
(async () => {
  const members = [];
  for (const [email, name, role, max] of [
    ["qa-admin@epix.example", "Demo Admin", "admin", 100],
    ["qa-employee@epix.example", "Demo Employee", "employee", 5],
    ["qa-colleague@epix.example", "Demo Colleague", "employee", 8],
  ]) {
    let user;
    try {
      user = await theaterAuth().getUserByEmail(email);
    } catch (e) {
      if (e.code !== "auth/user-not-found") throw e;
      user = await theaterAuth().createUser({
        email,
        displayName: name,
        password: "Local-Emulator-Only-123!",
      });
    }
    const now = new Date().toISOString(),
      member = {
        uid: user.uid,
        email,
        displayName: name,
        role,
        maxDiscountPercent: max,
        active: true,
        revision: 1,
        createdAt: now,
        updatedAt: now,
        createdBy: "local-emulator-fixture",
      };
    await store.collection("Users").doc(user.uid).set(member);
    members.push(member);
  }
  const admin = members[0];
  const existing = await store
    .collection("ServiceRates")
    .where("description", "==", "Demonstration screen")
    .get();
  let rate = existing.docs[0]?.data();
  if (!rate)
    rate = await store.saveServiceRate(admin, {
      id: crypto.randomUUID(),
      description: "Demonstration screen",
      category: "screen",
      unit: "unit",
      amountPaise: 5000000,
      gstRate: 18,
      active: true,
      revision: 0,
    });
  for (const [i, member] of members.entries()) {
    const existing = await store.listProjects(member);
    if (existing.projects.some((p) => p.name.startsWith("Demo cinema")))
      continue;
    const state = {
      design: DEFAULT_DESIGN,
      equipment: EMPTY_EQUIPMENT,
      customer: {
        ...EMPTY_CUSTOMER,
        name: `Demo client ${i + 1}`,
        project: `Demo cinema ${i + 1}`,
      },
      services: [
        {
          id: crypto.randomUUID(),
          rateId: rate.id,
          category: rate.category,
          description: rate.description,
          amountPaise: rate.amountPaise,
          gstRate: rate.gstRate,
          quantity: 1,
        },
      ],
      discountPercent: Math.min(5, member.maxDiscountPercent),
      validityDays: 15,
      terms: "Demonstration only",
      exclusions: "Not a commercial quotation",
    };
    const p = await store.saveProject(member, crypto.randomUUID(), 0, state);
    await store.saveQuote(
      member,
      { requestId: crypto.randomUUID(), projectId: p.id, priceRevisions: {} },
      state,
    );
  }
  console.log(
    "Local emulator fixtures ready: demo admin and employees. No real Firebase accounts were changed.",
  );
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
