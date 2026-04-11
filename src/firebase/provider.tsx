'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { initializeFirebase } from './index';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface FirebaseContextType {
  app: FirebaseApp | null;
  db: Firestore | null;
  auth: Auth | null;
}

const FirebaseContext = createContext<FirebaseContextType>({
  app: null,
  db: null,
  auth: null,
});

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [instances, setInstances] = useState<FirebaseContextType>({
    app: null,
    db: null,
    auth: null,
  });

  useEffect(() => {
    const { app, db, auth } = initializeFirebase();
    setInstances({ app, db, auth });
  }, []);

  return (
    <FirebaseContext.Provider value={instances}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => useContext(FirebaseContext);
