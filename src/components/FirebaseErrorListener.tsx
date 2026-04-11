'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: any) => {
      // In development, we want to see the full error.
      // In production, this would be handled differently.
      console.error('Firebase Permission Error:', error);
      
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: error.message || "You don't have permission to perform this action.",
      });

      // If it's a FirestorePermissionError, it will be caught by the development overlay
      if (error.name === 'FirestorePermissionError') {
        throw error;
      }
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null;
}
