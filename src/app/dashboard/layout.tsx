
"use client";

import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirestore, useAuth } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

const ORG_DOMAIN = "callboxinc.com";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const db = useFirestore();
  const auth = useAuth();

  const [setupData, setSetupData] = useState({
    fullName: "",
    email: "",
    password: ""
  });

  useEffect(() => {
    const isAuth = localStorage.getItem("medtrack_admin_auth") === "true";
    const userRole = localStorage.getItem("medtrack_auth_role");
    const systemInitialized = localStorage.getItem("medtrack_system_initialized") === "true";

    if (!isAuth) {
      router.push("/login");
      return;
    }

    if (!systemInitialized && userRole === "Super Admin") {
      setShowSetup(true);
    }

    if (pathname === "/dashboard/users" && userRole !== "Super Admin") {
      toast({
        title: "Access Denied",
        description: "Administrative clearance required.",
        variant: "destructive",
      });
      router.push("/dashboard");
      return;
    }

    setIsAuthorized(true);
  }, [router, pathname, toast]);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupData.email.toLowerCase().endsWith(`@${ORG_DOMAIN}`)) {
      toast({
        title: "Invalid Domain",
        description: `Only @${ORG_DOMAIN} addresses are authorized.`,
        variant: "destructive",
      });
      return;
    }

    // Optimistic UI: Close immediately to allow dashboard access
    setShowSetup(false);
    localStorage.setItem("medtrack_system_initialized", "true");
    
    toast({
      title: "Registering Profile",
      description: "Finalizing facility initialization in background...",
    });

    const adminPayload = {
      fullName: setupData.fullName,
      email: setupData.email,
      role: "Super Admin",
      status: "Active",
      addedAt: serverTimestamp(),
    };

    // Background registration
    try {
      if (auth) {
        createUserWithEmailAndPassword(auth, setupData.email, setupData.password).catch(() => {});
      }
      if (db) {
        addDoc(collection(db, "admins"), adminPayload).catch(async (error) => {
          const permissionError = new FirestorePermissionError({
            path: "admins",
            operation: "create",
            requestResourceData: adminPayload,
          });
          errorEmitter.emit("permission-error", permissionError);
        });
      }
    } catch (error) {
      // Background failure
    }
  };

  if (!isAuthorized) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-50">
        <Sidebar className="border-r border-slate-100 bg-white">
          <DashboardNav />
        </Sidebar>
        <SidebarInset className="flex flex-col bg-slate-50">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white/80 px-6 backdrop-blur-md">
            <SidebarTrigger className="-ml-1 text-slate-600" />
            <div className="h-4 w-[1px] bg-slate-200" />
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clinical Administrative Interface</h2>
          </header>
          <main className="flex-1 overflow-auto p-6 lg:p-10 max-w-[1600px] mx-auto w-full">
            {children}
          </main>
        </SidebarInset>

        <Dialog open={showSetup} onOpenChange={setShowSetup}>
          <DialogContent className="sm:max-w-[425px] border-none shadow-2xl">
            <form onSubmit={handleSetup}>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold font-headline text-accent">Clinical Initialization</DialogTitle>
                <DialogDescription className="font-medium text-slate-500">
                  First-time setup active. Please register the permanent Super Admin for Callbôx Davao.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-6">
                <div className="space-y-2">
                  <Label htmlFor="setupName">Full Name</Label>
                  <Input 
                    id="setupName" 
                    placeholder="Enter full name" 
                    value={setupData.fullName}
                    onChange={(e) => setSetupData({...setupData, fullName: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="setupEmail">Work Email</Label>
                  <Input 
                    id="setupEmail" 
                    placeholder={`username@${ORG_DOMAIN}`}
                    value={setupData.email}
                    onChange={(e) => setSetupData({...setupData, email: e.target.value})}
                    required
                  />
                  {setupData.email && !setupData.email.toLowerCase().endsWith(`@${ORG_DOMAIN}`) && (
                    <p className="text-[10px] font-bold text-destructive uppercase">Requires official @{ORG_DOMAIN} address</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="setupPass">Master Password</Label>
                  <Input 
                    id="setupPass" 
                    type="password"
                    placeholder="Minimum 8 characters"
                    value={setupData.password}
                    onChange={(e) => setSetupData({...setupData, password: e.target.value})}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full h-12 bg-accent hover:bg-accent/90 text-primary font-bold uppercase tracking-wider shadow-lg">
                  Initialize Facility System
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <Toaster />
      </div>
    </SidebarProvider>
  );
}
