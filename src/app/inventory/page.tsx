"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { collection, onSnapshot, doc, updateDoc, setDoc, deleteDoc } from "firebase/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Minus, Trash2, Edit2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { errorEmitter, FirestorePermissionError, useFirebase } from "@/firebase";

interface InventoryItem {
  id: string;
  itemName: string;
  initialStock: number;
  currentStock: number;
  price: number;
}

export default function InventoryPage() {
  const { db } = useFirebase();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [newItem, setNewItem] = useState({ itemName: "", initialStock: 0, price: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ itemName: "", initialStock: 0, currentStock: 0, price: 0 });
  const { toast } = useToast();

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, "inventory"), 
      (snapshot) => {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem));
        setItems(data);
      },
      async (err) => {
        const permissionError = new FirestorePermissionError({
          path: 'inventory',
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
      }
    );
    return () => unsub();
  }, [db]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    const id = Date.now().toString();
    const data = {
      itemName: newItem.itemName,
      initialStock: newItem.initialStock,
      currentStock: newItem.initialStock,
      price: newItem.price
    };

    setDoc(doc(db, "inventory", id), data)
      .then(() => {
        setNewItem({ itemName: "", initialStock: 0, price: 0 });
        toast({ title: "Item Added", description: `${data.itemName} added to inventory.` });
      })
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: `inventory/${id}`,
          operation: 'create',
          requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const handleUpdateStock = async (id: string, delta: number) => {
    if (!db) return;
    const item = items.find(i => i.id === id);
    if (!item) return;
    const newStock = Math.max(0, item.currentStock + delta);
    
    updateDoc(doc(db, "inventory", id), { currentStock: newStock })
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: `inventory/${id}`,
          operation: 'update',
          requestResourceData: { currentStock: newStock },
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    if (confirm("Are you sure you want to delete this item?")) {
      deleteDoc(doc(db, "inventory", id))
        .then(() => toast({ title: "Item Deleted" }))
        .catch(async (err) => {
          const permissionError = new FirestorePermissionError({
            path: `inventory/${id}`,
            operation: 'delete',
          });
          errorEmitter.emit('permission-error', permissionError);
        });
    }
  };

  const startEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditValues({ 
      itemName: item.itemName, 
      initialStock: item.initialStock, 
      currentStock: item.currentStock,
      price: item.price 
    });
  };

  const saveEdit = async () => {
    if (!db || !editingId) return;
    updateDoc(doc(db, "inventory", editingId), editValues)
      .then(() => {
        setEditingId(null);
        toast({ title: "Item Updated" });
      })
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: `inventory/${editingId}`,
          operation: 'update',
          requestResourceData: editValues,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row gap-8">
          <Card className="w-full md:w-1/3 h-fit shadow-md">
            <CardHeader>
              <CardTitle>Add New Item</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddItem} className="space-y-4">
                <div className="space-y-2">
                  <Label>Item Name</Label>
                  <Input 
                    value={newItem.itemName} 
                    onChange={(e) => setNewItem({...newItem, itemName: e.target.value})}
                    placeholder="e.g. Bisleri 1L"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Initial Stock</Label>
                    <Input 
                      type="number"
                      value={newItem.initialStock} 
                      onChange={(e) => setNewItem({...newItem, initialStock: Number(e.target.value)})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Price ($)</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={newItem.price} 
                      onChange={(e) => setNewItem({...newItem, price: Number(e.target.value)})}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">Add to Stock</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="flex-1 shadow-md">
            <CardHeader>
              <CardTitle>Inventory List</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Stock Level</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {editingId === item.id ? (
                          <Input value={editValues.itemName} onChange={e => setEditValues({...editValues, itemName: e.target.value})} />
                        ) : item.itemName}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleUpdateStock(item.id, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          {editingId === item.id ? (
                            <Input type="number" className="w-20 h-9" value={editValues.currentStock} onChange={e => setEditValues({...editValues, currentStock: Number(e.target.value)})} />
                          ) : (
                            <span className={cn(
                              "font-bold text-lg w-10 text-center",
                              item.currentStock < 10 ? "text-destructive" : "text-primary"
                            )}>{item.currentStock}</span>
                          )}
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleUpdateStock(item.id, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {editingId === item.id ? (
                          <Input type="number" step="0.01" className="w-24 h-9" value={editValues.price} onChange={e => setEditValues({...editValues, price: Number(e.target.value)})} />
                        ) : `$${item.price.toFixed(2)}`}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {editingId === item.id ? (
                            <>
                              <Button variant="ghost" size="icon" onClick={saveEdit}><Save className="h-4 w-4 text-green-600" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => setEditingId(null)}><X className="h-4 w-4 text-destructive" /></Button>
                            </>
                          ) : (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => startEdit(item)}><Edit2 className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                        No items in inventory. Add one to the left.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
