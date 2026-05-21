
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

export const FirebaseClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [instances, setInstances] = useState<{
    firebaseApp: any;
    firestore: any;
    auth: any;
  } | null>(null);

  useEffect(() => {
    // Initialize Firebase ONLY on the client
    try {
      const results = initializeFirebase();
      if (results.firebaseApp) {
        setInstances(results);
      } else {
        console.warn('[Firebase] Application running without active Firebase connection.');
      }
    } catch (e) {
      console.error('[Firebase] Failed to initialize instances:', e);
    }
  }, []);

  // Use a placeholder provider if instances aren't ready to prevent hook crashes
  const contextValue = useMemo(() => {
    return instances || { firebaseApp: null, firestore: null, auth: null };
  }, [instances]);

  return (
    <FirebaseProvider 
      firebaseApp={contextValue.firebaseApp} 
      firestore={contextValue.firestore} 
      auth={contextValue.auth}
    >
      <FirebaseErrorListener />
      {children}
    </FirebaseProvider>
  );
};
