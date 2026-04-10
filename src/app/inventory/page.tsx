
"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, setDoc, deleteDoc } from "firebase/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Minus, Trash2, Edit2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  price: number;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [newItem, setNewItem] = useState({ name: "", stock: 0, price: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ name: "", stock: 0, price: 0 });
  const { toast } = useToast();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "inventory"), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem));
      setItems(data);
    });
    return () => unsub();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const id = Date.now().toString();
      await setDoc(doc(db, "inventory", id), newItem);
      setNewItem({ name: "", stock: 0, price: 0 });
      toast({ title: "Item Added", description: `${newItem.name} added to inventory.` });
    } catch (err) {
      toast({ title: "Error", description: "Failed to add item.", variant: "destructive" });
    }
  };

  const handleUpdateStock = async (id: string, delta: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const newStock = Math.max(0, item.stock + delta);
    await updateDoc(doc(db, "inventory", id), { stock: newStock });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      await deleteDoc(doc(db, "inventory", id));
      toast({ title: "Item Deleted" });
    }
  };

  const startEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditValues({ name: item.name, stock: item.stock, price: item.price });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await updateDoc(doc(db, "inventory", editingId), editValues);
    setEditingId(null);
    toast({ title: "Item Updated" });
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row gap-8">
          <Card className="w-full md:w-1/3 h-fit">
            <CardHeader>
              <CardTitle>Add New Item</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddItem} className="space-y-4">
                <div className="space-y-2">
                  <Label>Item Name</Label>
                  <Input 
                    value={newItem.name} 
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    placeholder="e.g. Bisleri 1L"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Initial Stock</Label>
                    <Input 
                      type="number"
                      value={newItem.stock} 
                      onChange={(e) => setNewItem({...newItem, stock: Number(e.target.value)})}
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

          <Card className="flex-1">
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
                          <Input value={editValues.name} onChange={e => setEditValues({...editValues, name: e.target.value})} />
                        ) : item.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => handleUpdateStock(item.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          {editingId === item.id ? (
                            <Input type="number" className="w-16 h-8" value={editValues.stock} onChange={e => setEditValues({...editValues, stock: Number(e.target.value)})} />
                          ) : (
                            <span className={cn(
                              "font-bold",
                              item.stock < 10 ? "text-destructive" : "text-primary"
                            )}>{item.stock}</span>
                          )}
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => handleUpdateStock(item.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {editingId === item.id ? (
                          <Input type="number" step="0.01" className="w-20 h-8" value={editValues.price} onChange={e => setEditValues({...editValues, price: Number(e.target.value)})} />
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
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No items in inventory. Add one above.
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
