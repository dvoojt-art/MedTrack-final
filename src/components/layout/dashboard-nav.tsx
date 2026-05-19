
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  ClipboardList, 
  LogOut,
  Stethoscope,
  UserCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import { useEffect, useState } from "react";

const allItems = [
  {
    title: "Medicine Logs",
    url: "/dashboard/records",
    icon: ClipboardList,
    roles: ["admin"],
  },
];

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setRole(localStorage.getItem("medtrack_auth_role"));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("medtrack_admin_auth");
    localStorage.removeItem("medtrack_auth_role");
    router.push("/login");
  };

  const filteredItems = allItems.filter(item => !role || item.roles.includes(role));

  return (
    <>
      <SidebarHeader className="border-b px-4 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none text-primary">MedTrack</h1>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              Admin Panel
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.url || pathname === "/dashboard"}
                    tooltip={item.title}
                  >
                    <Link href={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <div className="mb-4 px-2 py-1.5 flex items-center gap-2 text-xs text-muted-foreground">
          <UserCircle className="h-4 w-4" />
          <span className="truncate">Admin Session</span>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="text-destructive hover:text-destructive hover:bg-destructive/10">
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
