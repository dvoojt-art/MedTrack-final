
'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from './config';

export function initializeFirebase() {
  try {
    console.log('[Firebase] Initializing Firebase...');
    const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const firestore = getFirestore(firebaseApp);
    const auth = getAuth(firebaseApp);
    console.log('[Firebase] Initialization successful.');
    return { firebaseApp, firestore, auth };
  } catch (error) {
    console.error('[Firebase] Initialization failed:', error);
    throw error;
  }
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
