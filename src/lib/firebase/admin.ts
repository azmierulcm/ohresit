import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getAuth } from "firebase-admin/auth";

try {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}";
    const serviceAccount = JSON.parse(raw);

    initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }
} catch (err) {
  console.error(
    "[firebase/admin] Failed to initialize Firebase Admin — check FIREBASE_SERVICE_ACCOUNT_KEY:",
    err
  );
}

export const db = getFirestore();
export const storage = getStorage();
export const auth = getAuth();
