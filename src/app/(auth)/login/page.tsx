
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Lock, User, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useFirestore } from "@/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isBootstrapAvailable, setIsBootstrapAvailable] = useState(false);

  // Check if there are any admins at all. If not, we allow a bootstrap login.
  const checkAdminsExist = async () => {
    if (!db) return;
    try {
      const q = query(collection(db, "admins"), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) {
        setIsBootstrapAvailable(true);
      }
    } catch (e) {
      console.error("Check error", e);
    }
  };

  useState(() => {
    checkAdminsExist();
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!db) throw new Error("Database not connected");

      // 1. Check registered admins in Firestore
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

      // 2. Setup Fallback (Bootstrap mode)
      // Only allowed if the 'admins' collection is completely empty
      if (isBootstrapAvailable && username === "admin" && password === "password") {
        localStorage.setItem("medtrack_auth_role", "Super Admin");
        localStorage.setItem("medtrack_admin_auth", "true");
        toast({
          title: "Bootstrap Access",
          description: "System initialized. Please register a real administrator.",
        });
        router.push("/dashboard");
        return;
      }

      // 3. Fallback for failed attempts
      toast({
        title: "Access Denied",
        description: "Invalid credentials or account inactive.",
        variant: "destructive",
      });
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "System Error",
        description: "Could not verify credentials. Check database connectivity.",
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
      
      <div className="w-full max-w-md space-y-4">
        {isBootstrapAvailable && (
          <Alert variant="default" className="bg-amber-50 border-amber-200 text-amber-900 animate-in slide-in-from-top-4 duration-500">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="font-bold">System Setup Required</AlertTitle>
            <AlertDescription className="text-xs">
              No administrators found. Using bootstrap login: <strong>admin</strong> / <strong>password</strong>.
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-none shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
          <div className="h-2 bg-primary w-full" />
          <CardHeader className="space-y-2 text-center pb-8 pt-10">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold font-headline text-primary tracking-tight">Admin Login</CardTitle>
            <CardDescription>Managed Administrative Access</CardDescription>
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
                    placeholder="Enter email" 
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
              Access is restricted to registered system administrators only.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
