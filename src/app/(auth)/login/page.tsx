
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Lock, User, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useFirestore } from "@/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Check hardcoded Super Admin fallback
      if (username === "admin" && password === "password") {
        localStorage.setItem("medtrack_auth_role", "Super Admin");
        localStorage.setItem("medtrack_admin_auth", "true");
        toast({
          title: "Access Granted",
          description: "Welcome back, System Administrator.",
        });
        router.push("/dashboard");
        return;
      }

      // 2. Check registered admins in Firestore
      if (db) {
        const adminsRef = collection(db, "admins");
        const q = query(
          adminsRef, 
          where("email", "==", username), 
          where("password", "==", password),
          where("status", "==", "Active")
        );
        
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const adminData = querySnapshot.docs[0].data();
          localStorage.setItem("medtrack_auth_role", adminData.role);
          localStorage.setItem("medtrack_admin_auth", "true");
          
          toast({
            title: "Access Granted",
            description: `Welcome, ${adminData.fullName}.`,
          });
          
          router.push("/dashboard");
          return;
        }
      }

      // 3. Fallback for failed attempts
      toast({
        title: "Access Denied",
        description: "Invalid administrator credentials or account inactive.",
        variant: "destructive",
      });
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "System Error",
        description: "Could not verify credentials at this time.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="absolute top-6 left-6">
        <Button variant="ghost" asChild className="text-muted-foreground hover:text-primary">
          <Link href="/" className="gap-2 text-xs font-semibold uppercase tracking-wider">
            <ArrowLeft className="h-4 w-4" /> Exit to Public Portal
          </Link>
        </Button>
      </div>
      
      <Card className="w-full max-w-md border-none shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <div className="h-2 bg-primary w-full" />
        <CardHeader className="space-y-2 text-center pb-8 pt-10">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold font-headline text-primary tracking-tight">Admin Login</CardTitle>
          <CardDescription>Secure Administrative Access</CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8 space-y-6">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs font-bold uppercase text-muted-foreground">Admin Email</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/50" />
                <Input 
                  id="username" 
                  type="text"
                  placeholder="admin@callboxinc.com" 
                  className="pl-10 h-12 border-slate-200 focus:border-primary focus:ring-primary/20"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold uppercase text-muted-foreground">Security Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/50" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-10 h-12 border-slate-200 focus:border-primary focus:ring-primary/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-12 text-md font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all mt-4" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Access Dashboard"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center bg-slate-50 border-t p-6">
          <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
            All administrative actions are logged and audited. Authorized personnel only.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
