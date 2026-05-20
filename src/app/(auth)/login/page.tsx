
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Lock, User, ArrowLeft, Loader2, Eye, EyeOff, UserPlus, ShieldAlert } from "lucide-react";
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
  
  // Hydration-safe state initialization
  const [isMounted, setIsMounted] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // Setup form state
  const [setupData, setSetupData] = useState({
    fullName: "",
    email: "",
    password: ""
  });

  useEffect(() => {
    setIsMounted(true);
    
    // 1. Immediate Session Check
    const isAuth = localStorage.getItem("medtrack_admin_auth") === "true";
    if (isAuth) {
      router.push("/dashboard");
      return;
    }

    // 2. High-speed check for local initialization flag
    const wasInitialized = localStorage.getItem("medtrack_system_initialized") === "true";
    if (wasInitialized) {
      setInitialCheckDone(true);
    }

    // 3. Background Admin Existence Check
    const checkAdminsExist = async () => {
      if (!db) return;
      try {
        const q = query(collection(db, "admins"), limit(1));
        const snap = await getDocs(q);
        
        if (snap.empty) {
          setShowSetupModal(true);
          localStorage.removeItem("medtrack_system_initialized");
        } else {
          localStorage.setItem("medtrack_system_initialized", "true");
        }
        setInitialCheckDone(true);
      } catch (e) {
        setInitialCheckDone(true);
      }
    };
    
    checkAdminsExist();
  }, [db, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

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
        } else {
          toast({
            title: "Authentication Failed",
            description: "Incorrect password. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Account Not Registered",
          description: "This email is not recognized by the system.",
          variant: "destructive",
            });
      }
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

  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    if (!setupData.email.toLowerCase().endsWith(`@${ORG_DOMAIN}`)) {
      toast({
        title: "Invalid Organization",
        description: `Setup requires an official @${ORG_DOMAIN} email address.`,
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

    // Background write (optimistic)
    addDoc(collection(db, "admins"), adminData)
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: "admins",
          operation: "create",
          requestResourceData: adminData,
        });
        errorEmitter.emit("permission-error", permissionError);
      });

    // Immediate session start for maximum speed
    localStorage.setItem("medtrack_auth_role", "Super Admin");
    localStorage.setItem("medtrack_admin_auth", "true");
    localStorage.setItem("medtrack_system_initialized", "true");
    
    toast({
      title: "Setup Successful",
      description: "Welcome! Your clinical portal is now active.",
    });
    
    setShowSetupModal(false);
    router.push("/dashboard");
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Initializing System...</p>
        </div>
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
          <Card className="border-none shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 bg-slate-50">
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
                Authorized access only. Security event logged.
              </p>
            </CardFooter>
          </Card>
        )}
      </div>

      <Dialog open={showSetupModal} onOpenChange={(open) => {
        if (open || !showSetupModal) setShowSetupModal(open);
      }}>
        <DialogContent className="sm:max-w-[425px] border-none shadow-2xl animate-in fade-in zoom-in-95 duration-150" onPointerDownOutside={(e) => e.preventDefault()}>
          <form onSubmit={handleSetupSubmit}>
            <DialogHeader className="space-y-3">
              <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center text-accent mb-2">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <DialogTitle className="text-2xl font-bold font-headline text-accent">Initial Setup Required</DialogTitle>
              <DialogDescription className="text-slate-500">
                No administrators found. Please add a new Super Admin with an official @{ORG_DOMAIN} email to initialize the system.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-6">
              <div className="space-y-2">
                <Label htmlFor="setup-name" className="text-xs font-bold uppercase text-slate-500">Full Name</Label>
                <Input 
                  id="setup-name" 
                  placeholder="System Manager" 
                  className="h-11 border-slate-200"
                  value={setupData.fullName}
                  onChange={(e) => setSetupData({...setupData, fullName: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="setup-email" className="text-xs font-bold uppercase text-slate-500">Work Email</Label>
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
                <Label htmlFor="setup-password" className="text-xs font-bold uppercase text-slate-500">Password</Label>
                <Input 
                  id="setup-password" 
                  type="password"
                  placeholder="Assign secure password" 
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
                Complete Setup & Login
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
