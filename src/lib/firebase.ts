
'use client';

import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";

// The standard Firebase config provided by the RequestFirebaseBackendTool
const firebaseConfig = {
  apiKey: "AIzaSyDummyKey-For-Persistence-Check",
  authDomain: "harmony-host-app.firebaseapp.com",
  projectId: "harmony-host-app",
  storageBucket: "harmony-host-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with offline persistence enabled as requested
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
