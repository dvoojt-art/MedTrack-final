
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Lock, User, ArrowLeft, Loader2, Eye, EyeOff, UserPlus, ShieldAlert, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useFirestore } from "@/firebase";
import { collection, query, getDocs, limit, addDoc, serverTimestamp, where } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

const ORG_DOMAIN = "callboxinc.com";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  
  const [isMounted, setIsMounted] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [isSystemFresh, setIsSystemFresh] = useState(false);

  const [setupData, setSetupData] = useState({
    fullName: "",
    email: "",
    password: ""
  });

  useEffect(() => {
    setIsMounted(true);
    console.log('[Auth] Login page mounted. Executing security audit...');
    
    const checkAdminsExist = async () => {
      if (!db) {
        console.warn('[Auth] Database connection not ready for admin audit.');
        return;
      }

      try {
        console.log('[Auth] Auditing system administrators in Firestore...');
        const adminsRef = collection(db, "admins");
        const q = query(adminsRef, limit(1));
        const snap = await getDocs(q);
        
        if (snap.empty) {
          console.log('[Auth] CRITICAL: ZERO administrators found. System is in Bootstrap Mode.');
          setIsSystemFresh(true);
          // Clear stale local sessions if no admins exist in DB
          localStorage.removeItem("medtrack_admin_auth");
          localStorage.removeItem("medtrack_auth_role");
          localStorage.removeItem("medtrack_system_initialized");
        } else {
          console.log(`[Auth] System audit successful: Found ${snap.size} active administrator(s).`);
          localStorage.setItem("medtrack_system_initialized", "true");
          setIsSystemFresh(false);

          // Only redirect if system is initialized and session is valid
          const isAuth = localStorage.getItem("medtrack_admin_auth") === "true";
          if (isAuth) {
            console.log('[Auth] Valid session found. Redirecting to dashboard.');
            router.push("/dashboard");
          }
        }
      } catch (e) {
        console.error('[Auth] Error during system security audit:', e);
      } finally {
        setInitialCheckDone(true);
      }
    };
    
    checkAdminsExist();
  }, [db, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    console.log('[Auth] Login attempt initiated for:', username);

    // Bootstrap Dummy Credential Check
    if (isSystemFresh && username.toLowerCase() === "admin@callboxinc.com" && password === "password123") {
      console.log('[Auth] Bootstrap access granted via provisional credentials.');
      localStorage.setItem("medtrack_auth_role", "Super Admin");
      localStorage.setItem("medtrack_admin_auth", "true");
      toast({
        title: "Provisional Access Granted",
        description: "Welcome to Bootstrap Mode. Please complete clinical setup.",
      });
      router.push("/dashboard");
      return;
    }

    try {
      if (!db) throw new Error("Database not connected");

      const adminsRef = collection(db, "admins");
      const emailQuery = query(adminsRef, where("email", "==", username));
      const querySnapshot = await getDocs(emailQuery);
      
      if (!querySnapshot.empty) {
        const adminDoc = querySnapshot.docs[0];
        const adminData = adminDoc.data();
        
        if (adminData.password === password) {
          if (adminData.status !== "Active") {
            console.warn('[Auth] Denied: Inactive account:', username);
            toast({
              title: "Access Denied",
              description: "Account inactive. Please contact system manager.",
              variant: "destructive",
            });
          } else {
            console.log('[Auth] Credentials verified for:', username);
            localStorage.setItem("medtrack_auth_role", adminData.role);
            localStorage.setItem("medtrack_admin_auth", "true");
            toast({
              title: "Verification Successful",
              description: `Welcome, ${adminData.fullName}.`,
            });
            router.push("/dashboard");
          }
        } else {
          console.warn('[Auth] Invalid password attempt for:', username);
          toast({
            title: "Authentication Failed",
            description: "Incorrect password. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        console.warn('[Auth] Account not found for:', username);
        toast({
          title: "Account Not Recognized",
          description: "This email is not registered in our clinical records.",
          variant: "destructive",
            });
      }
    } catch (error) {
      console.error('[Auth] Authentication processing error:', error);
      toast({
        title: "System Error",
        description: "Could not establish a secure connection to auth services.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    console.log('[Auth] Initiating primary Super Admin registration...');

    if (!setupData.email.toLowerCase().endsWith(`@${ORG_DOMAIN}`)) {
      console.warn('[Auth] Registration blocked: Unauthorized domain.', setupData.email);
      toast({
        title: "Invalid Domain",
        description: `Official registration requires an @${ORG_DOMAIN} email.`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    const adminData = {
      fullName: setupData.fullName,
      email: setupData.email,
      password: setupData.password,
      role: "Super Admin",
      status: "Active",
      addedAt: serverTimestamp(),
    };

    addDoc(collection(db, "admins"), adminData)
      .then(() => {
        console.log('[Auth] Super Admin successfully registered in Firestore.');
        localStorage.setItem("medtrack_auth_role", "Super Admin");
        localStorage.setItem("medtrack_admin_auth", "true");
        localStorage.setItem("medtrack_system_initialized", "true");
        
        toast({
          title: "Facility Secured",
          description: "Welcome! The clinical management system is now active.",
        });
        
        setShowSetupModal(false);
        router.push("/dashboard");
      })
      .catch((error) => {
        console.error('[Auth] Firestore registration failed:', error);
        const permissionError = new FirestorePermissionError({
          path: "admins",
          operation: "create",
          requestResourceData: adminData,
        });
        errorEmitter.emit("permission-error", permissionError);
        setLoading(false);
      });
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
        {!initialCheckDone ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Security Check...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {isSystemFresh && (
              <Card className="border-amber-200 bg-amber-50 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-amber-800">
                    <ShieldAlert className="h-4 w-4" />
                    <CardTitle className="text-sm font-bold uppercase tracking-wide">System Bootstrap Active</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-amber-700 leading-relaxed font-medium">
                    No administrators detected. Use the provisional credentials below to enter and initialize the clinical system:
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
                    <Label htmlFor="username" className="text-xs font-bold uppercase text-slate-500">
                      Work Email Address
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                      <Input 
                        id="username" 
                        type="text"
                        placeholder={`Enter your @${ORG_DOMAIN} email`} 
                        className="pl-10 h-12 border-slate-200 focus:border-primary focus:ring-primary/20 bg-white"
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
                        className="pl-10 h-12 border-slate-200 focus:border-primary focus:ring-primary/20 bg-white"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-3 text-slate-400 hover:text-primary transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 text-md font-bold bg-accent hover:bg-accent/90 text-primary shadow-lg transition-all mt-4" disabled={loading}>
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
              <CardFooter className="flex flex-col items-center bg-slate-100 border-t p-6">
                <p className="text-[10px] text-slate-500 text-center leading-relaxed font-bold uppercase tracking-widest">
                  Authorized access only. All sessions monitored.
                </p>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>

      <Dialog open={showSetupModal} onOpenChange={setShowSetupModal}>
        <DialogContent className="sm:max-w-[425px]" onPointerDownOutside={(e) => e.preventDefault()}>
          <form onSubmit={handleSetupSubmit}>
            <DialogHeader className="space-y-3">
              <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center text-accent mb-2">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <DialogTitle className="text-2xl font-bold font-headline text-accent">Facility Initialization</DialogTitle>
              <DialogDescription className="text-slate-500">
                Register a primary Super Admin with an official @{ORG_DOMAIN} address to secure this clinical facility.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-6">
              <div className="space-y-2">
                <Label htmlFor="setup-name" className="text-xs font-bold uppercase text-slate-500">Full Name</Label>
                <Input 
                  id="setup-name" 
                  placeholder="Clinical Manager" 
                  className="h-11 border-slate-200"
                  value={setupData.fullName}
                  onChange={(e) => setSetupData({...setupData, fullName: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="setup-email" className="text-xs font-bold uppercase text-slate-500">Organization Email</Label>
                <Input 
                  id="setup-email" 
                  type="email"
                  placeholder={`admin@${ORG_DOMAIN}`} 
                  className="h-11 border-slate-200"
                  value={setupData.email}
                  onChange={(e) => setSetupData({...setupData, email: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="setup-password" className="text-xs font-bold uppercase text-slate-500">Master Password</Label>
                <Input 
                  id="setup-password" 
                  type="password"
                  placeholder="Assign secure credential" 
                  className="h-11 border-slate-200"
                  value={setupData.password}
                  onChange={(e) => setSetupData({...setupData, password: e.target.value})}
                  required 
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full h-11 bg-accent hover:bg-accent/90 text-primary font-bold shadow-md">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                Complete Clinical Initialization
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
