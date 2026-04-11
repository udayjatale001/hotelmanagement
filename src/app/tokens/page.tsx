
"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, limit } from "firebase/firestore";
import { Ticket, History, Printer, CheckCircle2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-store";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

const FOOD_ITEMS = [
  { name: "Kachori", price: 1.50, color: "bg-orange-500", description: "Hot & Crispy Rajasthani Style" },
  { name: "Samosa", price: 1.20, color: "bg-red-500", description: "Classic Spiced Potato Filling" },
  { name: "Pohe", price: 2.00, color: "bg-yellow-500", description: "Indori Style with Sev" },
  { name: "Dhosa", price: 3.50, color: "bg-green-500", description: "Crispy South Indian Delight" },
];

export default function TokenPage() {
  const [recentTokens, setRecentTokens] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const { toast } = useToast();
  const { userEmail } = useAuth();

  useEffect(() => {
    const q = query(collection(db, "tokens"), orderBy("timestamp", "desc"), limit(10));
    const unsub = onSnapshot(q, 
      (snapshot) => {
        setRecentTokens(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      async (err) => {
        const permissionError = new FirestorePermissionError({
          path: 'tokens',
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
      }
    );
    return () => unsub();
  }, []);

  const generateToken = async (item: any) => {
    setIsGenerating(item.name);
    const tokenId = `HH-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;
    const data = {
      itemName: item.name,
      price: item.price,
      tokenId,
      timestamp: serverTimestamp(),
      adminEmail: userEmail,
      status: "generated"
    };

    addDoc(collection(db, "tokens"), data)
      .then(() => {
        toast({
          title: "Token Generated",
          description: `Token: ${tokenId} for ${item.name}`,
          variant: "default"
        });
      })
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: 'tokens',
          operation: 'create',
          requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsGenerating(null);
      });
  };

  return (
    <AppLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-headline font-bold">Food Token Menu</h2>
              <p className="text-muted-foreground">Select an item to generate an instant food token.</p>
            </div>
            <div className="p-2 bg-primary/5 rounded-full">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {FOOD_ITEMS.map((item) => (
              <Card key={item.name} className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-none shadow-md bg-white">
                <div className={cn("h-2 w-full", item.color)} />
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-4 bg-secondary/50 rounded-2xl group-hover:bg-primary/10 transition-colors">
                      <Ticket className="h-7 w-7 text-primary" />
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-primary">${item.price.toFixed(2)}</span>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Price</p>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-1">{item.name}</h3>
                  <p className="text-sm text-muted-foreground mb-6">{item.description}</p>
                  <Button 
                    className="w-full h-11 text-base font-semibold group-hover:shadow-lg transition-shadow" 
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
          <Card className="h-full max-h-[700px] flex flex-col shadow-md border-none">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5 text-primary" /> Recent Tokens
              </CardTitle>
              <span className="text-xs text-muted-foreground font-medium">Last 10</span>
            </CardHeader>
            <Separator />
            <ScrollArea className="flex-1 p-4 bg-secondary/5">
              <div className="space-y-4">
                {recentTokens.map((token) => (
                  <div key={token.id} className="p-5 rounded-xl bg-white border shadow-sm hover:border-primary/30 transition-colors space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-primary px-3 py-1 bg-primary/10 rounded-full tracking-wider">{token.tokenId}</span>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {token.timestamp?.toDate ? token.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "Pending..."}
                      </span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="font-bold text-lg leading-none">{token.itemName}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 font-semibold">{token.adminEmail}</p>
                      </div>
                      <div className="flex gap-2">
                         <Button variant="outline" size="icon" className="h-8 w-8 rounded-full"><Printer className="h-4 w-4" /></Button>
                         <div className="h-8 w-8 bg-green-50 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                         </div>
                      </div>
                    </div>
                  </div>
                ))}
                {recentTokens.length === 0 && (
                  <div className="text-center py-20 opacity-30">
                    <Ticket className="h-12 w-12 mx-auto mb-3" />
                    <p className="text-sm font-bold">No tokens yet</p>
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
