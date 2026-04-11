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
  deleteDoc,
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
 * Deletes a token from the 'tokens' collection.
 */
export async function deleteToken(db: Firestore, id: string) {
  const ref = doc(db, "tokens", id);
  return deleteDoc(ref)
    .catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `tokens/${id}`,
        operation: 'delete',
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

/**
 * Deletes a sale record from the 'sales' collection.
 */
export async function deleteSale(db: Firestore, id: string) {
  const ref = doc(db, "sales", id);
  return deleteDoc(ref)
    .catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `sales/${id}`,
        operation: 'delete',
      }));
      throw err;
    });
}