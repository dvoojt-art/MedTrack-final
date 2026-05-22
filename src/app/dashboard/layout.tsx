
"use client";

import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Loader2, Lock, Eye, EyeOff } from "lucide-react";

const ORG_DOMAIN = "callboxinc.com";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const [setupData, setSetupData] = useState({
    fullName: "",
    email: "",
    password: ""
  });

  useEffect(() => {
    // Check if session exists
    const isAuth = localStorage.getItem("medtrack_admin_auth") === "true";
    const userRole = localStorage.getItem("medtrack_auth_role");
    
    // Check if system is empty
    const existingAdmins = JSON.parse(localStorage.getItem("medtrack_admins") || "[]");
    
    if (existingAdmins.length === 0) {
      setShowSetup(true);
      return;
    }

    if (!isAuth) {
      router.push("/login");
      return;
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

  const handleInitialize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupData.email.toLowerCase().endsWith(`@${ORG_DOMAIN}`)) {
      toast({
        title: "Invalid Domain",
        description: `Setup requires an official @${ORG_DOMAIN} account.`,
        variant: "destructive"
      });
      return;
    }

    setIsInitializing(true);
    
    const firstAdmin = {
      id: "root-admin",
      ...setupData,
      role: "Super Admin",
      status: "Active",
      addedAt: new Date().toISOString()
    };

    localStorage.setItem("medtrack_admins", JSON.stringify([firstAdmin]));
    localStorage.setItem("medtrack_admin_auth", "true");
    localStorage.setItem("medtrack_auth_role", "Super Admin");
    
    setTimeout(() => {
      setIsInitializing(false);
      setShowSetup(false);
      setIsAuthorized(true);
      toast({
        title: "System Initialized",
        description: "Super Admin privileges granted.",
      });
    }, 800);
  };

  if (showSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <Dialog open={true}>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleInitialize}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-headline uppercase text-accent tracking-tighter">
                  <ShieldAlert className="h-5 w-5 text-primary" /> Facility Initialization
                </DialogTitle>
                <DialogDescription>
                  First-time use detected. Please register the first Super Admin.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Full Name</Label>
                  <Input 
                    placeholder="e.g. System Administrator" 
                    value={setupData.fullName}
                    onChange={(e) => setSetupData({...setupData, fullName: e.target.value})}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Work Email (@{ORG_DOMAIN})</Label>
                  <Input 
                    type="email" 
                    placeholder={`admin@${ORG_DOMAIN}`} 
                    value={setupData.email}
                    onChange={(e) => setSetupData({...setupData, email: e.target.value})}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">System Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input 
                      type={showPass ? "text" : "password"} 
                      className="pl-9 pr-10"
                      value={setupData.password}
                      onChange={(e) => setSetupData({...setupData, password: e.target.value})}
                      required 
                    />
                    <button type="button" className="absolute right-3 top-2.5" onClick={() => setShowPass(!showPass)}>
                      {showPass ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-slate-400" />}
                    </button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full bg-accent text-primary font-black uppercase tracking-widest" disabled={isInitializing}>
                  {isInitializing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Initialize Facility"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

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
      </div>
    </SidebarProvider>
  );
}
