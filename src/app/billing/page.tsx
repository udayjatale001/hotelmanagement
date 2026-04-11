"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { collection, onSnapshot } from "firebase/firestore";
import { generateBillingNote } from "@/ai/flows/generate-billing-note";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Sparkles, Receipt, Printer } from "lucide-react";
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
      (snapshot) => {
        setInventory(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      async (err) => {
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
    if (!item) return;

    if (item.currentStock < currentQty) {
      toast({ title: "Low Stock", description: `Only ${item.currentStock} units left for ${item.itemName}.`, variant: "destructive" });
      return;
    }

    setSelectedItems([...selectedItems, { item, qty: currentQty }]);
    setCurrentSelection(null);
    setCurrentQty(1);
  };

  const removeItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const totalAmount = selectedItems.reduce((sum, entry) => sum + (entry.item.price * entry.qty), 0);

  const handleGenerateAINote = async () => {
    if (!tableNumber || selectedItems.length === 0) {
      toast({ title: "Details Missing", description: "Please enter Table No. and add items.", variant: "destructive" });
      return;
    }

    setIsGeneratingNote(true);
    try {
      const note = await generateBillingNote({
        tableNumber,
        totalAmount,
        itemsPurchased: selectedItems.map(i => i.item.itemName),
        date: new Date().toLocaleDateString()
      });
      setAiNote(note);
    } catch (err) {
      toast({ title: "AI Error", description: "Could not generate personalized note.", variant: "destructive" });
    } finally {
      setIsGeneratingNote(false);
    }
  };

  const handleFinalizeBill = async () => {
    if (!db || !userEmail) return;

    const saleData = {
      tableNumber,
      itemsList: selectedItems.map(i => ({ itemName: i.item.itemName, qty: i.qty, price: i.item.price })),
      totalAmount,
      adminEmail: userEmail,
      note: aiNote
    };

    saveBill(db, saleData)
      .then(() => {
        // Automatically deduct from inventory
        for (const entry of selectedItems) {
          updateStock(db, entry.item.id, entry.qty);
        }

        toast({ title: "Bill Finalized", description: "Transaction saved and inventory updated." });
        
        // Reset state
        setTableNumber("");
        setSelectedItems([]);
        setAiNote("");
      })
      .catch(() => {
        // Error handled globally
      });
  };

  return (
    <AppLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="tableNo">Table No.</Label>
                <Input 
                  id="tableNo" 
                  value={tableNumber} 
                  onChange={(e) => setTableNumber(e.target.value)} 
                  placeholder="e.g. Table 01"
                  className="max-w-xs"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 border rounded-xl bg-secondary/10">
                <div className="md:col-span-2 space-y-2">
                  <Label>Select Item</Label>
                  <Select onValueChange={setCurrentSelection} value={currentSelection || undefined}>
                    <SelectTrigger>
                      <SelectValue placeholder="Search inventory..." />
                    </SelectTrigger>
                    <SelectContent>
                      {inventory.map(item => (
                        <SelectItem key={item.id} value={item.id} disabled={item.currentStock === 0}>
                          {item.itemName} (${item.price.toFixed(2)}) - {item.currentStock} left
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="number" 
                      min="1" 
                      value={currentQty} 
                      onChange={(e) => setCurrentQty(Number(e.target.value))} 
                    />
                    <Button onClick={addItemToBill} size="icon" className="shrink-0"><Plus className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>

              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedItems.map((entry, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{entry.item.itemName}</TableCell>
                        <TableCell>{entry.qty}</TableCell>
                        <TableCell>${entry.item.price.toFixed(2)}</TableCell>
                        <TableCell>${(entry.item.price * entry.qty).toFixed(2)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => removeItem(idx)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {selectedItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Add items from the menu above.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" /> Personalized Note
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleGenerateAINote}
                disabled={isGeneratingNote || !tableNumber || selectedItems.length === 0}
                className="gap-2"
              >
                {isGeneratingNote ? (
                  <>Thinking...</>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3" />
                    Generate AI Note
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              <Textarea 
                placeholder="The AI will generate a polite thank you note here..."
                value={aiNote}
                onChange={(e) => setAiNote(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-primary border-t-4 shadow-lg sticky top-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" /> Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">${totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (0%):</span>
                <span className="font-medium">$0.00</span>
              </div>
              <Separator />
              <div className="flex justify-between items-end">
                <span className="text-lg font-bold">Total:</span>
                <span className="text-3xl font-headline font-bold text-primary">${totalAmount.toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button 
                className="w-full h-12 text-lg font-bold shadow-md" 
                disabled={selectedItems.length === 0}
                onClick={handleFinalizeBill}
              >
                Finalize & Save
              </Button>
              <Button variant="outline" className="w-full gap-2 border-dashed">
                <Printer className="h-4 w-4" /> Print Preview
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
