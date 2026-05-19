
"use client";

import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Toaster } from "@/components/ui/toaster";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const authStatus = localStorage.getItem("medtrack_admin_auth");
    const role = localStorage.getItem("medtrack_auth_role");

    if (authStatus !== "true") {
      router.push("/login");
      return;
    }

    // Role-based route protection
    if (role === "employee") {
      const restrictedPaths = ["/dashboard/insights", "/dashboard"];
      // If employee tries to access dashboard root or insights, send them to "new entry"
      if (restrictedPaths.includes(pathname) || pathname === "/dashboard") {
        router.push("/dashboard/new");
        return;
      }
    }

    setIsAuthorized(true);
  }, [router, pathname]);

  if (!isAuthorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-50/50">
        <Sidebar className="border-r shadow-sm">
          <DashboardNav />
        </Sidebar>
        <SidebarInset className="flex flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-6 backdrop-blur-md">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-[1px] bg-border" />
            <h2 className="text-sm font-semibold text-muted-foreground font-body">MedTrack Administration System</h2>
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
