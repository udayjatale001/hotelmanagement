'use client';

/**
 * @fileOverview Modular Firestore database functions with success logging.
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
    tokenId,
    timestamp: serverTimestamp(),
    adminEmail: adminEmail,
    status: "generated"
  };

  return addDoc(collection(db, "tokens"), data)
    .then((docRef) => {
      console.log("Data Saved!");
      return docRef;
    })
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
 * Deletes a record from a specific collection ('tokens' or 'sales').
 */
export async function deleteRecord(db: Firestore, col: string, id: string) {
  const ref = doc(db, col, id);
  return deleteDoc(ref)
    .then(() => {
      console.log("Data Deleted!");
    })
    .catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `${col}/${id}`,
        operation: 'delete',
      }));
      throw err;
    });
}

/**
 * Decrements stock in the 'inventory' collection using updateDoc.
 */
export async function updateStock(db: Firestore, itemId: string, quantityToSubtract: number) {
  const ref = doc(db, "inventory", itemId);
  return updateDoc(ref, {
    currentStock: increment(-quantityToSubtract)
  })
  .then(() => {
    console.log("Data Saved!");
  })
  .catch(async (err) => {
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
    items: details.items || details.itemsList?.map((i: any) => i.itemName).join(", "),
    total: details.total || details.totalAmount,
    tableNumber: details.tableNumber,
    adminEmail: details.adminEmail,
    timestamp: serverTimestamp(),
    note: details.note || ""
  };

  return addDoc(collection(db, "sales"), data)
    .then((docRef) => {
      console.log("Data Saved!");
      return docRef;
    })
    .catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'sales',
        operation: 'create',
        requestResourceData: data,
      }));
      throw err;
    });
}