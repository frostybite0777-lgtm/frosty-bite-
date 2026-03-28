import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

export let app: FirebaseApp | null = null;
export let auth: Auth | null = null;
export let db: Firestore | null = null;

export function getFirebaseApp() {
  try {
    if (!app) {
      app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    }
    return app;
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    return null;
  }
}

export function getFirebaseAuth() {
  const app = getFirebaseApp();
  if (!app) return null;
  if (!auth) {
    auth = getAuth(app);
  }
  return auth;
}

export function getFirebaseDb() {
  const app = getFirebaseApp();
  if (!app) return null;
  if (!db) {
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
  return db;
}

// Initialize them immediately to ensure they are exported
getFirebaseApp();
getFirebaseAuth();
getFirebaseDb();

async function testConnection() {
  const db = getFirebaseDb();
  if (!db) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection verified.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    }
  }
}

testConnection();

export const googleProvider = new GoogleAuthProvider();
