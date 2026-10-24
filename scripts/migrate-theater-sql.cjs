require("./theater-test-loader.cjs");
const fs = require("node:fs"),
  path = require("node:path");
for (const p of [".env", ".env.local"])
  if (fs.existsSync(p))
    for (const [k, v] of Object.entries(
      require("node:util").parseEnv(fs.readFileSync(p, "utf8")),
    ))
      if (!process.env[k]) process.env[k] = v;
const { createClient } = require("@libsql/client"),
  { theaterDb, theaterAuth } = require("../src/lib/theater/firebase-admin.ts"),
  { storePreview } = require("../src/lib/theater/media.ts");
const apply = process.argv.includes("--apply"),
  ownerEmail = process.argv
    .find((v) => v.startsWith("--owner-email="))
    ?.slice(14);
if (!ownerEmail)
  throw new Error(
    "Provide --owner-email=the-admin-who-will-hold-legacy-projects",
  );
if (process.env.FIREBASE_ADMIN_PROJECT_ID !== "epix-infra")
  throw new Error("This migration is scoped to epix-infra.");
async function main() {
  const file = path.resolve(".theater-data/studio.db");
  if (!fs.existsSync(file)) {
    console.log("No local SQLite studio database exists. Nothing to migrate.");
    return;
  }
  const sql = createClient({ url: `file:${file.replaceAll("\\", "/")}` });
  const projects = (await sql.execute("SELECT * FROM projects")).rows,
    quotes = (await sql.execute("SELECT * FROM quotes")).rows;
  const prices = (
    await sql.execute("SELECT * FROM catalog_prices")
  ).rows.filter((r) => JSON.parse(r.payload).updatedAt);
  console.log(
    JSON.stringify({
      dryRun: !apply,
      projects: projects.length,
      quotes: quotes.length,
      priceOverrides: prices.length,
      legacyOwner: ownerEmail,
      creator: "Legacy import - creator unrecorded",
    }),
  );
  if (!apply) {
    sql.close();
    return;
  }
  const owner = await theaterAuth().getUserByEmail(ownerEmail),
    db = theaterDb(),
    profile = await db.collection("theaterUsers").doc(owner.uid).get();
  if (profile.data()?.role !== "admin" || profile.data()?.active !== true)
    throw new Error("Legacy owner must be an active admin.");
  const denial = await fetch(
    "https://firestore.googleapis.com/v1/projects/epix-infra/databases/(default)/documents/theaterUsers/_privacy_probe",
  );
  if (denial.status !== 403)
    throw new Error(
      "Workspace Rules must deny public access before migration.",
    );
  const creator = {
      uid: "legacy-import",
      name: "Legacy import - creator unrecorded",
      email: "",
    },
    stamp = new Date().toISOString();
  let importedProjects = 0,
    importedQuotes = 0,
    importedPrices = 0;
  for (const row of projects) {
    const ref = db.collection("theaterProjects").doc(String(row.id));
    if ((await ref.get()).exists) continue;
    const state = JSON.parse(row.state),
      previewPath = await storePreview(
        owner.uid,
        String(row.id),
        state.preview,
      );
    delete state.preview;
    const quoteRevision = Math.max(
      0,
      ...quotes
        .filter((q) => q.project_id === row.id)
        .map((q) => Number(q.revision)),
    );
    await ref.create(
      JSON.parse(
        JSON.stringify({
          id: String(row.id),
          name: String(row.name),
          state,
          version: Number(row.version),
          ownerUid: owner.uid,
          createdBy: creator,
          updatedBy: creator,
          createdAt: String(row.updated_at),
          updatedAt: String(row.updated_at),
          quoteRevision,
          previewPath,
          migratedAt: stamp,
        }),
      ),
    );
    importedProjects++;
  }
  for (const row of quotes) {
    const ref = db.collection("theaterQuotes").doc(String(row.id));
    if ((await ref.get()).exists) continue;
    const q = JSON.parse(row.snapshot),
      previewPath = await storePreview(
        owner.uid,
        String(row.project_id),
        q.state.preview,
      );
    delete q.state.preview;
    await ref.create(
      JSON.parse(
        JSON.stringify({
          ...q,
          ownerUid: owner.uid,
          createdBy: creator,
          previewPath,
          migratedAt: stamp,
        }),
      ),
    );
    importedQuotes++;
  }
  for (const row of prices) {
    const ref = db.collection("theaterPrices").doc(String(row.product_id));
    if ((await ref.get()).exists) continue;
    await ref.create({
      price: { ...JSON.parse(row.payload), revision: Number(row.revision) },
      updatedBy: creator,
      migratedAt: stamp,
    });
    importedPrices++;
  }
  sql.close();
  console.log(
    JSON.stringify({
      importedProjects,
      importedQuotes,
      importedPrices,
      originalDatabasePreserved: true,
    }),
  );
}
main().catch((e) => {
  console.error("Migration failed:", e.message);
  process.exitCode = 1;
});
