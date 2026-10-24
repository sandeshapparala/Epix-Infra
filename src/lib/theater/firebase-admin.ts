import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { AccessError } from "./access";

// Lazy initialization lets the public builder and production build work without
// server credentials. Protected requests fail closed if they are not configured.
export function theaterAdminApp() {
  const existing = getApps().find((app) => app.name === "epix-theater-server");
  if (existing) return existing;
  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId)
    throw new AccessError(
      "Theatre Firebase server configuration is missing.",
      503,
    );
  const emulator = Boolean(
    process.env.FIREBASE_AUTH_EMULATOR_HOST ||
    process.env.FIRESTORE_EMULATOR_HOST ||
    process.env.FIREBASE_STORAGE_EMULATOR_HOST,
  );
  if (
    emulator &&
    (process.env.NODE_ENV === "production" || !projectId.startsWith("demo-"))
  )
    throw new AccessError(
      "Firebase emulators require a local demo project.",
      503,
    );
  const email = process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    key = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (
    !emulator &&
    !(email && key) &&
    !process.env.GOOGLE_APPLICATION_CREDENTIALS
  )
    throw new AccessError(
      "Configure the theatre Firebase Admin service account before signing in to the workspace.",
      503,
    );
  return initializeApp(
    {
      projectId,
      storageBucket:
        process.env.FIREBASE_STORAGE_BUCKET ??
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      ...(!emulator
        ? {
            credential:
              email && key
                ? cert({
                    projectId,
                    clientEmail: email,
                    privateKey: key.replace(/\\n/g, "\n"),
                  })
                : applicationDefault(),
          }
        : {}),
    },
    "epix-theater-server",
  );
}
export const theaterAuth = () => getAuth(theaterAdminApp());
export const theaterDb = () => getFirestore(theaterAdminApp());
export const theaterBucket = () => getStorage(theaterAdminApp()).bucket();
