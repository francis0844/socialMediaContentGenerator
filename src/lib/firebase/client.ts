import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

import { getPublicEnv } from "@/lib/env/public";

export function getFirebaseClientApp() {
  const env = getPublicEnv();
  if (getApps().length) return getApps()[0]!;

  return initializeApp({
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  });
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseClientApp());
}

