"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { collection, onSnapshot } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Minus, Trash2, Edit2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { errorEmitter, FirestorePermissionError, useFirebase } from "@/firebase";
import { saveInventoryItem, updateStock, updateInventoryItem, deleteRecord } from "@/firebase/db-service";

export default function InventoryPage() {
  const { db } = useFirebase();
  const [items, setItems] = useState<any[]>([]);
  const [newItem, setNewItem] = useState({ itemName: "", initialStock: 0, price: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ itemName: "", initialStock: 0, currentStock: 0, price: 0 });
  const { toast } = useToast();

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, "inventory"), 
      (snapshot) => setItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))),
      async () => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'inventory', operation: 'list' }))
    );
    return () => unsub();
  }, [db]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    saveInventoryItem(db, Date.now().toString(), { ...newItem, currentStock: newItem.initialStock })
      .then(() => {
        setNewItem({ itemName: "", initialStock: 0, price: 0 });
        toast({ title: "Item Added" });
      });
  };

  const handleUpdateStockQuick = (id: string, delta: number) => updateStock(db, id, -delta);

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setEditValues({ itemName: item.itemName, initialStock: item.initialStock, currentStock: item.currentStock, price: item.price });
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader className="p-4 pb-0"><CardTitle className="text-sm font-bold">New Inventory Item</CardTitle></CardHeader>
          <CardContent className="p-4">
            <form onSubmit={handleAddItem} className="space-y-4">
              <Input placeholder="Item Name" value={newItem.itemName} onChange={e => setNewItem({...newItem, itemName: e.target.value})} className="h-12" required />
              <div className="flex gap-2">
                <Input type="number" placeholder="Stock" value={newItem.initialStock} onChange={e => setNewItem({...newItem, initialStock: Number(e.target.value)})} className="h-12" required />
                <Input type="number" placeholder="Price" step="0.01" value={newItem.price} onChange={e => setNewItem({...newItem, price: Number(e.target.value)})} className="h-12" required />
              </div>
              <Button type="submit" className="w-full font-bold h-12">ADD STOCK</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-bold">Stock Status</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="divide-y">
                {items.map((item) => (
                  <div key={item.id} className="p-4 flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="font-bold text-sm">{item.itemName}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">${item.price}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleUpdateStockQuick(item.id, -1)}><Minus className="h-3 w-3" /></Button>
                      <span className={`w-8 text-center font-bold text-xs ${item.currentStock < 10 ? 'text-destructive' : 'text-primary'}`}>{item.currentStock}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleUpdateStockQuick(item.id, 1)}><Plus className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}