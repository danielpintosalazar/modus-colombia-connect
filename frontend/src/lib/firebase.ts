import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import { type Auth, getAuth } from "firebase/auth";

/**
 * Config del proyecto Firebase para el SDK web. Todas son variables públicas
 * (prefijo VITE_), no secretos. Si falta `apiKey` la app funciona igual: se cae
 * al toggle de rol local + dev-token del backend (ver src/lib/auth.tsx).
 */
const firebaseConfig = {
  apiKey: import.meta.env["VITE_FIREBASE_API_KEY"]?.trim(),
  authDomain: import.meta.env["VITE_FIREBASE_AUTH_DOMAIN"]?.trim(),
  projectId: import.meta.env["VITE_FIREBASE_PROJECT_ID"]?.trim(),
  appId: import.meta.env["VITE_FIREBASE_APP_ID"]?.trim(),
  storageBucket: import.meta.env["VITE_FIREBASE_STORAGE_BUCKET"]?.trim(),
  messagingSenderId: import.meta.env["VITE_FIREBASE_MESSAGING_SENDER_ID"]?.trim(),
};

/** Solo en el navegador y con config mínima presente. Nunca en SSR. */
export const isFirebaseAuthEnabled =
  typeof window !== "undefined" &&
  Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId);

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

export function getFirebaseAuth(): Auth | null {
  if (!isFirebaseAuthEnabled) return null;
  if (!auth) {
    app = getApps()[0] ?? initializeApp(firebaseConfig as Record<string, string>);
    auth = getAuth(app);
  }
  return auth;
}
