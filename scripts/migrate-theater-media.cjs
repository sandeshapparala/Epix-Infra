// Copies private legacy files to Storage without deleting originals or changing quotations.
const fs = require("node:fs"), { parseEnv } = require("node:util"), { createHash } = require("node:crypto");
for (const file of [".env.local", ".env"])
  if (fs.existsSync(file)) for (const [key, value] of Object.entries(parseEnv(fs.readFileSync(file, "utf8"))))
    if (!process.env[key]) process.env[key] = value;
require("./theater-test-loader.cjs");
const { theaterDb, theaterBucket } = require("../src/lib/theater/firebase-admin.ts");
const { readPrivateFile } = require("../src/lib/theater/private-files.ts");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const apply = process.argv.includes("--apply");
async function main() {
  if (process.env.FIREBASE_ADMIN_PROJECT_ID !== "epix-infra" || process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_STORAGE_EMULATOR_HOST)
    throw new Error("This migration is scoped to the configured epix-infra project.");
  if (process.env.THEATER_MEDIA_BACKEND === "firestore") throw new Error("Configure the Storage backend before migrating.");
  const db = theaterDb(), bucket = theaterBucket();
  const result = { apply, bucket: bucket.name, checked: 0, copied: 0, linked: 0, bytes: 0 };
  let cursor;
  for (;;) {
    let query = db.collection("theaterMedia").orderBy("__name__").limit(100);
    if (cursor) query = query.startAfter(cursor);
    const page = await query.get();
    for (const doc of page.docs) {
      const meta = doc.data();
      if (typeof meta.path !== "string" || !meta.path.startsWith("theater-private/") || hash(meta.path) !== doc.id)
        throw new Error("Invalid legacy media metadata; no source data was removed.");
      const original = await readPrivateFile(`firestore:${doc.id}`);
      if (!original || original.bytes.length > 4_000_000 || original.bytes.length !== meta.size || hash(original.bytes) !== meta.sha256)
        throw new Error("Legacy media integrity verification failed.");
      result.checked++; result.bytes += original.bytes.length;
      const file = bucket.file(meta.path);
      if ((await file.exists())[0]) {
        const [existing] = await file.download();
        if (hash(existing) !== meta.sha256) throw new Error("Destination differs; refusing to overwrite a private file.");
      } else if (apply) {
        await file.save(original.bytes, { resumable: false, contentType: original.mime, preconditionOpts: { ifGenerationMatch: 0 }, metadata: { cacheControl: "private, no-store", metadata: { sha256: meta.sha256 } } });
        const [verified] = await file.download();
        if (hash(verified) !== meta.sha256) throw new Error("Storage copy failed verification.");
        result.copied++;
      }
      if (apply && meta.storagePath !== meta.path) {
        await db.runTransaction(async tx => {
          const latest = (await tx.get(doc.ref)).data();
          if (latest?.sha256 !== meta.sha256) throw new Error("Source changed during migration. Retry safely.");
          tx.update(doc.ref, { storagePath: meta.path, storageMigratedAt: new Date().toISOString() });
        });
        result.linked++;
      }
    }
    if (page.size < 100) break;
    cursor = page.docs.at(-1);
  }
  console.log(JSON.stringify(result));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
