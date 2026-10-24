// Real Firebase Auth, Firestore and Storage emulators; never a production fallback.
require("./theater-test-loader.cjs");
const test = require("node:test"),
  assert = require("node:assert/strict"),
  crypto = require("node:crypto");
if (
  !process.env.FIRESTORE_EMULATOR_HOST ||
  !process.env.FIREBASE_AUTH_EMULATOR_HOST ||
  !process.env.FIREBASE_STORAGE_EMULATOR_HOST ||
  process.env.FIREBASE_ADMIN_PROJECT_ID !== "demo-epix-theater"
)
  throw new Error(
    "Run with the theatre emulator test script and demo-epix-theater.",
  );
const {
  theaterAuth,
  theaterDb,
  theaterBucket,
} = require("../src/lib/theater/firebase-admin.ts");
const { authenticate } = require("../src/lib/theater/server-auth.ts");
const store = require("../src/lib/theater/firestore-store.ts");
const projectRoutes = require("../src/app/api/theater/projects/route.ts");
const projectRoute = require("../src/app/api/theater/projects/[id]/route.ts");
const quoteRoutes = require("../src/app/api/theater/quotes/route.ts");
const pdfRoute = require("../src/app/api/theater/quotes/[id]/pdf/route.ts");
const pricesRoute = require("../src/app/api/theater/prices/route.ts");
const ratesRoute = require("../src/app/api/theater/service-rates/route.ts");
const catalogRoute = require("../src/app/api/theater/catalog/route.ts");
const team = require("../src/lib/theater/team.ts");
const {
  DEFAULT_DESIGN,
} = require("../src/components/theater-builder/design.ts");
const {
  EMPTY_CUSTOMER,
  EMPTY_EQUIPMENT,
} = require("../src/lib/theater/types.ts");
const prefix = crypto.randomUUID().slice(0, 8),
  users = {},
  tokens = {};
