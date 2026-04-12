"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { collection, onSnapshot } from "firebase/firestore";
import { generateBillingNote } from "@/ai/flows/generate-billing-note";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Sparkles, Receipt, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth-store";
import { errorEmitter, FirestorePermissionError, useFirebase } from "@/firebase";
import { saveBill, updateStock } from "@/firebase/db-service";

export default function BillingPage() {
  const { db } = useFirebase();
  const [inventory, setInventory] = useState<any[]>([]);
  const [tableNumber, setTableNumber] = useState("");
  const [selectedItems, setSelectedItems] = useState<{item: any, qty: number}[]>([]);
  const [aiNote, setAiNote] = useState("");
  const [isGeneratingNote, setIsGeneratingNote] = useState(false);
  const [currentSelection, setCurrentSelection] = useState<string | null>(null);
  const [currentQty, setCurrentQty] = useState(1);
  const { toast } = useToast();
  const { userEmail } = useAuth();

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, "inventory"), 
      (snapshot) => setInventory(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))),
      async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'inventory',
          operation: 'list',
        }));
      }
    );
    return () => unsub();
  }, [db]);

  const addItemToBill = () => {
    if (!currentSelection) return;
    const item = inventory.find(i => i.id === currentSelection);
    if (!item || item.currentStock < currentQty) {
      toast({ title: "Check Stock", variant: "destructive" });
      return;
    }
    setSelectedItems([...selectedItems, { item, qty: currentQty }]);
    setCurrentSelection(null);
    setCurrentQty(1);
  };

  const removeItem = (idx: number) => setSelectedItems(selectedItems.filter((_, i) => i !== idx));
  const totalAmount = selectedItems.reduce((sum, entry) => sum + (entry.item.price * entry.qty), 0);

  const handleFinalizeBill = async () => {
    if (!db || !userEmail) return;
    const saleData = { tableNumber, itemsList: selectedItems.map(i => ({ itemName: i.item.itemName, qty: i.qty, price: i.item.price })), totalAmount, adminEmail: userEmail, note: aiNote };
    saveBill(db, saleData).then(() => {
      for (const entry of selectedItems) updateStock(db, entry.item.id, entry.qty);
      toast({ title: "Bill Finalized" });
      setTableNumber("");
      setSelectedItems([]);
      setAiNote("");
    });
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-4">
        <Card className="border-none shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold">New Order</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Table No.</Label>
              <Input value={tableNumber} onChange={e => setTableNumber(e.target.value)} placeholder="e.g. Table 01" className="h-12" />
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-3">
              <Select onValueChange={setCurrentSelection} value={currentSelection || undefined}>
                <SelectTrigger className="h-12"><SelectValue placeholder="Add Item..." /></SelectTrigger>
                <SelectContent>
                  {inventory.map(i => <SelectItem key={i.id} value={i.id} disabled={i.currentStock === 0}>{i.itemName} (${i.price})</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input type="number" value={currentQty} onChange={e => setCurrentQty(Number(e.target.value))} className="h-12 w-20" />
                <Button onClick={addItemToBill} className="flex-1 font-bold h-12"><Plus className="h-4 w-4 mr-2" /> ADD</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-bold">Items</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[200px]">
              <div className="divide-y">
                {selectedItems.map((entry, idx) => (
                  <div key={idx} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-xs">{entry.item.itemName}</p>
                      <p className="text-[10px] text-muted-foreground">Qty: {entry.qty} x ${entry.item.price}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeItem(idx)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                ))}
                {selectedItems.length === 0 && <p className="text-xs text-center py-8 text-muted-foreground">Add items above</p>}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-primary text-primary-foreground p-6 rounded-2xl">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Total Payable</p>
              <h2 className="text-3xl font-black">${totalAmount.toFixed(2)}</h2>
            </div>
            <Button onClick={handleFinalizeBill} disabled={selectedItems.length === 0} className="bg-white text-primary hover:bg-white/90 font-bold px-8 h-12">FINALIZE</Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}