
'use client';

import { useState, useEffect } from 'react';
import { 
  DocumentReference, 
  onSnapshot, 
  DocumentSnapshot, 
  DocumentData,
  FirestoreError 
} from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useDoc(docRef: DocumentReference | null) {
  const [data, setData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!docRef) {
      console.log('[Firestore] useDoc: No document reference provided, idle.');
      setLoading(false);
      return;
    }

    setLoading(true);
    console.log('[Firestore] useDoc: Listening to document:', docRef.path);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot: DocumentSnapshot) => {
        console.log(`[Firestore] useDoc: Snapshot received for: ${docRef.path}. Exists: ${snapshot.exists()}`);
        setData(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
        setLoading(false);
      },
      async (serverError: FirestoreError) => {
        console.error('[Firestore] useDoc: Error fetching document:', serverError);
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(permissionError);
        setLoading(false);
      }
    );

    return () => {
      console.log('[Firestore] useDoc: Unsubscribing from document:', docRef.path);
      unsubscribe();
    };
  }, [docRef]);

  return { data, loading, error };
}
