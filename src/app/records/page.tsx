"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Ticket, Receipt } from "lucide-react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { useFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { deleteRecord } from "@/firebase/db-service";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function RecordsPage() {
  const { db } = useFirebase();
  const [tokens, setTokens] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!db) return;
    const qTokens = query(collection(db, "tokens"), orderBy("timestamp", "desc"));
    const unsubTokens = onSnapshot(qTokens, (s) => setTokens(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const qSales = query(collection(db, "sales"), orderBy("timestamp", "desc"));
    const unsubSales = onSnapshot(qSales, (s) => setSales(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubTokens(); unsubSales(); };
  }, [db]);

  const handleDelete = async (col: string, id: string) => {
    if (!db || !window.confirm("Delete record?")) return;
    deleteRecord(db, col, id).then(() => toast({ title: "Deleted" }));
  };

  return (
    <AppLayout>
      <Tabs defaultValue="tokens" className="w-full">
        <TabsList className="grid grid-cols-2 w-full mb-6 h-12">
          <TabsTrigger value="tokens" className="text-xs font-bold uppercase tracking-widest"><Ticket className="h-4 w-4 mr-2" /> Tokens</TabsTrigger>
          <TabsTrigger value="bills" className="text-xs font-bold uppercase tracking-widest"><Receipt className="h-4 w-4 mr-2" /> Bills</TabsTrigger>
        </TabsList>

        <TabsContent value="tokens">
          <Card className="border-none shadow-sm overflow-hidden">
            <ScrollArea className="h-[500px]">
              <div className="divide-y">
                {tokens.map(token => (
                  <div key={token.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-xs uppercase">{token.itemName}</p>
                      <p className="text-[9px] text-muted-foreground">{token.tokenId}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete("tokens", token.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="bills">
          <Card className="border-none shadow-sm overflow-hidden">
            <ScrollArea className="h-[500px]">
              <div className="divide-y">
                {sales.map(sale => (
                  <div key={sale.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-xs uppercase">{sale.tableNumber}</p>
                      <p className="text-[9px] text-primary font-black uppercase tracking-tighter">${sale.totalAmount}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete("sales", sale.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}