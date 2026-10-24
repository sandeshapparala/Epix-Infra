// Uses a locally configured Firebase service account. Never logs credentials.
const fs = require("node:fs"),
  path = require("node:path"),
  { parseEnv } = require("node:util");
for (const p of [".env", ".env.local"])
  if (fs.existsSync(p))
    for (const [k, v] of Object.entries(parseEnv(fs.readFileSync(p, "utf8"))))
      if (!process.env[k]) process.env[k] = v;
const {
    initializeApp,
    cert,
    applicationDefault,
  } = require("firebase-admin/app"),
  { getAuth } = require("firebase-admin/auth"),
  { getFirestore } = require("firebase-admin/firestore");
const apply = process.argv.includes("--apply"),
  email = process.argv.find((a) => a.startsWith("--email="))?.slice(8);
if (!email) throw new Error("Provide --email=the-authorized-admin@example.com");
if (
  process.env.FIREBASE_AUTH_EMULATOR_HOST ||
  process.env.FIRESTORE_EMULATOR_HOST
)
  throw new Error(
    "This provisioning command is for the configured real Firebase project, not an emulator.",
  );
const project = process.env.FIREBASE_ADMIN_PROJECT_ID;
if (project !== "epix-infra")
  throw new Error(
    "This setup is scoped to epix-infra. Review the script before using another project.",
  );
const credential = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? cert(
      JSON.parse(
        fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8"),
      ),
    )
  : process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
      process.env.FIREBASE_ADMIN_PRIVATE_KEY
    ? cert({
        projectId: project,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(
          /\\n/g,
          "\n",
        ),
      })
    : applicationDefault();
const app = initializeApp({ projectId: project, credential });
async function main() {
  const token = (await credential.getAccessToken()).access_token;
  async function rest(url, init) {
    const r = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const v = await r.json();
    if (!r.ok)
      throw new Error(
        `${r.status}: ${v.error?.message || "Firebase setup failed"}`,
      );
    return v;
  }
  const rulesBase = `https://firebaserules.googleapis.com/v1/projects/${project}`;
  const release = await rest(rulesBase + "/releases/cloud.firestore");
  const rules = await rest(
    "https://firebaserules.googleapis.com/v1/" + release.rulesetName,
  );
  const source = rules.source.files.find((f) =>
    f.content.includes("service cloud.firestore"),
  );
  if (!source)
    throw new Error("Deployed Firestore source could not be identified.");
  let content = source.content;
  const hasProtection = content.includes("!collectionId.matches('theater.*')");
  if (!hasProtection) {
    // Preserve the independently deployed legacy website. Only the new namespace
    // is removed from its existing public wildcard; no existing access is expanded.
    const open =
      /match\s+\/\{document=\*\*\}\s*\{\s*allow\s+read,\s*write:\s*if\s+true;\s*\}/;
    if (!open.test(content))
      throw new Error(
        "Live rules changed. Review the deployed rules before applying scoped protection.",
      );
    content = content.replace(
      open,
      "match /{collectionId}/{document=**} {\n      allow read, write: if !collectionId.matches('theater.*');\n    }",
    );
  }
  const status = {
    project,
    apply,
    adminEmail: email,
    existingRulesProtected: hasProtection,
    indexes: [],
  };
  if (!apply) {
    console.log(JSON.stringify(status, null, 2));
    return;
  }
  const dir = path.join(process.cwd(), ".theater-data", "setup-backups");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, `${Date.now()}-firestore.rules`),
    source.content,
  );
  if (!hasProtection) {
    const next = await rest(rulesBase + "/rulesets", {
      method: "POST",
      body: JSON.stringify({
        source: { files: [{ name: source.name, content }] },
      }),
    });
    await rest(rulesBase + "/releases/cloud.firestore", {
      method: "PATCH",
      body: JSON.stringify({
        release: { name: release.name, rulesetName: next.name },
        updateMask: "rulesetName",
      }),
    });
  }
  fs.writeFileSync(path.join(dir, "active-theater-firestore.rules"), content);
  // Verify denial before creating sensitive profiles. Propagation can take a moment.
  let denied = false;
  for (let i = 0; i < 20; i++) {
    const r = await fetch(
      `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/theaterUsers/_privacy_probe`,
    );
    if (r.status === 403) {
      denied = true;
      break;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  if (!denied)
    throw new Error(
      "New collections have not yet passed the public-access denial check. No profile was written.",
    );
  const auth = getAuth(app);
  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch (e) {
    if (e.code !== "auth/user-not-found") throw e;
    user = await auth.createUser({
      email,
      displayName: "Epix Infra Admin",
      emailVerified: false,
    });
  }
  if (user.disabled)
    throw new Error(
      "The existing Firebase account is disabled. No global account settings were changed.",
    );
  const db = getFirestore(app),
    ref = db.collection("theaterUsers").doc(user.uid),
    now = new Date().toISOString();
  await db.runTransaction(async (tx) => {
    const existing = await tx.get(ref);
    tx.set(ref, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || "Epix Infra Admin",
      role: "admin",
      active: true,
      maxDiscountPercent: 100,
      revision: (existing.data()?.revision ?? 0) + 1,
      createdAt: existing.data()?.createdAt ?? now,
      updatedAt: now,
      createdBy: existing.data()?.createdBy ?? "authorized-setup",
    });
    tx.create(db.collection("theaterAudit").doc(), {
      action: "admin_setup",
      actor: {
        uid: user.uid,
        email: user.email,
        name: user.displayName || "Epix Infra Admin",
      },
      createdAt: now,
    });
  });
  status.rulesProtected = true;
  status.admin = {
    uid: user.uid,
    email: user.email,
    role: "admin",
    passwordChanged: false,
  };
  console.log(
    JSON.stringify({
      rulesProtected: true,
      adminEmail: user.email,
      adminProfileActive: true,
    }),
  );
  for (const [col, key, date] of [
    ["theaterProjects", "ownerUid", "updatedAt"],
    ["theaterQuotes", "ownerUid", "createdAt"],
    ["theaterQuotes", "projectId", "createdAt"],
  ]) {
    const url = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/collectionGroups/${col}/indexes`;
    const fields = [
      { fieldPath: key, order: "ASCENDING" },
      { fieldPath: date, order: "DESCENDING" },
    ];
    const existing = await rest(url);
    const found = existing.indexes?.find((i) =>
      fields.every(
        (f, n) =>
          i.fields[n]?.fieldPath === f.fieldPath &&
          i.fields[n]?.order === f.order,
      ),
    );
    if (found)
      status.indexes.push({ collection: col, key, state: found.state });
    else {
      try {
        await rest(url, {
          method: "POST",
          body: JSON.stringify({ queryScope: "COLLECTION", fields }),
        });
        status.indexes.push({ collection: col, key, state: "CREATING" });
      } catch (e) {
        if (!e.message.startsWith("403:")) throw e;
        status.indexes.push({
          collection: col,
          key,
          state: "CREATE_IN_FIREBASE_CONSOLE",
          reason: "Service account cannot create indexes",
        });
      }
    }
  }
  status.rulesProtected = true;
  status.admin = {
    uid: user.uid,
    email: user.email,
    role: "admin",
    passwordChanged: false,
  };
  console.log(JSON.stringify(status, null, 2));
}
main().catch((e) => {
  console.error("Theatre setup:", e.message);
  process.exitCode = 1;
});
