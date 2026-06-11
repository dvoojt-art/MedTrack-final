"use client";

import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Loader2, Lock, Eye, EyeOff } from "lucide-react";

const ORG_DOMAIN = "callboxinc.com";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const [setupData, setSetupData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const checkAccess = async () => {
      try {
        // Check if system is initialized
        const { count, error: countError } = await supabase
          .from("admins")
          .select("user_id", {
            count: "exact",
            head: true,
          });

        if (countError) {
          console.error("COUNT ERROR:", countError);

          toast({
            title: "Database Error",
            description: "Could not verify system status.",
            variant: "destructive",
          });

          setIsLoading(false);
          return;
        }

        const needsSetup = count === 0;
        setShowSetup(needsSetup);
        // First-time setup only
        if (needsSetup) {
          setIsAuthorized(true);
          setIsLoading(false);
          return;
        }

        // Current session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError) {
          console.error("SESSION ERROR:", sessionError);
        }

        // Not logged in
        if (!session) {
          setIsAuthorized(false);
          setIsLoading(false);

          router.replace("/login");
          return;
        }

        // Verify user exists in admins table
        const { data: adminUser, error: adminError } = await supabase
          .from("admins")
          .select("*")
          .eq("user_id", session.user.id)
          .single();

        if (adminError || !adminUser) {
          await supabase.auth.signOut();

          setIsAuthorized(false);
          setIsLoading(false);

          toast({
            title: "Access Denied",
            description:
              "Your account is not registered as a system administrator.",
            variant: "destructive",
          });

          router.replace("/login");
          return;
        }

        // Account disabled
        // Account disabled (except Super Admin)
        if (adminUser.status !== "Active" && adminUser.role !== "Super Admin") {
          await supabase.auth.signOut();

          setIsAuthorized(false);
          setIsLoading(false);

          toast({
            title: "Account Disabled",
            description:
              "Your account has been deactivated. Contact the Super Admin.",
            variant: "destructive",
          });

          router.replace("/login");
          return;
        }

        const role = adminUser.role;
        // Super Admin only page
        if (pathname.startsWith("/dashboard/users") && role !== "Super Admin") {
          toast({
            title: "Access Denied",
            description: "Only Super Admins can access User Management.",
            variant: "destructive",
          });

          router.replace("/dashboard");
          return;
        }

        setIsAuthorized(true);
        setIsLoading(false);
      } catch (error) {
        console.error("AUTH ERROR:", error);

        toast({
          title: "Authentication Error",
          description: "Unable to verify your session.",
          variant: "destructive",
        });

        setIsAuthorized(false);
        setIsLoading(false);

        router.replace("/login");
      }
    };

    checkAccess();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!showSetup && !session) {
        setIsAuthorized(false);
        router.replace("/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isMounted, pathname, router, toast, showSetup]);

  const handleInitialize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupData.email.toLowerCase().endsWith(`@${ORG_DOMAIN}`)) {
      toast({
        title: "Invalid Domain",
        description: `Setup requires an official @${ORG_DOMAIN} account.`,
        variant: "destructive",
      });
      return;
    }

    setIsInitializing(true);

    try {
      // 1. Create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: setupData.email,
        password: setupData.password,
        options: {
          data: {
            full_name: setupData.fullName,
            role: "Super Admin",
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("User creation failed.");

      // 2. Insert the user into the public 'admins' table
      const { error: insertError } = await supabase.from("admins").insert({
        user_id: authData.user.id,
        full_name: setupData.fullName,
        email: setupData.email.toLowerCase(),
        role: "Super Admin",
        status: "Active",
        is_protected: true, // <-- add this
      });

      if (insertError) throw insertError;

      toast({
        title: "System Initialized",
        description: "Super Admin privileges granted. You are now logged in.",
      });
      setShowSetup(false);
      setIsAuthorized(true);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Initialization Error",
        description: message || "Failed to set up the first admin.",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  if (isLoading) {
    return null; // Or a loading spinner component
  }

  if (showSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <Dialog open={true}>
          <DialogContent className="sm:max-w-106.25">
            <form onSubmit={handleInitialize}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-headline uppercase text-accent tracking-tighter">
                  <ShieldAlert className="h-5 w-5 text-primary" /> Facility
                  Initialization
                </DialogTitle>
                <DialogDescription>
                  First-time use detected. Please register the first Super
                  Admin.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">
                    Full Name
                  </Label>
                  <Input
                    placeholder="e.g. System Administrator"
                    value={setupData.fullName}
                    onChange={(e) =>
                      setSetupData({ ...setupData, fullName: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">
                    Work Email (@{ORG_DOMAIN})
                  </Label>
                  <Input
                    type="email"
                    placeholder={`admin@${ORG_DOMAIN}`}
                    value={setupData.email}
                    onChange={(e) =>
                      setSetupData({ ...setupData, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">
                    System Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      type={showPass ? "text" : "password"}
                      className="pl-9 pr-10"
                      value={setupData.password}
                      onChange={(e) =>
                        setSetupData({ ...setupData, password: e.target.value })
                      }
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-2.5"
                      onClick={() => setShowPass(!showPass)}
                    >
                      {showPass ? (
                        <EyeOff className="h-4 w-4 text-slate-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  className="w-full bg-accent text-primary font-black uppercase tracking-widest"
                  disabled={isInitializing}
                >
                  {isInitializing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Initialize Facility"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (!isAuthorized) return null; // Or a loading/unauthorized component

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-50">
        <Sidebar className="border-r border-slate-100 bg-white">
          <DashboardNav />
        </Sidebar>
        <SidebarInset className="flex flex-col bg-slate-50">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white/80 px-6 backdrop-blur-md">
            <SidebarTrigger className="-ml-1 text-slate-600" />
            <div className="h-4 w-px bg-slate-200" />
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Clinical Administrative Interface
            </h2>
          </header>
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              ease: "easeOut",
            }}
            className="flex-1 overflow-auto p-6 lg:p-10 max-w-400 mx-auto w-full"
          >
            {children}
          </motion.main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
