
'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Query, 
  onSnapshot, 
  QuerySnapshot, 
  DocumentData,
  FirestoreError 
} from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useCollection(query: Query | null) {
  const [data, setData] = useState<DocumentData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query) {
      console.log('[Firestore] useCollection: No query provided, idle.');
      setLoading(false);
      return;
    }

    setLoading(true);
    console.log('[Firestore] useCollection: Listening to query...');
    
    const unsubscribe = onSnapshot(
      query,
      (snapshot: QuerySnapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log(`[Firestore] useCollection: Snapshot received. Docs count: ${docs.length}`);
        setData(docs);
        setLoading(false);
      },
      async (serverError: FirestoreError) => {
        console.error('[Firestore] useCollection: Permission error or listener failure:', serverError);
        const permissionError = new FirestorePermissionError({
          path: (query as any)._query?.path?.toString() || 'unknown',
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(permissionError);
        setLoading(false);
      }
    );

    return () => {
      console.log('[Firestore] useCollection: Unsubscribing from query.');
      unsubscribe();
    };
  }, [query]);

  return { data, loading, error };
}

export function useMemoFirebase<T>(factory: () => T, deps: any[]): T {
  return useMemo(factory, deps);
}
