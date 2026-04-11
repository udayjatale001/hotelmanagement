"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { collection, query, onSnapshot, orderBy, limit } from "firebase/firestore";
import { 
  BarChart, 
  TrendingUp, 
  PackageCheck,
  ArrowRight,
  Ticket,
  Receipt
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { errorEmitter, FirestorePermissionError, useFirebase } from "@/firebase";

export default function Dashboard() {
  const { db } = useFirebase();
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    inventoryCount: 0,
    recentSales: [] as any[]
  });

  useEffect(() => {
    if (!db) return;

    // Real-time listener for sales
    const qSales = query(collection(db, "sales"), orderBy("timestamp", "desc"), limit(5));
    const unsubSales = onSnapshot(qSales, 
      (snapshot) => {
        const salesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const revenue = salesData.reduce((sum: number, sale: any) => sum + (sale.totalAmount || 0), 0);
        setStats(prev => ({ 
          ...prev, 
          recentSales: salesData,
          totalSales: snapshot.size,
          totalRevenue: revenue
        }));
      },
      async (err) => {
        const permissionError = new FirestorePermissionError({
          path: 'sales',
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
      }
    );

    // Real-time listener for inventory
    const unsubInventory = onSnapshot(collection(db, "inventory"), 
      (snapshot) => {
        setStats(prev => ({ ...prev, inventoryCount: snapshot.size }));
      },
      async (err) => {
        const permissionError = new FirestorePermissionError({
          path: 'inventory',
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
      }
    );

    return () => {
      unsubSales();
      unsubInventory();
    };
  }, [db]);

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-headline font-bold text-foreground">Harmony Dashboard</h2>
            <p className="text-muted-foreground mt-1">Real-time overview of your hotel operations.</p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border shadow-sm">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Live Sync Connected</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard 
            title="Total Revenue" 
            value={`$${stats.totalRevenue.toFixed(2)}`} 
            icon={<TrendingUp className="h-6 w-6 text-primary" />}
            description="From recent transactions"
          />
          <StatCard 
            title="Total Sales" 
            value={stats.totalSales.toString()} 
            icon={<BarChart className="h-6 w-6 text-accent" />}
            description="Bills finalized"
          />
          <StatCard 
            title="Active Inventory" 
            value={stats.inventoryCount.toString()} 
            icon={<PackageCheck className="h-6 w-6 text-primary" />}
            description="Unique items in stock"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 shadow-md border-none overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between bg-white pb-4 border-b">
              <CardTitle className="text-xl">Recent Transactions</CardTitle>
              <Button asChild variant="ghost" size="sm" className="hover:bg-primary/5">
                <Link href="/billing" className="flex items-center gap-1">
                  New Order <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {stats.recentSales.length === 0 ? (
                  <p className="text-muted-foreground text-center py-12">No transactions recorded yet.</p>
                ) : (
                  stats.recentSales.map((sale: any) => (
                    <div key={sale.id} className="flex items-center justify-between p-5 hover:bg-secondary/20 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/5 rounded-xl">
                          <Receipt className="h-5 w-5 text-primary" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-bold text-sm">{sale.tableNumber || "Generic Bill"}</p>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                            {sale.timestamp?.toDate ? sale.timestamp.toDate().toLocaleString() : "Syncing..."}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-primary text-lg">${(sale.totalAmount || 0).toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground font-bold">PAID</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-none bg-primary/5">
            <CardHeader>
              <CardTitle className="text-xl">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full h-12 justify-start gap-4 text-base shadow-sm" variant="outline">
                <Link href="/tokens"><Ticket className="h-5 w-5" /> Generate Food Token</Link>
              </Button>
              <Button asChild className="w-full h-12 justify-start gap-4 text-base shadow-sm" variant="outline">
                <Link href="/billing"><Receipt className="h-5 w-5" /> Create Table Bill</Link>
              </Button>
              <Button asChild className="w-full h-12 justify-start gap-4 text-base shadow-sm" variant="outline">
                <Link href="/inventory"><PackageCheck className="h-5 w-5" /> Manage Inventory</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({ title, value, icon, description }: any) {
  return (
    <Card className="overflow-hidden border-none shadow-md bg-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-secondary/50 rounded-2xl">
            {icon}
          </div>
          <div className="px-2.5 py-1 rounded-full bg-primary/10 text-[10px] font-black text-primary uppercase tracking-widest">
            Live
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
          <p className="text-4xl font-headline font-black text-foreground tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground font-medium italic mt-2">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
