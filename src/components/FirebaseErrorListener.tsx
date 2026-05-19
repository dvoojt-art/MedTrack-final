
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';

export const FirebaseErrorListener = () => {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: any) => {
      toast({
        variant: "destructive",
        title: "Database Error",
        description: error.message || "You don't have permission to perform this action.",
      });
    };

    errorEmitter.on('permission-error', handleError);
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  return null;
};
