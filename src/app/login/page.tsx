"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Hotel } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(email, password)) {
      router.push("/");
    } else {
      toast({
        title: "Invalid Credentials",
        description: "Please check your email and password.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center font-body">
      <div className="app-container justify-center safe-padding">
        <Card className="w-full shadow-lg border-none">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Hotel className="h-10 w-10 text-primary" />
              </div>
            </div>
            <CardTitle className="text-xl font-bold">Admin Login</CardTitle>
            <CardDescription className="text-xs">
              Secure Access to HarmonyHost
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="admin@harmonyhost.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12"
                  required 
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full font-bold">
                LOGIN
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}