
"use client";

import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    // Check for demo authentication
    const isAuth = localStorage.getItem("medtrack_admin_auth") === "true";
    const userRole = localStorage.getItem("medtrack_auth_role");

    if (!isAuth) {
      router.push("/login");
      return;
    }

    // Protect User Management route
    if (pathname === "/dashboard/users" && userRole !== "Super Admin") {
      toast({
        title: "Access Denied",
        description: "You do not have the required permissions to access User Management.",
        variant: "destructive",
      });
      router.push("/dashboard");
      return;
    }

    setIsAuthorized(true);
  }, [router, pathname, toast]);

  if (!isAuthorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-slate-700" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-700 animate-pulse">Verifying Security Credentials...</p>
        </div>
      </div>
    );
  }

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
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clinical Administration System</h2>
          </header>
          <main className="flex-1 overflow-auto p-6 lg:p-10 max-w-[1600px] mx-auto w-full">
            {children}
          </main>
        </SidebarInset>
        <Toaster />
      </div>
    </SidebarProvider>
  );
}