const state = (discount = 0) => ({
  design: DEFAULT_DESIGN,
  equipment: EMPTY_EQUIPMENT,
  customer: {
    ...EMPTY_CUSTOMER,
    name: "Demonstration client",
    project: "Emulator QA cinema",
  },
  services: [],
  discountPercent: discount,
  validityDays: 15,
  terms: "Test only",
  exclusions: "",
});
const request = (
  who,
  path = "/api/theater/projects",
  body,
  method = body ? "POST" : "GET",
) =>
  new Request(`http://localhost:3011${path}`, {
    method,
    headers: {
      ...(who ? { Authorization: `Bearer ${tokens[who]}` } : {}),
      "Content-Type": "application/json",
      Origin: "http://localhost:3011",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
const params = (id) => ({ params: Promise.resolve({ id }) });
async function signIn(email, password) {
  const r = await fetch(
    `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=emulator`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  const v = await r.json();
  assert.ok(v.idToken, JSON.stringify(v));
  return v.idToken;
}
test.before(async () => {
  for (const [name, role, max] of [
    ["admin", "admin", 100],
    ["alice", "employee", 10],
    ["bob", "employee", 5],
    ["outsider", null, 0],
  ]) {
    const email = `${prefix}-${name}@example.invalid`,
      password = "EmulatorOnly-Password-123!";
    const user = await theaterAuth().createUser({
      email,
      password,
      displayName: `QA ${name}`,
    });
    if (role) {
      const now = new Date().toISOString();
      const member = {
        uid: user.uid,
        email,
        displayName: `QA ${name}`,
        role,
        active: true,
        maxDiscountPercent: max,
        revision: 1,
        createdAt: now,
        updatedAt: now,
        createdBy: "emulator-qa",
      };
      await store.collection("Users").doc(user.uid).set(member);
      users[name] = member;
    } else users[name] = { uid: user.uid };
    tokens[name] = await signIn(email, password);
  }
});
test("anonymous, invalid-token and unregistered Firebase accounts cannot read the catalog", async () => {
  assert.equal(
    (await catalogRoute.GET(request(null, "/api/theater/catalog"))).status,
    401,
  );
  const bad = request(null, "/api/theater/catalog");
  bad.headers.set("Authorization", "Bearer forged-token");
  assert.equal((await catalogRoute.GET(bad)).status, 401);
  assert.equal(
    (await catalogRoute.GET(request("outsider", "/api/theater/catalog")))
      .status,
    403,
  );
  assert.equal(
    (await catalogRoute.GET(request("alice", "/api/theater/catalog"))).status,
    200,
  );
});
let aliceProject, bobProject, firstQuote;
test("project creation stamps its creator; employee lists and direct reads are isolated", async () => {
  for (const who of ["alice", "bob"]) {
    const id = crypto.randomUUID();
    const r = await projectRoutes.POST(
      request(who, undefined, { id, version: 0, state: state() }),
    );
    assert.equal(r.status, 200, JSON.stringify(await r.clone().json()));
    const p = await r.json();
    assert.equal(p.ownerUid, users[who].uid);
    assert.equal(p.createdBy.uid, users[who].uid);
    if (who === "alice") aliceProject = p;
    else bobProject = p;
  }
  const mine = await store.listProjects(users.alice);
  assert.ok(mine.projects.every((p) => p.ownerUid === users.alice.uid));
  const all = await store.listProjects(users.admin);
  assert.ok(
    all.projects.some((p) => p.id === aliceProject.id) &&
      all.projects.some((p) => p.id === bobProject.id),
  );
  assert.equal(
    (await projectRoute.GET(request("bob"), params(aliceProject.id))).status,
    404,
  );
  assert.equal(
    (
      await projectRoutes.POST(
        request("bob", undefined, {
          id: aliceProject.id,
          version: 1,
          state: state(),
        }),
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await projectRoutes.POST(
        request("alice", undefined, {
          id: crypto.randomUUID(),
          version: 0,
          ownerUid: users.bob.uid,
          state: state(),
        }),
      )
    ).status,
    400,
  );
});
test("employee maximum discounts are enforced on saves and generation, including direct API calls", async () => {
  for (const value of [0, 9.5, 10]) {
    const r = await projectRoutes.POST(
      request("alice", undefined, {
        id: crypto.randomUUID(),
        version: 0,
        state: state(value),
      }),
    );
    assert.equal(r.status, 200);
  }
  assert.equal(
    (
      await projectRoutes.POST(
        request("alice", undefined, {
          id: crypto.randomUUID(),
          version: 0,
          state: state(10.01),
        }),
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await quoteRoutes.POST(
        request("alice", "/api/theater/quotes", {
          requestId: crypto.randomUUID(),
          projectId: aliceProject.id,
          state: state(99),
          priceRevisions: {},
        }),
      )
    ).status,
    403,
  );
});
test("employees cannot update prices or approved rates; admin price changes are audited and conflict checked", async () => {
  const p = (await store.catalog()).find((p) => p.price.amountPaise > 0),
    body = {
      changes: [
        {
          productId: p.id,
          expectedRevision: p.price.revision,
          price: { ...p.price, amountPaise: p.price.amountPaise + 100 },
        },
      ],
    };
  delete body.changes[0].price.updatedAt;
  assert.equal(
    (
      await pricesRoute.PUT(
        request("alice", "/api/theater/prices", body, "PUT"),
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await pricesRoute.PUT(
        request("admin", "/api/theater/prices", body, "PUT"),
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await pricesRoute.PUT(
        request("admin", "/api/theater/prices", body, "PUT"),
      )
    ).status,
    409,
  );
  assert.equal(
    (
      await ratesRoute.PUT(
        request("alice", "/api/theater/service-rates", {}, "PUT"),
      )
    ).status,
    403,
  );
  const audit = await store
    .collection("Audit")
    .where("productId", "==", p.id)
    .get();
  assert.ok(audit.docs.some((d) => d.data().actor.uid === users.admin.uid));
});
test("approved service rates cannot be reduced or replaced with arbitrary employee rates", async () => {
  const rate = await store.saveServiceRate(users.admin, {
    id: crypto.randomUUID(),
    category: "screen",
    description: "QA approved screen",
    unit: "unit",
    amountPaise: 500000,
    gstRate: 18,
    active: true,
    revision: 0,
  });
  const good = {
    ...state(),
    services: [
      {
        id: crypto.randomUUID(),
        rateId: rate.id,
        category: rate.category,
        description: rate.description,
        amountPaise: rate.amountPaise,
        gstRate: 18,
        quantity: 1,
      },
    ],
  };
  assert.equal(
    (
      await projectRoutes.POST(
        request("alice", undefined, {
          id: crypto.randomUUID(),
          version: 0,
          state: good,
        }),
      )
    ).status,
    200,
  );
  for (const changes of [
    { amountPaise: 1 },
    { gstRate: 0 },
    { rateId: undefined },
  ]) {
    const bad = { ...good, services: [{ ...good.services[0], ...changes }] };
    assert.equal(
      (
        await projectRoutes.POST(
          request("alice", undefined, {
            id: crypto.randomUUID(),
            version: 0,
            state: bad,
          }),
        )
      ).status,
      403,
    );
  }
});
test("quote snapshots, authors and request identity remain immutable; project saves retain revision counters", async () => {
  const input = {
    requestId: crypto.randomUUID(),
    projectId: aliceProject.id,
    state: state(5),
    priceRevisions: {},
  };
  const response = await quoteRoutes.POST(
    request("alice", "/api/theater/quotes", input),
  );
  assert.equal(
    response.status,
    200,
    JSON.stringify(await response.clone().json()),
  );
  firstQuote = await response.json();
  assert.equal(firstQuote.ownerUid, users.alice.uid);
  assert.equal(firstQuote.createdBy.uid, users.alice.uid);
  assert.equal(firstQuote.revision, 1);
  const again = await quoteRoutes.POST(
    request("alice", "/api/theater/quotes", input),
  );
  assert.equal((await again.json()).id, firstQuote.id);
  assert.equal(
    (
      await quoteRoutes.POST(
        request("alice", "/api/theater/quotes", { ...input, state: state(4) }),
      )
    ).status,
    409,
  );
  aliceProject = await store.saveProject(
    users.admin,
    aliceProject.id,
    aliceProject.version,
    state(0),
  );
  assert.equal(aliceProject.createdBy.uid, users.alice.uid);
  assert.equal(aliceProject.updatedBy.uid, users.admin.uid);
  const next = await store.saveQuote(
    users.alice,
    { ...input, requestId: crypto.randomUUID() },
    state(3),
  );
  assert.equal(next.revision, 2);
  assert.equal(
    (await store.getQuote(users.admin, firstQuote.id)).state.discountPercent,
    5,
  );
  assert.equal(
    (
      await quoteRoutes.POST(
        request("bob", "/api/theater/quotes", {
          ...input,
          requestId: crypto.randomUUID(),
        }),
      )
    ).status,
    404,
  );
});
test("project and quote lists paginate and remain owner scoped", async () => {
  const ids = [];
  const batch = theaterDb().batch();
  for (let i = 0; i < 53; i++) {
    const id = crypto.randomUUID();
    ids.push(id);
    batch.set(store.collection("Projects").doc(id), {
      ...aliceProject,
      id,
      version: 1,
      updatedAt: new Date(Date.now() + 1000 + i).toISOString(),
    });
  }
  await batch.commit();
  const first = await store.listProjects(users.alice);
  assert.equal(first.projects.length, 50);
  assert.ok(first.nextCursor);
  const second = await store.listProjects(users.alice, first.nextCursor);
  assert.ok(second.projects.length > 0);
  assert.equal(second.nextCursor, null);
  const combined = [...first.projects, ...second.projects];
  assert.equal(new Set(combined.map((p) => p.id)).size, combined.length);
  assert.ok(ids.every((id) => combined.some((p) => p.id === id)));
  const mine = await store.listQuotes(users.alice);
  assert.ok(mine.quotes.every((q) => q.ownerUid === users.alice.uid));
  assert.ok(mine.quotes.some((q) => q.id === firstQuote.id));
  const admin = await store.listQuotes(users.admin);
  assert.ok(admin.quotes.some((q) => q.createdBy.uid === users.alice.uid));
  await assert.rejects(
    () => store.listProjects(users.alice, undefined, users.bob.uid),
    (e) => e.status === 404,
  );
});

test("concurrent project edits cannot overwrite each other", async () => {
  const p = await store.saveProject(
    users.alice,
    crypto.randomUUID(),
    0,
    state(),
  );
  const attempts = await Promise.allSettled([
    store.saveProject(users.alice, p.id, p.version, state(1)),
    store.saveProject(users.alice, p.id, p.version, state(2)),
  ]);
  assert.equal(attempts.filter((x) => x.status === "fulfilled").length, 1);
  assert.equal(
    attempts.find((x) => x.status === "rejected").reason.status,
    409,
  );
  assert.equal((await store.getProject(users.alice, p.id)).version, 2);
});
test("disabled profiles take effect on the next API call without refreshing an old token", async () => {
  await store.collection("Users").doc(users.bob.uid).update({ active: false });
  assert.equal(
    (await catalogRoute.GET(request("bob", "/api/theater/catalog"))).status,
    403,
  );
  await store
    .collection("Users")
    .doc(users.bob.uid)
    .update({ active: true, maxDiscountPercent: 1 });
  assert.equal(
    (
      await projectRoutes.POST(
        request("bob", undefined, {
          id: crypto.randomUUID(),
          version: 0,
          state: state(2),
        }),
      )
    ).status,
    403,
  );
});
test("team management has two roles and rejects employee escalation and self removal", async () => {
  const { POST, GET } = require("../src/app/api/theater/team/route.ts");
  assert.equal((await GET(request("alice", "/api/theater/team"))).status, 403);
  assert.equal(
    (
      await POST(
        request("alice", "/api/theater/team", {
          email: "x@example.invalid",
          displayName: "x",
          role: "admin",
          maxDiscountPercent: 100,
        }),
      )
    ).status,
    403,
  );
  await assert.rejects(
    () =>
      team.updateMember(users.admin, users.admin.uid, {
        role: "employee",
        active: true,
        maxDiscountPercent: 10,
        displayName: "Admin",
        expectedRevision: 1,
      }),
    (e) => e.status === 403,
  );
  const body = {
    email: `${prefix}-new@example.invalid`,
    displayName: "QA new member",
    role: "employee",
    maxDiscountPercent: 6,
  };
  const response = await POST(request("admin", "/api/theater/team", body));
  assert.equal(response.status, 201);
  const member = (await response.json()).member;
  assert.equal(member.role, "employee");
  assert.equal(member.maxDiscountPercent, 6);
  assert.equal(
    (
      await POST(
        request("admin", "/api/theater/team", { ...body, role: "super-admin" }),
      )
    ).status,
    400,
  );
});
test("private previews live in Storage, not Firestore, and only owners/admins download a PDF", async () => {
  const preview =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jC3sAAAAASUVORK5CYII=";
  const p = await store.saveProject(users.alice, crypto.randomUUID(), 0, {
    ...state(),
    preview,
  });
  assert.ok(p.previewPath);
  assert.equal(p.state.preview, undefined);
  assert.ok((await theaterBucket().file(p.previewPath).exists())[0]);
  const q = await store.saveQuote(
    users.alice,
    { projectId: p.id, requestId: crypto.randomUUID(), priceRevisions: {} },
    state(),
  );
  assert.equal((await pdfRoute.GET(request(null), params(q.id))).status, 401);
  assert.equal((await pdfRoute.GET(request("bob"), params(q.id))).status, 404);
  const pdf = await pdfRoute.GET(request("alice"), params(q.id));
  assert.equal(pdf.status, 200);
  assert.ok(
    Buffer.from(await pdf.arrayBuffer())
      .subarray(0, 4)
      .equals(Buffer.from("%PDF")),
  );
  assert.ok(
    (
      await theaterBucket()
        .file(`theater-private/quotes/${users.alice.uid}/${q.id}.v2-illustrated.pdf`)
        .exists()
    )[0],
  );
  const direct = await fetch(
    `http://${process.env.FIREBASE_STORAGE_EMULATOR_HOST}/v0/b/${process.env.FIREBASE_STORAGE_BUCKET}/o/${encodeURIComponent(p.previewPath)}?alt=media`,
  );
  assert.notEqual(direct.status, 200);
});
test("Firestore rules deny direct anonymous and employee access even with a valid Firebase token", async () => {
  const base = `http://${process.env.FIRESTORE_EMULATOR_HOST}/v1/projects/demo-epix-theater/databases/(default)/documents`;
  for (const who of [null, "alice", "admin"]) {
    const headers = who ? { Authorization: `Bearer ${tokens[who]}` } : {};
    const r = await fetch(`${base}/theaterProjects/${aliceProject.id}`, {
      headers,
    });
    assert.equal(r.status, 403);
    const write = await fetch(`${base}/theaterUsers/${users.alice.uid}`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ fields: { role: { stringValue: "admin" } } }),
    });
    assert.equal(write.status, 403);
  }
});
test("private Firestore media fallback stores large files in bounded chunks and protects downloads", async () => {
  const {
    writePrivateFile,
    readPrivateFile,
  } = require("../src/lib/theater/private-files.ts");
  const { storePreview } = require("../src/lib/theater/media.ts");
  process.env.THEATER_MEDIA_BACKEND = "firestore";
  try {
    const bytes = crypto.randomBytes(900001),
      path = `theater-private/qa/${crypto.randomUUID()}.pdf`;
    const reference = await writePrivateFile(path, bytes, "application/pdf");
    assert.ok(reference.startsWith("firestore:"));
    assert.ok((await readPrivateFile(reference)).bytes.equals(bytes));
    assert.ok((await readPrivateFile(path)).bytes.equals(bytes));
    const doc = await store.collection("Media").doc(reference.slice(10)).get();
    assert.equal(doc.data().count, 4);
    const r = await fetch(
      `http://${process.env.FIRESTORE_EMULATOR_HOST}/v1/projects/demo-epix-theater/databases/(default)/documents/theaterMedia/${doc.id}`,
    );
    assert.equal(r.status, 403);
    await doc.ref
      .collection("chunks")
      .doc("000")
      .update({ data: "Y29ycnVwdA==" });
    await assert.rejects(() => readPrivateFile(reference), /integrity/);
    await assert.rejects(
      () =>
        storePreview(
          users.alice.uid,
          crypto.randomUUID(),
          "data:image/png;base64,Y29ycnVwdA==",
        ),
      /valid PNG/,
    );
    const p = await store.saveProject(
      users.alice,
      crypto.randomUUID(),
      0,
      state(),
    );
    const q = await store.saveQuote(
      users.alice,
      { projectId: p.id, requestId: crypto.randomUUID(), priceRevisions: {} },
      state(),
    );
    const response = await pdfRoute.GET(request("alice"), params(q.id));
    assert.equal(response.status, 200);
    assert.ok(
      Buffer.from(await response.arrayBuffer())
        .subarray(0, 4)
        .equals(Buffer.from("%PDF")),
    );
  } finally {
    delete process.env.THEATER_MEDIA_BACKEND;
  }
});

test("migrated legacy references read verified Storage copies while preserving original chunks", async () => {
  const { writePrivateFile, readPrivateFile } = require("../src/lib/theater/private-files.ts");
  const previous = process.env.THEATER_MEDIA_BACKEND;
  try {
    process.env.THEATER_MEDIA_BACKEND = "firestore";
    const bytes = crypto.randomBytes(1000), path = `theater-private/qa/${crypto.randomUUID()}.pdf`;
    const reference = await writePrivateFile(path, bytes, "application/pdf");
    const doc = store.collection("Media").doc(reference.slice(10));
    await theaterBucket().file(path).save(bytes, { resumable: false, contentType: "application/pdf" });
    await doc.update({ storagePath: path });
    process.env.THEATER_MEDIA_BACKEND = "storage";
    assert.ok((await readPrivateFile(reference)).bytes.equals(bytes));
    assert.ok((await readPrivateFile(path)).bytes.equals(bytes));
    assert.equal((await doc.collection("chunks").get()).size, 1);
    await theaterBucket().file(path).save(Buffer.from("corrupt"), { resumable: false });
    await assert.rejects(() => readPrivateFile(reference), /integrity/);
  } finally {
    if (previous === undefined) delete process.env.THEATER_MEDIA_BACKEND;
    else process.env.THEATER_MEDIA_BACKEND = previous;
  }
});

test("Storage permission failures fail closed instead of silently writing Firestore media", async () => {
  const firebase = require("../src/lib/theater/firebase-admin.ts");
  const { writePrivateFile } = require("../src/lib/theater/private-files.ts");
  const original = firebase.theaterBucket, previous = process.env.THEATER_MEDIA_BACKEND;
  const path = `theater-private/qa/${crypto.randomUUID()}.pdf`;
  try {
    process.env.THEATER_MEDIA_BACKEND = "storage";
    firebase.theaterBucket = () => ({ file: () => ({ save: async () => { throw Object.assign(new Error("permission denied"), { code: 403 }); } }) });
    await assert.rejects(() => writePrivateFile(path, Buffer.from("private"), "application/pdf"), /permission denied/);
    const id = crypto.createHash("sha256").update(path).digest("hex");
    assert.equal((await store.collection("Media").doc(id).get()).exists, false);
  } finally {
    firebase.theaterBucket = original;
    if (previous === undefined) delete process.env.THEATER_MEDIA_BACKEND;
    else process.env.THEATER_MEDIA_BACKEND = previous;
  }
});
