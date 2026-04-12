"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { collection, query, onSnapshot, orderBy, limit } from "firebase/firestore";
import { 
  TrendingUp, 
  PackageCheck,
  ArrowRight,
  Receipt,
  CircleDollarSign
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { errorEmitter, FirestorePermissionError, useFirebase } from "@/firebase";
import { cn } from "@/lib/utils";

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
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'sales',
          operation: 'list',
        }));
      }
    );

    const unsubInventory = onSnapshot(collection(db, "inventory"), 
      (snapshot) => {
        setStats(prev => ({ ...prev, inventoryCount: snapshot.size }));
      },
      async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'inventory',
          operation: 'list',
        }));
      }
    );

    return () => {
      unsubSales();
      unsubInventory();
    };
  }, [db]);

  return (
    <AppLayout>
      <div className="flex flex-col gap-5">
        <div className="space-y-1 px-1">
          <h2 className="text-xl font-bold text-foreground">Harmony Dashboard</h2>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Live System</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <StatCard 
            title="Revenue" 
            value={`$${stats.totalRevenue.toFixed(0)}`} 
            icon={<TrendingUp className="h-4 w-4" />}
            color="bg-primary/10 text-primary"
          />
          <StatCard 
            title="Inv Stock" 
            value={stats.inventoryCount.toString()} 
            icon={<PackageCheck className="h-4 w-4" />}
            color="bg-accent/20 text-accent-foreground"
          />
        </div>

        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold">Recent Bills</CardTitle>
            <Link href="/records" className="text-[10px] font-bold uppercase text-primary flex items-center gap-1">
              History <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="px-0">
            <div className="divide-y">
              {stats.recentSales.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No records found.</p>
              ) : (
                stats.recentSales.map((sale: any) => (
                  <div key={sale.id} className="flex items-center justify-between p-4 hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        <Receipt className="h-4 w-4 text-slate-500" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-bold text-xs uppercase">{sale.tableNumber || "Order"}</p>
                        <p className="text-[9px] text-muted-foreground font-medium">
                          {sale.timestamp?.toDate ? sale.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "..."}
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-primary text-sm">${(sale.totalAmount || 0).toFixed(2)}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-3">
          <Button asChild className="w-full justify-between h-14 rounded-xl shadow-sm" variant="outline">
            <Link href="/tokens" className="flex items-center gap-3 px-2">
              <span className="flex items-center gap-3">
                <CircleDollarSign className="h-5 w-5 text-primary" />
                <span className="font-bold text-sm">Create Food Token</span>
              </span>
              <ArrowRight className="h-4 w-4 opacity-50" />
            </Link>
          </Button>
          <Button asChild className="w-full justify-between h-14 rounded-xl shadow-sm" variant="outline">
            <Link href="/billing" className="flex items-center gap-3 px-2">
              <span className="flex items-center gap-3">
                <Receipt className="h-5 w-5 text-primary" />
                <span className="font-bold text-sm">Generate Table Bill</span>
              </span>
              <ArrowRight className="h-4 w-4 opacity-50" />
            </Link>
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <Card className="border-none shadow-sm bg-white p-4">
      <div className="flex flex-col gap-2">
        <div className={cn("p-2 w-fit rounded-lg", color)}>
          {icon}
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
          <p className="text-xl font-black tabular-nums">{value}</p>
        </div>
      </div>
    </Card>
  );
}
