
'use client';

import React, { useEffect, useState } from 'react';
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
    // Initialize Firebase ONLY on the client to avoid SSR invalid-api-key errors
    try {
      const results = initializeFirebase();
      setInstances(results);
    } catch (e) {
      console.error('[Firebase] Failed to initialize instances:', e);
    }
  }, []);

  if (!instances) {
    // Return children to allow static parts of the page to render, 
    // but hooks will wait for context once instances are set.
    return <>{children}</>;
  }

  return (
    <FirebaseProvider 
      firebaseApp={instances.firebaseApp} 
      firestore={instances.firestore} 
      auth={instances.auth}
    >
      <FirebaseErrorListener />
      {children}
    </FirebaseProvider>
  );
};
