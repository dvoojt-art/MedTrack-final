
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

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isBootstrapAvailable, setIsBootstrapAvailable] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);

  // Setup form state
  const [setupData, setSetupData] = useState({
    fullName: "",
    email: "",
    password: ""
  });

  useEffect(() => {
    const checkAdminsExist = async () => {
      if (!db) return;
      try {
        const q = query(collection(db, "admins"), limit(1));
        const snap = await getDocs(q);
        if (snap.empty) {
          setIsBootstrapAvailable(true);
          setShowSetupModal(true);
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

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setLoading(true);

    try {
      const adminData = {
        fullName: setupData.fullName,
        email: setupData.email,
        password: setupData.password,
        role: "Super Admin",
        status: "Active",
        addedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "admins"), adminData);
      
      localStorage.setItem("medtrack_auth_role", "Super Admin");
      localStorage.setItem("medtrack_admin_auth", "true");
      
      toast({
        title: "Setup Complete",
        description: "Your administrator account has been created successfully.",
      });
      
      setShowSetupModal(false);
      router.push("/dashboard");
    } catch (error) {
      toast({
        title: "Setup Failed",
        description: "Could not create administrator account.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="absolute top-6 left-6">
        <Button variant="ghost" asChild className="text-slate-600 hover:text-primary font-bold transition-colors">
          <Link href="/" className="gap-2 text-xs font-semibold uppercase tracking-wider">
            <ArrowLeft className="h-4 w-4" /> Public Portal
          </Link>
        </Button>
      </div>
      
      <div className="w-full max-w-md">
        <Card className="border-none shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500 bg-white">
          <div className="h-2 bg-primary w-full" />
          <CardHeader className="space-y-2 text-center pb-8 pt-10">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center border-4 border-slate-50 shadow-sm">
                <ShieldCheck className="h-8 w-8 text-slate-700" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold font-headline text-slate-700 tracking-tight uppercase">Admin Portal</CardTitle>
            <CardDescription className="text-slate-400 font-medium">Secure Clinical Management Access</CardDescription>
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
                    placeholder="Enter your email" 
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
                  "Access Dashboard"
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

      {/* Initial Setup Modal */}
      <Dialog open={showSetupModal} onOpenChange={setShowSetupModal}>
        <DialogContent className="sm:max-w-[425px] border-none shadow-2xl">
          <form onSubmit={handleSetupSubmit}>
            <DialogHeader className="space-y-3">
              <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center text-primary mb-2">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <DialogTitle className="text-2xl font-bold font-headline text-slate-700">Initial Setup Required</DialogTitle>
              <DialogDescription className="text-slate-500">
                No administrators found in the system. Please register the first <strong>Super Admin</strong> account to proceed.
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
                  placeholder="admin@callboxinc.com" 
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
              <Button type="submit" className="w-full h-11 bg-slate-700 hover:bg-slate-800 text-primary font-bold shadow-md" disabled={loading}>
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
