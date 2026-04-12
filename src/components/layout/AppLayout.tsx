"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Ticket, 
  Package, 
  Receipt, 
  LogOut,
  Database,
  ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-store";

const menuItems = [
  { name: "Dash", href: "/", icon: LayoutDashboard },
  { name: "Token", href: "/tokens", icon: Ticket },
  { name: "Inv", href: "/inventory", icon: Package },
  { name: "Bill", href: "/billing", icon: Receipt },
  { name: "Rec", href: "/records", icon: Database },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (isAuthenticated === false) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated !== true) {
    return null;
  }

  const currentPage = menuItems.find(i => i.href === pathname);

  return (
    <div className="min-h-screen bg-slate-100 font-body">
      <div className="app-container">
        {/* Header */}
        <header className="h-16 bg-white border-b border-border flex items-center justify-between px-4 shrink-0 sticky top-0 z-50">
          <div className="flex items-center gap-3">
            {pathname !== "/" && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <h1 className="text-base font-bold text-foreground truncate">
              {currentPage?.name || "HarmonyHost"}
            </h1>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-destructive h-8 w-8"
            onClick={() => {
              logout();
              router.push("/login");
            }}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 safe-padding pb-24">
          {children}
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] h-20 bg-white border-t border-border flex items-center justify-around px-2 z-50">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 transition-colors flex-1",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                <div className={cn(
                  "p-2 rounded-xl transition-all",
                  isActive ? "bg-primary/10" : ""
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-tighter">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}