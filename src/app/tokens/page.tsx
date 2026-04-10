
"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, limit } from "firebase/firestore";
import { Ticket, History, Printer, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const FOOD_ITEMS = [
  { name: "Kachori", price: 1.50, color: "bg-orange-500" },
  { name: "Samosa", price: 1.20, color: "bg-red-500" },
  { name: "Pohe", price: 2.00, color: "bg-yellow-500" },
  { name: "Dhosa", price: 3.50, color: "bg-green-500" },
];

export default function TokenPage() {
  const [recentTokens, setRecentTokens] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "tokens"), orderBy("timestamp", "desc"), limit(10));
    const unsub = onSnapshot(q, (snapshot) => {
      setRecentTokens(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const generateToken = async (item: any) => {
    setIsGenerating(item.name);
    try {
      const serial = `HH-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;
      await addDoc(collection(db, "tokens"), {
        itemName: item.name,
        price: item.price,
        serial,
        timestamp: serverTimestamp(),
        status: "generated"
      });
      
      toast({
        title: "Token Generated",
        description: `Serial: ${serial} for ${item.name}`,
        variant: "default"
      });
    } catch (err) {
      toast({
        title: "Failed",
        description: "Could not generate token.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <AppLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-2xl font-headline font-bold">Menu Items</h2>
            <p className="text-muted-foreground">Select an item to generate a fresh food token.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FOOD_ITEMS.map((item) => (
              <Card key={item.name} className="group hover:shadow-lg transition-all cursor-pointer overflow-hidden border-none bg-white">
                <div className={cn("h-2 w-full", item.color)} />
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-secondary rounded-xl group-hover:bg-primary/10 transition-colors">
                      <Ticket className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-xl font-bold text-primary">${item.price.toFixed(2)}</span>
                  </div>
                  <h3 className="text-lg font-bold mb-1">{item.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">Freshly prepared hotel special.</p>
                  <Button 
                    className="w-full" 
                    onClick={() => generateToken(item)}
                    disabled={isGenerating === item.name}
                  >
                    {isGenerating === item.name ? "Generating..." : "Generate Token"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <Card className="h-full max-h-[600px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-4 w-4" /> Recent Tokens
              </CardTitle>
            </CardHeader>
            <Separator />
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {recentTokens.map((token) => (
                  <div key={token.id} className="p-4 rounded-lg bg-secondary/30 border border-border/50 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-primary px-2 py-0.5 bg-primary/10 rounded">{token.serial}</span>
                      <span className="text-xs text-muted-foreground">
                        {token.timestamp?.toDate ? token.timestamp.toDate().toLocaleTimeString() : "Pending..."}
                      </span>
                    </div>
                    <div className="flex justify-between items-end">
                      <p className="font-bold">{token.itemName}</p>
                      <div className="flex gap-2">
                         <Button variant="ghost" size="icon" className="h-7 w-7"><Printer className="h-3.5 w-3.5" /></Button>
                         <CheckCircle2 className="h-4 w-4 text-green-500 self-center" />
                      </div>
                    </div>
                  </div>
                ))}
                {recentTokens.length === 0 && (
                  <div className="text-center py-10 opacity-50">
                    <Ticket className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">No tokens generated yet</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
