
"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { collection, query, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
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

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    inventoryCount: 0,
    recentSales: [] as any[]
  });

  useEffect(() => {
    // Real-time listener for sales
    const qSales = query(collection(db, "sales"), orderBy("timestamp", "desc"), limit(5));
    const unsubSales = onSnapshot(qSales, (snapshot) => {
      const salesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const revenue = salesData.reduce((sum: number, sale: any) => sum + (sale.totalAmount || 0), 0);
      setStats(prev => ({ 
        ...prev, 
        recentSales: salesData,
        totalSales: snapshot.size,
        totalRevenue: revenue
      }));
    });

    // Real-time listener for inventory
    const unsubInventory = onSnapshot(collection(db, "inventory"), (snapshot) => {
      setStats(prev => ({ ...prev, inventoryCount: snapshot.size }));
    });

    return () => {
      unsubSales();
      unsubInventory();
    };
  }, []);

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-headline font-bold text-foreground">Welcome Back, Admin</h2>
          <p className="text-muted-foreground mt-1">Here's a quick overview of HarmonyHost operations.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard 
            title="Total Revenue" 
            value={`$${stats.totalRevenue.toFixed(2)}`} 
            icon={<TrendingUp className="h-6 w-6 text-primary" />}
            description="Recent sales period"
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
            description="Items in stock"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Transactions</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/billing" className="flex items-center gap-1">
                  View All <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentSales.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No recent transactions found.</p>
                ) : (
                  stats.recentSales.map((sale: any) => (
                    <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{sale.tableNumber || "No Table"}</p>
                        <p className="text-xs text-muted-foreground">
                          {sale.timestamp?.toDate ? sale.timestamp.toDate().toLocaleDateString() : "Processing..."}
                        </p>
                      </div>
                      <p className="font-bold text-primary">${(sale.totalAmount || 0).toFixed(2)}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start gap-2" variant="outline">
                <Link href="/tokens"><Ticket className="h-4 w-4" /> Generate Token</Link>
              </Button>
              <Button asChild className="w-full justify-start gap-2" variant="outline">
                <Link href="/billing"><Receipt className="h-4 w-4" /> New Bill</Link>
              </Button>
              <Button asChild className="w-full justify-start gap-2" variant="outline">
                <Link href="/inventory"><PackageCheck className="h-4 w-4" /> Manage Stock</Link>
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
    <Card className="overflow-hidden border-none shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          {icon}
          <div className="px-2 py-1 rounded-full bg-primary/5 text-[10px] font-bold text-primary uppercase tracking-wider">
            Live
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-headline font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
