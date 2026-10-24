import { createHash } from "node:crypto";
import { theaterBucket, theaterDb } from "./firebase-admin";
import { AccessError } from "./access";

const hash = (value: string | Uint8Array) =>
  createHash("sha256").update(value).digest("hex");
// Retain the explicit legacy backend for older installations and local tests.
// New installations use Storage; permission failures must never silently reroute.
async function firestoreWrite(path: string, bytes: Buffer, mime: string) {
  const ref = theaterDb().collection("theaterMedia").doc(hash(path));
  const batch = theaterDb().batch(),
    size = 300_000,
    count = Math.max(1, Math.ceil(bytes.length / size));
  for (let i = 0; i < count; i++)
    batch.set(ref.collection("chunks").doc(String(i).padStart(3, "0")), {
      data: bytes.subarray(i * size, (i + 1) * size).toString("base64"),
    });
  batch.set(ref, {
    path,
    mime,
    count,
    size: bytes.length,
    sha256: hash(bytes),
    createdAt: new Date().toISOString(),
  });
  await batch.commit();
  return `firestore:${ref.id}`;
}
async function firestoreRead(
  id: string,
): Promise<{ bytes: Buffer; mime: string } | null> {
  if (!/^[0-9a-f]{64}$/.test(id))
    throw new AccessError("Invalid file reference.", 400);
  const ref = theaterDb().collection("theaterMedia").doc(id),
    doc = await ref.get();
  if (!doc.exists) return null;
  const meta = doc.data()!;
  if (
    process.env.THEATER_MEDIA_BACKEND !== "firestore" &&
    typeof meta.storagePath === "string" &&
    meta.storagePath.startsWith("theater-private/") &&
    hash(meta.storagePath) === id
  ) {
    const migrated = await storageRead(meta.storagePath);
    if (migrated) {
      if (migrated.bytes.length !== meta.size || hash(migrated.bytes) !== meta.sha256)
        throw new AccessError("The stored file failed its integrity check.", 503);
      return migrated;
    }
  }
  if (!Number.isInteger(meta.count) || meta.count < 1 || meta.count > 14)
    throw new AccessError("The stored file is incomplete. Please retry.", 503);
  const chunks = await theaterDb().getAll(
    ...Array.from({ length: meta.count }, (_, i) =>
      ref.collection("chunks").doc(String(i).padStart(3, "0")),
    ),
  );
  if (chunks.some((c) => !c.exists))
    throw new AccessError("The stored file is incomplete. Please retry.", 503);
  const bytes = Buffer.concat(
    chunks.map((c) => Buffer.from(c.data()!.data, "base64")),
  );
  if (bytes.length !== meta.size || hash(bytes) !== meta.sha256)
    throw new AccessError("The stored file failed its integrity check.", 503);
  return { bytes, mime: meta.mime };
}
async function storageRead(path: string): Promise<{ bytes: Buffer; mime: string } | null> {
  const file = theaterBucket().file(path);
  try {
    const [bytes] = await file.download();
    return { bytes, mime: path.endsWith(".pdf") ? "application/pdf" : path.endsWith(".png") ? "image/png" : "image/jpeg" };
  } catch (error) {
    if ((error as { code?: number }).code === 404) return null;
    throw error;
  }
}
export async function writePrivateFile(
  path: string,
  bytes: Buffer,
  mime: string,
): Promise<string> {
  if (!path.startsWith("theater-private/") || bytes.length > 4_000_000)
    throw new AccessError(
      "The private file is too large or has an invalid path.",
      400,
    );
  if (process.env.THEATER_MEDIA_BACKEND !== "firestore") {
    await theaterBucket()
        .file(path)
        .save(bytes, {
          resumable: false,
          contentType: mime,
          metadata: { cacheControl: "private, no-store", metadata: { sha256: hash(bytes) } },
        });
    return path;
  }
  return firestoreWrite(path, bytes, mime);
}
export async function readPrivateFile(
  reference: string,
): Promise<{ bytes: Buffer; mime: string } | null> {
  if (reference.startsWith("firestore:"))
    return firestoreRead(reference.slice(10));
  if (!reference.startsWith("theater-private/"))
    throw new AccessError("Invalid private file reference.", 400);
  if (process.env.THEATER_MEDIA_BACKEND !== "firestore") {
    const stored = await storageRead(reference);
    if (stored) return stored;
  }
  // Older PDF caches used their deterministic path while storing Firestore chunks.
  return firestoreRead(hash(reference));
}
