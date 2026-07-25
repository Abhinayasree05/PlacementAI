/**
 * lib/firebase.ts
 * -----------------
 * Single Firebase initialization point. Every auth/firestore call in the
 * app imports `auth` / `db` / `googleProvider` from here.
 *
 * SETUP (required before Google/Phone/Email auth will work):
 *   1. Go to https://console.firebase.google.com and create a project.
 *   2. Project settings -> General -> "Your apps" -> Add a Web app.
 *      Copy the config object it gives you into your .env file (see
 *      .env.example in the project root) — DO NOT hardcode it here.
 *   3. Authentication -> Sign-in method -> enable:
 *        - Email/Password
 *        - Google
 *        - Phone  (Phone Auth requires the Blaze/pay-as-you-go plan for
 *          production SMS volume; the free Spark plan allows a limited
 *          number of test numbers for development)
 *   4. Firestore Database -> Create database (start in production mode,
 *      then adjust security rules — see /firestore.rules.example).
 */

import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missingKeys = Object.entries(firebaseConfig)
  .filter(([, v]) => !v)
  .map(([k]) => k);

/** Pages can check this to show an actionable setup banner instead of a
 *  cryptic "auth/invalid-api-key" once a real request is attempted. */
export const isFirebaseConfigured = missingKeys.length === 0;

if (!isFirebaseConfigured) {
  // Loud, actionable warning instead of a cryptic Firebase SDK crash.
  // eslint-disable-next-line no-console
  console.warn(
    `[firebase.ts] Missing env vars: ${missingKeys.join(", ")}. ` +
    `Copy .env.example to .env and fill in your Firebase project config, ` +
    `then restart the dev server.`
  );
}

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Explicit default persistence for EVERY sign-in method (Email, Google, Phone).
// Without this, only the email/password flow (which calls setPersistence
// itself before signing in) was guaranteed to persist across a refresh —
// Google/Phone logins were relying on whatever the SDK's implicit default
// happened to be, which is fragile once any code path changes persistence.
// This makes "stay signed in after refresh" true for all four methods,
// independent of call order. Login/logout flows can still explicitly call
// setPersistence(auth, browserSessionPersistence) for "don't remember me".
setPersistence(auth, browserLocalPersistence).catch(() => {
  // Safe to ignore — falls back to the SDK's own default persistence.
});

export { browserLocalPersistence, browserSessionPersistence };
