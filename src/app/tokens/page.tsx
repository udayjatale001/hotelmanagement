"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { Ticket, History, Printer, CheckCircle2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-store";
import { errorEmitter, FirestorePermissionError, useFirebase } from "@/firebase";
import { saveToken } from "@/firebase/db-service";

const FOOD_ITEMS = [
  { name: "Kachori", price: 1.50, color: "bg-orange-500" },
  { name: "Samosa", price: 1.20, color: "bg-red-500" },
  { name: "Pohe", price: 2.00, color: "bg-yellow-500" },
  { name: "Dhosa", price: 3.50, color: "bg-green-500" },
];

export default function TokenPage() {
  const { db } = useFirebase();
  const [recentTokens, setRecentTokens] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const { toast } = useToast();
  const { userEmail } = useAuth();

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "tokens"), orderBy("timestamp", "desc"), limit(10));
    const unsub = onSnapshot(q, 
      (snapshot) => {
        setRecentTokens(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'tokens',
          operation: 'list',
        }));
      }
    );
    return () => unsub();
  }, [db]);

  const handleGenerateToken = async (item: any) => {
    if (!db || !userEmail) return;
    setIsGenerating(item.name);
    const tokenId = `HH-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;
    
    saveToken(db, item, tokenId, userEmail)
      .then(() => {
        toast({ title: "Token Generated", description: `${item.name} (${tokenId})` });
      })
      .finally(() => setIsGenerating(null));
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-3">
          {FOOD_ITEMS.map((item) => (
            <Card key={item.name} className="border-none shadow-sm bg-white overflow-hidden">
              <div className={cn("h-1.5 w-full", item.color)} />
              <CardContent className="p-4 flex flex-col items-center gap-2">
                <Ticket className="h-6 w-6 text-slate-300" />
                <h3 className="font-bold text-sm">{item.name}</h3>
                <span className="text-xs font-black text-primary">${item.price.toFixed(2)}</span>
                <Button 
                  size="sm"
                  className="w-full h-10 font-bold text-[10px] mt-2" 
                  onClick={() => handleGenerateToken(item)}
                  disabled={isGenerating === item.name}
                >
                  {isGenerating === item.name ? "WAIT" : "ISSUE"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-none shadow-sm bg-white flex flex-col">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <History className="h-4 w-4 text-primary" /> Last 10 Tokens
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px]">
              <div className="divide-y">
                {recentTokens.map((token) => (
                  <div key={token.id} className="p-4 flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="font-bold text-xs uppercase">{token.itemName}</p>
                      <p className="text-[10px] text-muted-foreground font-mono bg-slate-100 px-2 py-0.5 rounded-full inline-block">
                        {token.tokenId}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                        <Printer className="h-4 w-4" />
                      </Button>
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