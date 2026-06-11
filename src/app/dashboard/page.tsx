"use client";
import { supabase } from "@/lib/supabase";
import { useMemo, useEffect, useState } from "react";
import type {
  IssuanceDbRow,
  AdminDbRow,
  InventoryDbRow,
} from "@/types/issuance";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ClipboardList,
  Users,
  AlertCircle,
  TrendingUp,
  Activity,
  PlusCircle,
  Stethoscope,
  Lightbulb,
  Package2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
type Medicine = {
  id: string;
  medicine_name: string;
  current_stock: number;
  minimum_stock: number;
};

type AIInsight = {
  summary: string;
};
export default function DashboardOverview() {
  const [records, setRecords] = useState<IssuanceDbRow[]>([]);
  const [admins, setAdmins] = useState<AdminDbRow[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();
  const [criticalItems, setCriticalItems] = useState<InventoryDbRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState("");
  const [medicines, setMedicines] = useState<InventoryDbRow[]>([]);
  useEffect(() => {
    setIsMounted(true);

    const loadDashboardData = async () => {
      try {
        setLoading(true);

        // Issuance records
        const { data: issuancesData, error: issuanceError } = await supabase
          .from("issuances")
          .select("*");

        if (issuanceError) throw issuanceError;

        // Admin users
        const { data: adminsData, error: adminError } = await supabase
          .from("admins")
          .select("*");

        if (adminError) throw adminError;

        // Medicines inventory
        const { data: medicinesData, error: medicinesError } = await supabase
          .from("medicines")
          .select("*");

        if (medicinesError) throw medicinesError;

        const issuances = (issuancesData || []) as IssuanceDbRow[];
        const admins = (adminsData || []) as AdminDbRow[];
        const medicines = (medicinesData || []) as InventoryDbRow[];

        // Detect critical stock
        const lowStocks = medicines.filter(
          (item) => item.current_stock <= item.minimum_stock,
        );

        // Load AI summary
        const savedInsights = localStorage.getItem("ai_inventory_insights");

        let parsedInsights = null;

        if (savedInsights) {
          parsedInsights = JSON.parse(savedInsights);
        }

        // Set states
        setRecords(issuances);
        setAdmins(admins);
        setMedicines(medicines);
        setCriticalItems(lowStocks);
        setAiSummary(parsedInsights?.summary || "");
      } catch (err) {
        console.error("Dashboard Load Error:", err);

        toast({
          title: "Dashboard Error",
          description: "Failed to load dashboard data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const stats = useMemo(() => {
    if (!isMounted)
      return {
        total: 0,
        today: 0,
        medicines: 0,
      };

    const today = new Date().toISOString().split("T")[0];

    const todayRecords = records.filter(
      (r) => r.date === today || r.created_at?.startsWith(today),
    );

    return {
      total: records.length,

      today: todayRecords.length,

      medicines: records.reduce(
        (acc, curr) => acc + (curr.medicine_taken?.length || 0),
        0,
      ),
    };
  }, [records, isMounted]);

  const recentRecords = useMemo(() => {
    return [...records]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .slice(0, 5);
  }, [records]);

  if (!isMounted) return null;

  return (
    <div className="space-y-8 animate-[pageEnter_.4s_cubic-bezier(0.22,1,0.36,1)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-[fadeInUp_.4s_ease-out]">
        <div className="mb-8 animate-in fade-in slide-in-from-left-8 duration-700">
          <h1 className="text-3xl font-bold font-headline tracking-tight text-accent">
            System Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time clinical metrics and system overview.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            asChild
            className="gap-2 bg-primary text-accent hover:bg-primary/90"
          >
            <Link href="/dashboard/new">
              <PlusCircle className="h-4 w-4" /> New Record
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl animate-[fadeInUp_.4s_ease-out]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Issuances
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime records captured
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl animate-[fadeInUp_.6s_ease-out]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recorded Today
            </CardTitle>
            <Activity className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
            <p className="text-xs text-muted-foreground">
              Entries made in the last 24h
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl animate-[fadeInUp_.8s_ease-out]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Medicines Distributed
            </CardTitle>
            <Stethoscope className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.medicines}</div>
            <p className="text-xs text-muted-foreground">
              Individual units issued
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl animate-[fadeInUp_1s_ease-out]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Admins</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{admins.length || 1}</div>
            <p className="text-xs text-muted-foreground">
              Authorized portal users
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none shadow-sm transition-all duration-300 hover:shadow-xl animate-[fadeInUp_.7s_ease-out]">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest medicine issuance logs from the portal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {recentRecords.length > 0 ? (
                recentRecords.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center rounded-xl p-2 transition-all duration-300 hover:bg-slate-50 hover:translate-x-1"
                  >
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none text-accent">
                        {record.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {record.department}
                      </p>
                    </div>
                    <div className="ml-auto font-medium text-xs">
                      <Badge variant="outline">{record.time}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  <p>No recent activity found.</p>
                </div>
              )}
            </div>
            {recentRecords.length > 0 && (
              <Button variant="link" asChild className="mt-4 p-0">
                <Link href="/dashboard/records">View all logs</Link>
              </Button>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-3 border-0 bg-background/80 backdrop-blur-sm shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl animate-[fadeInUp_.9s_ease-out]">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <TrendingUp className="h-5 w-5 text-primary" />
              Critical Stock Status
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Loading */}
            {loading && (
              <div className="rounded-2xl border p-6 animate-pulse">
                <div className="h-5 w-40 bg-muted rounded mb-3" />
                <div className="h-4 w-full bg-muted rounded" />
              </div>
            )}

            {/* Healthy */}
            {!loading && criticalItems.length === 0 && (
              <div className="rounded-2xl border border-emerald-200 bg-linear-to-br from-emerald-50 to-white p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                    <Package2 className="h-7 w-7 text-emerald-600" />
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground">
                      Stock Healthy
                    </h4>

                    <p className="text-sm text-muted-foreground mt-1">
                      All medicines are currently above minimum stock levels.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Critical Stocks */}
            {!loading && criticalItems.length > 0 && (
              <div className="rounded-2xl border border-red-200 bg-linear-to-br from-red-50 to-white p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                    <AlertTriangle className="h-7 w-7 text-red-600" />
                  </div>

                  <div className="flex-1">
                    <h4 className="font-semibold text-red-700">
                      {criticalItems.length} Critical Medicine
                      {criticalItems.length > 1 ? "s" : ""}
                    </h4>

                    <p className="text-sm text-muted-foreground mt-1">
                      Some medicines are below their minimum stock threshold.
                    </p>

                    <div className="mt-4 space-y-2">
                      {criticalItems.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-xl border bg-white px-3 py-2 transition-all duration-300 hover:border-red-300 hover:shadow-md hover:-translate-y-0.5"
                        >
                          <span className="font-medium text-sm">
                            {item.medicine_name}
                          </span>

                          <span className="text-xs font-bold text-red-600">
                            {item.current_stock} left
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AI Prediction */}
            <div className="rounded-2xl border border-primary/20 bg-linear-to-br from-primary/5 to-background p-5 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Lightbulb className="h-5 w-5 text-primary" />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                    AI Prediction
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {aiSummary ||
                  "Generate AI insights to view predictive inventory recommendations and future medicine demand trends."}
              </p>

              <Button
                asChild
                className="gap-2 bg-primary text-accent hover:bg-primary/90 transition-all duration-300 hover:scale-[1.03]"
              >
                <Link href="/dashboard/insights">Analyze Trends →</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
