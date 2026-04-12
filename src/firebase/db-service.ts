'use client';

/**
 * @fileOverview Modular Firestore database functions aligned with the provided logic.
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
 * Matches logic: { itemName, timestamp, adminEmail }
 */
export async function saveToken(db: Firestore, item: any, tokenId: string, adminEmail: string) {
  const data = {
    itemName: item.name || item.itemName,
    tokenId, // Unique ID as requested
    timestamp: serverTimestamp(),
    adminEmail: adminEmail,
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
 * Deletes a record from any collection.
 * Matches logic: deleteDoc(doc(db, col, id))
 */
export async function deleteRecord(db: Firestore, col: string, id: string) {
  const ref = doc(db, col, id);
  return deleteDoc(ref)
    .catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `${col}/${id}`,
        operation: 'delete',
      }));
      throw err;
    });
}

/**
 * Decrements stock in the 'inventory' collection.
 * Matches logic: updateDoc(stockRef, { currentStock: increment(-1) })
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
 * Matches logic: { items, total, timestamp }
 */
export async function saveBill(db: Firestore, details: any) {
  const data = {
    items: details.items || details.itemsList?.map((i: any) => i.itemName).join(", "),
    total: details.total || details.totalAmount,
    tableNumber: details.tableNumber,
    adminEmail: details.adminEmail,
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
