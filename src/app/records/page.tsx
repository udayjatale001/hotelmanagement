"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Ticket, Receipt, Calendar } from "lucide-react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { useFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { deleteToken, deleteSale } from "@/firebase/db-service";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function RecordsPage() {
  const { db } = useFirebase();
  const [tokens, setTokens] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!db) return;

    const qTokens = query(collection(db, "tokens"), orderBy("timestamp", "desc"));
    const unsubTokens = onSnapshot(qTokens, 
      (snapshot) => {
        setTokens(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'tokens',
          operation: 'list',
        }));
      }
    );

    const qSales = query(collection(db, "sales"), orderBy("timestamp", "desc"));
    const unsubSales = onSnapshot(qSales, 
      (snapshot) => {
        setSales(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'sales',
          operation: 'list',
        }));
      }
    );

    return () => {
      unsubTokens();
      unsubSales();
    };
  }, [db]);

  const handleDeleteToken = async (id: string) => {
    if (!db) return;
    deleteToken(db, id)
      .then(() => toast({ title: "Token Deleted" }))
      .catch(() => {});
  };

  const handleDeleteSale = async (id: string) => {
    if (!db) return;
    deleteSale(db, id)
      .then(() => toast({ title: "Bill Deleted" }))
      .catch(() => {});
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-headline font-bold">Records Management</h2>
          <p className="text-muted-foreground">View and manage all historical data from Firestore.</p>
        </div>

        <Tabs defaultValue="tokens" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mb-8">
            <TabsTrigger value="tokens" className="flex items-center gap-2">
              <Ticket className="h-4 w-4" /> Stored Tokens
            </TabsTrigger>
            <TabsTrigger value="bills" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" /> Bills generated
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tokens">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Stored Tokens</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Token ID</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tokens.map((token) => (
                      <TableRow key={token.id}>
                        <TableCell className="font-mono text-xs font-bold text-primary">
                          {token.tokenId}
                        </TableCell>
                        <TableCell>{token.itemName}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {token.timestamp?.toDate ? format(token.timestamp.toDate(), "PPpp") : "Syncing..."}
                        </TableCell>
                        <TableCell className="text-xs">{token.adminEmail}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteToken(token.id)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {tokens.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">
                          No tokens found in database.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bills">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Bills Generated</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Table No.</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-bold">{sale.tableNumber}</TableCell>
                        <TableCell className="font-black text-primary">${(sale.totalAmount || 0).toFixed(2)}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                          {sale.itemsList?.map((i: any) => `${i.itemName} (x${i.qty})`).join(", ")}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {sale.timestamp?.toDate ? format(sale.timestamp.toDate(), "PPpp") : "Syncing..."}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteSale(sale.id)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {sales.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">
                          No billing records found in database.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}