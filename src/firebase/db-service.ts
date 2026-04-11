'use client';

/**
 * @fileOverview Modular Firestore database functions for tokens, inventory, and sales.
 */

import { 
  Firestore, 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  increment, 
  serverTimestamp 
} from 'firebase/firestore';
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError } from './errors';

/**
 * Saves a food token to the 'tokens' collection.
 */
export async function saveToken(db: Firestore, item: any, tokenId: string, adminEmail: string) {
  const data = {
    itemName: item.name || item.itemName,
    price: item.price,
    tokenId,
    timestamp: serverTimestamp(),
    adminEmail,
    status: "generated"
  };

  return addDoc(collection(db, "tokens"), data)
    .catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'tokens',
        operation: 'create',
        requestResourceData: data,
      }));
      throw err;
    });
}

/**
 * Decrements stock in the 'inventory' collection.
 */
export async function updateStock(db: Firestore, itemId: string, quantityToSubtract: number) {
  const ref = doc(db, "inventory", itemId);
  return updateDoc(ref, {
    currentStock: increment(-quantityToSubtract)
  }).catch(async (err) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: `inventory/${itemId}`,
      operation: 'update',
      requestResourceData: { currentStock: 'decrement' },
    }));
    throw err;
  });
}

/**
 * Stores a finalized bill in the 'sales' collection.
 */
export async function saveBill(db: Firestore, details: any) {
  const data = {
    ...details,
    timestamp: serverTimestamp(),
  };

  return addDoc(collection(db, "sales"), data)
    .catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'sales',
        operation: 'create',
        requestResourceData: data,
      }));
      throw err;
    });
}
