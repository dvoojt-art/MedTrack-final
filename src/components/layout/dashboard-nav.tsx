"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  ClipboardList, 
  Home,
  Stethoscope,
  UserCircle,
  LayoutDashboard,
  Users,
  Lightbulb,
  PlusCircle,
  LogOut,
  ShieldCheck,
  Contact2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

const navItems = [
  {
    title: "Overview",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Medicine Logs",
    url: "/dashboard/records",
    icon: ClipboardList,
  },
  {
    title: "Employee Master List",
    url: "/dashboard/employees",
    icon: Contact2,
  },
  {
    title: "AI Insights",
    url: "/dashboard/insights",
    icon: Lightbulb,
  },
];

const managementItems = [
  {
    title: "User Management",
    url: "/dashboard/users",
    icon: Users,
    requireSuperAdmin: true,
  },
  {
    title: "Manual Issuance",
    url: "/dashboard/new",
    icon: PlusCircle,
  },
];

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("medtrack_auth_role");
    setUserRole(role);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("medtrack_admin_auth");
    localStorage.removeItem("medtrack_auth_role");
    toast({
      title: "Logged Out",
      description: "Admin session has been securely closed.",
    });
    router.push("/login");
  };

  const filteredManagementItems = managementItems.filter(item => {
    if (item.requireSuperAdmin) {
      return userRole === "Super Admin";
    }
    return true;
  });

  return (
    <>
      <SidebarHeader className="border-b px-4 py-6 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-slate-800 shadow-sm border border-primary/20">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-black leading-none text-slate-800 tracking-tight">MedTrack</h1>
            <p className="text-[9px] text-slate-500 mt-1 font-bold uppercase tracking-[0.15em] flex items-center gap-1">
              <ShieldCheck className="h-2.5 w-2.5 text-primary" /> Authorized
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-white">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 mt-4 mb-2">Core System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.url}
                    tooltip={item.title}
                    className="hover:bg-primary/5 data-[active=true]:bg-primary/10 data-[active=true]:text-slate-900 transition-all"
                  >
                    <Link href={item.url} className="flex items-center gap-3">
                      <item.icon className={cn("h-4 w-4", pathname === item.url ? "text-primary" : "text-slate-400")} />
                      <span className="font-bold text-xs uppercase tracking-wider">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 mt-6 mb-2">Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredManagementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.url}
                    tooltip={item.title}
                    className="hover:bg-primary/5 data-[active=true]:bg-primary/10 data-[active=true]:text-slate-900 transition-all"
                  >
                    <Link href={item.url} className="flex items-center gap-3">
                      <item.icon className={cn("h-4 w-4", pathname === item.url ? "text-primary" : "text-slate-400")} />
                      <span className="font-bold text-xs uppercase tracking-wider">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4 space-y-2 bg-slate-50/30">
        <div className="px-2 py-1.5 flex items-center gap-2 text-[9px] font-black uppercase text-slate-500 tracking-[0.1em] bg-white rounded-md border border-slate-100">
          <UserCircle className="h-3 w-3 text-primary" />
          <span className="truncate">{userRole || "Session Active"}</span>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="text-slate-600 hover:text-primary mb-1 font-bold text-xs">
              <Link href="/">
                <Home className="h-4 w-4" />
                <span>Exit to Portal</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout}
              className="text-destructive hover:text-destructive hover:bg-destructive/5 font-black text-xs uppercase tracking-widest"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
