"use client";

import { supabase } from "@/lib/supabase";
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
  Contact2,
  Settings,
  Activity,
  Package2,
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
  useSidebar,
} from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

const mainItems = [
  {
    title: "Overview",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
];

const clinicalItems = [
  {
    title: "Medicine Logs",
    url: "/dashboard/records",
    icon: ClipboardList,
  },
  {
    title: "Manual Issuance",
    url: "/dashboard/new",
    icon: PlusCircle,
  },
];

const directoryItems = [
  {
    title: "Employee Master List",
    url: "/dashboard/employees",
    icon: Contact2,
  },
  {
    title: "Inventory Management",
    url: "/dashboard/inventory",
    icon: Package2,
  },
];

const adminItems = [
  {
    title: "User Management",
    url: "/dashboard/users",
    icon: Users,
    requireSuperAdmin: true,
  },
  {
    title: "AI Insights",
    url: "/dashboard/insights",
    icon: Lightbulb,
  },
];

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { setOpenMobile, isMobile } = useSidebar();
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [clickedItem, setClickedItem] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("medtrack_auth_role");
    setUserRole(role);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();

    localStorage.removeItem("medtrack_admin_auth");
    localStorage.removeItem("medtrack_auth_role");
    localStorage.removeItem("medtrack_user_id");

    toast({
      title: "Logged Out",
      description: "Admin session has been securely closed.",
    });

    router.replace("/login");
  };

  const handleNavigation = () => {
    if (isMobile) {
      setTimeout(() => {
        setOpenMobile(false);
      }, 100);
    }
  };

  const filteredAdminItems = adminItems.filter((item) => {
    if (item.requireSuperAdmin) {
      return userRole === "Super Admin";
    }
    return true;
  });

  return (
    <>
      <SidebarHeader className="border-b bg-background/95 px-4 py-5 backdrop-blur supports-backdrop-filter:bg-background/60`">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/10">
            <Stethoscope className="size-5" />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-black tracking-tight text-foreground">
              MedTrack
            </h1>

            <p className="mt-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              <ShieldCheck className="size-3 text-primary" />
              Clinical Admin
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-background px-2 py-3">
        <SidebarGroup>
          <SidebarMenu>
            {mainItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.url}
                  className="
                  h-11 rounded-xl
                  transition-all duration-200
                  hover:bg-primary/5
                  hover:text-foreground
                  data-[active=true]:bg-primary/10
                  data-[active=true]:text-primary
                  data-[active=true]:shadow-sm
                "
                >
                  <Link
                    href={item.url}
                    className="flex items-center gap-3 "
                    onClick={handleNavigation}
                  >
                    <item.icon
                      className={cn(
                        "size-4 transition-colors",
                        pathname === item.url
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    />

                    <span className="text-xs font-bold uppercase tracking-wider">
                      {item.title}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 pb-2 pt-4 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">
            Clinical Records
          </SidebarGroupLabel>

          <SidebarMenu>
            {clinicalItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.url}
                  className="
                  h-11 rounded-xl
                  transition-all duration-200
                  hover:bg-primary/5
                  data-[active=true]:bg-primary/10
                  data-[active=true]:text-primary
                "
                >
                  <Link
                    href={item.url}
                    className="flex items-center gap-3"
                    onClick={handleNavigation}
                  >
                    <item.icon
                      className={cn(
                        "size-4",
                        pathname === item.url
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    />

                    <span className="text-xs font-bold uppercase tracking-wider">
                      {item.title}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 pb-2 pt-4 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">
            Directories
          </SidebarGroupLabel>

          <SidebarMenu>
            {directoryItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.url}
                  className="
                  h-11 rounded-xl
                  transition-all duration-200
                  hover:bg-primary/5
                  data-[active=true]:bg-primary/10
                  data-[active=true]:text-primary
                "
                >
                  <Link
                    href={item.url}
                    className="flex items-center gap-3"
                    onClick={handleNavigation}
                  >
                    <item.icon
                      className={cn(
                        "size-4",
                        pathname === item.url
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    />

                    <span className="text-xs font-bold uppercase tracking-wider">
                      {item.title}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 pb-2 pt-4 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">
            System Admin
          </SidebarGroupLabel>

          <SidebarMenu>
            {filteredAdminItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.url}
                  className="
                  h-11 rounded-xl
                  transition-all duration-200
                  hover:bg-primary/5
                  data-[active=true]:bg-primary/10
                  data-[active=true]:text-primary
                "
                >
                  <Link
                    href={item.url}
                    className="flex items-center gap-3"
                    onClick={handleNavigation}
                  >
                    <item.icon
                      className={cn(
                        "size-4",
                        pathname === item.url
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    />

                    <span className="text-xs font-bold uppercase tracking-wider">
                      {item.title}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t bg-background p-4">
        <div className="mb-3 rounded-xl border bg-muted/30 px-3 py-2">
          <div className="flex items-center gap-2">
            <UserCircle className="size-4 text-primary" />

            <div className="min-w-0">
              <p className="truncate text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                Active Session
              </p>

              <p className="truncate text-xs font-semibold">{userRole}</p>
            </div>
          </div>
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="
              h-10 rounded-xl
              font-semibold
              transition-colors
              hover:bg-primary/5
              hover:text-primary
            "
            >
              <Link href="/">
                <Home className="size-4" />
                <span>Exit to Portal</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="
      h-10 rounded-xl
      cursor-pointer
      border border-red-200
      bg-red-50
      text-red-600
      font-semibold
      transition-all duration-300
      hover:bg-red-600
      hover:text-white
      hover:border-red-600
      hover:shadow-lg
      hover:-translate-y-0.5
      active:translate-y-0
    "
            >
              <LogOut className="size-4 transition-transform group-hover:rotate-12" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
