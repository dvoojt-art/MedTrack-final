
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Lock, User, ArrowLeft, Loader2, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useFirestore } from "@/firebase";
import { collection, query, getDocs, limit, where } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useAuth } from "@/firebase/provider";

const ORG_DOMAIN = "callboxinc.com";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const auth = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [isMounted, setIsMounted] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [isSystemFresh, setIsSystemFresh] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Check if system is already initialized via localStorage to bypass audit
    const systemInitialized = localStorage.getItem("medtrack_system_initialized") === "true";
    
    if (systemInitialized) {
      setInitialCheckDone(true);
      return;
    }

    // Perform background audit ONLY if system is not known to be initialized
    const checkAdminsExist = async () => {
      if (!db) return;
      try {
        const adminsRef = collection(db, "admins");
        const q = query(adminsRef, limit(1));
        const snap = await getDocs(q);
        
        if (snap.empty) {
          setIsSystemFresh(true);
        } else {
          localStorage.setItem("medtrack_system_initialized", "true");
        }
      } catch (e) {
        console.error('[Auth] System audit failed:', e);
      } finally {
        setInitialCheckDone(true);
      }
    };
    
    checkAdminsExist();
  }, [db]);

  const validateEmail = (email: string) => {
    return email.toLowerCase().endsWith(`@${ORG_DOMAIN}`);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!validateEmail(username)) {
      toast({
        title: "Invalid Domain",
        description: `Only users with @${ORG_DOMAIN} emails can access the dashboard.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Provisional Bootstrap Login (Case Insensitive)
    if (isSystemFresh && username.toLowerCase() === `admin@${ORG_DOMAIN}` && password === "password123") {
      localStorage.setItem("medtrack_auth_role", "Super Admin");
      localStorage.setItem("medtrack_admin_auth", "true");
      router.push("/dashboard");
      return;
    }

    try {
      if (!auth) throw new Error("Auth service unavailable");
      await signInWithEmailAndPassword(auth, username, password);

      const adminsRef = collection(db!, "admins");
      const emailQuery = query(adminsRef, where("email", "==", username));
      const querySnapshot = await getDocs(emailQuery);
      
      if (!querySnapshot.empty) {
        const adminData = querySnapshot.docs[0].data();
        if (adminData.status !== "Active") {
          toast({
            title: "Access Denied",
            description: "Your account is currently inactive.",
            variant: "destructive",
          });
        } else {
          localStorage.setItem("medtrack_auth_role", adminData.role);
          localStorage.setItem("medtrack_admin_auth", "true");
          localStorage.setItem("medtrack_system_initialized", "true");
          router.push("/dashboard");
        }
      } else {
        toast({
          title: "Access Denied",
          description: "Administrative profile not found in system.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Authentication Failed",
        description: error.message || "Incorrect email or password.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="absolute top-6 left-6">
        <Button variant="ghost" asChild className="text-accent hover:text-primary font-bold transition-colors">
          <Link href="/" className="gap-2 text-xs font-semibold uppercase tracking-wider">
            <ArrowLeft className="h-4 w-4" /> Public Portal
          </Link>
        </Button>
      </div>
      
      <div className="w-full max-w-md">
        <div className="space-y-6">
          {initialCheckDone && isSystemFresh && (
            <Card className="border-amber-200 bg-amber-50 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-amber-800">
                  <ShieldAlert className="h-4 w-4" />
                  <CardTitle className="text-sm font-bold uppercase tracking-wide">System Bootstrap Active</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-amber-700 leading-relaxed font-medium">
                  No administrators detected. Use provisional credentials to initialize:
                </p>
                <div className="mt-3 p-3 bg-white rounded border border-amber-200 space-y-1">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-400">EMAIL:</span>
                    <code className="text-amber-800">admin@callboxinc.com</code>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-400">PASS:</span>
                    <code className="text-amber-800">password123</code>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-none shadow-2xl overflow-hidden bg-slate-50">
            <div className="h-2 bg-primary w-full" />
            <CardHeader className="space-y-2 text-center pb-8 pt-10">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-accent rounded-2xl flex items-center justify-center border-4 border-white shadow-sm">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold font-headline text-accent tracking-tight uppercase">Admin Portal</CardTitle>
              <CardDescription className="text-slate-500 font-medium">Secure Clinical Management Access</CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-6">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-xs font-bold uppercase text-slate-500">Work Email</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <Input 
                      id="username" 
                      type="text"
                      placeholder={`Enter your @${ORG_DOMAIN} email`} 
                      className={`pl-10 h-12 border-slate-200 focus:border-primary focus:ring-primary/20 bg-white ${username && !validateEmail(username) ? 'border-destructive ring-destructive/20' : ''}`}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                  {username && !validateEmail(username) && (
                    <p className="text-[10px] font-bold text-destructive uppercase pl-1">Requires official @{ORG_DOMAIN} address</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-bold uppercase text-slate-500">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      className="pl-10 h-12 border-slate-200 focus:border-primary focus:ring-primary/20 bg-white"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button type="button" className="absolute right-3 top-3 text-slate-400" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 text-md font-bold bg-accent hover:bg-accent/90 text-primary shadow-lg mt-4" disabled={loading || !initialCheckDone}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Access Dashboard"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col items-center bg-slate-100 border-t p-6">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Authorized access only.</p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
