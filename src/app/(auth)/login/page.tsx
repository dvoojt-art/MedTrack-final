
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Lock, User, ArrowLeft, Loader2, Eye, EyeOff, UserPlus } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
  const [isBootstrapAvailable, setIsBootstrapAvailable] = useState(false);

  useEffect(() => {
    // Automatically check if the system needs initial setup
    const checkAdminsExist = async () => {
      if (!db) return;
      try {
        const q = query(collection(db, "admins"), limit(1));
        const snap = await getDocs(q);
        if (snap.empty) {
          setIsBootstrapAvailable(true);
        }
      } catch (e) {
        // Silent fail for check
      }
    };
    checkAdminsExist();
  }, [db]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      if (!db) throw new Error("Database not connected");

      // 1. Check Bootstrap Mode First (Highest Priority for Setup)
      if (isBootstrapAvailable && username === "admin" && password === "password") {
        localStorage.setItem("medtrack_auth_role", "Super Admin");
        localStorage.setItem("medtrack_admin_auth", "true");
        toast({
          title: "Setup Access Granted",
          description: "Proceeding to initialize first administrator account.",
        });
        router.push("/dashboard/users");
        return;
      }

      // 2. Database Lookup for Registered Admins
      const adminsRef = collection(db, "admins");
      const emailQuery = query(adminsRef, where("email", "==", username));
      const querySnapshot = await getDocs(emailQuery);
      
      if (!querySnapshot.empty) {
        const adminDoc = querySnapshot.docs[0];
        const adminData = adminDoc.data();
        
        if (adminData.password === password) {
          if (adminData.status !== "Active") {
            toast({
              title: "Access Denied",
              description: "Account inactive. Please contact system manager.",
              variant: "destructive",
            });
          } else {
            localStorage.setItem("medtrack_auth_role", adminData.role);
            localStorage.setItem("medtrack_admin_auth", "true");
            toast({
              title: "Verification Successful",
              description: `Welcome, ${adminData.fullName}.`,
            });
            router.push("/dashboard");
          }
          setLoading(false);
          return;
        } else {
          toast({
            title: "Authentication Failed",
            description: "Incorrect password. Please try again.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      // 3. Not registered prompt
      toast({
        title: "Account Not Registered",
        description: isBootstrapAvailable 
          ? "System is uninitialized. Use setup credentials provided in the alert."
          : "This account is not recognized by the system.",
        variant: "destructive",
      });
      
    } catch (error) {
      toast({
        title: "System Error",
        description: "Could not connect to authentication services.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="absolute top-6 left-6">
        <Button variant="ghost" asChild className="text-slate-500 hover:text-primary">
          <Link href="/" className="gap-2 text-xs font-semibold uppercase tracking-wider">
            <ArrowLeft className="h-4 w-4" /> Public Portal
          </Link>
        </Button>
      </div>
      
      <div className="w-full max-w-md space-y-4">
        {isBootstrapAvailable && (
          <Alert className="bg-primary/20 border-primary text-slate-800 animate-in slide-in-from-top-4 duration-500 shadow-lg">
            <UserPlus className="h-5 w-5 text-slate-800" />
            <AlertTitle className="font-bold">Initial Setup Required</AlertTitle>
            <AlertDescription className="text-sm font-medium">
              No administrators found. Log in with default setup credentials: <br />
              <strong>User:</strong> admin | <strong>Pass:</strong> password
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-none shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500 bg-white">
          <div className="h-2 bg-primary w-full" />
          <CardHeader className="space-y-2 text-center pb-8 pt-10">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center border-4 border-slate-50 shadow-sm">
                <ShieldCheck className="h-8 w-8 text-slate-700" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold font-headline text-slate-800 tracking-tight">Admin Portal</CardTitle>
            <CardDescription className="text-slate-500 font-medium">Secure Clinical Management Access</CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8 space-y-6">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs font-bold uppercase text-slate-500">
                  Username or Work Email
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <Input 
                    id="username" 
                    type="text"
                    placeholder={isBootstrapAvailable ? "admin" : "Enter your email"} 
                    className="pl-10 h-12 border-slate-200 focus:border-primary focus:ring-primary/20"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-bold uppercase text-slate-500">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    className="pl-10 h-12 border-slate-200 focus:border-primary focus:ring-primary/20"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-slate-400 hover:text-primary"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full h-12 text-md font-bold bg-slate-700 hover:bg-slate-800 text-primary shadow-lg transition-all mt-4" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  isBootstrapAvailable ? "Initialize Setup" : "Access Dashboard"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center bg-slate-50 border-t p-6">
            <p className="text-[10px] text-slate-400 text-center leading-relaxed font-bold uppercase tracking-widest">
              Authorized access only. Security event logged.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
