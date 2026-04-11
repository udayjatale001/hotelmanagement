'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

export function initializeFirebase() {
  if (getApps().length > 0) {
    app = getApp();
  } else {
    app = initializeApp(firebaseConfig);
  }

  // Ensure Firestore is only initialized once with specific settings
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
  } catch (e: any) {
    // If already initialized, get the existing instance
    db = getFirestore(app);
  }
  
  auth = getAuth(app);

  return { app, db, auth };
}

export { errorEmitter } from './error-emitter';
export { FirestorePermissionError } from './errors';
export { useFirebase, FirebaseProvider } from './provider';
