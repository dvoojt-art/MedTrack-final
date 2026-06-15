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
  Info,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { differenceInDays } from "date-fns";
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
  const [lowStockItems, setLowStockItems] = useState<InventoryDbRow[]>([]);
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
        const criticalStocks = medicines.filter(
          (item) => item.current_stock <= item.minimum_stock,
        );

        // Detect low stock (e.g., within 50% of minimum)
        const lowStocks = medicines.filter(
          (item) =>
            item.current_stock > item.minimum_stock &&
            item.current_stock <= item.minimum_stock * 1.5,
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
        setCriticalItems(criticalStocks);
        setLowStockItems(lowStocks);
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

  const lowStockItemsWithSupply = useMemo(() => {
    if (lowStockItems.length === 0 || records.length === 0) {
      return lowStockItems.map((item) => ({ ...item, daysLeft: null }));
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRecords = records.filter(
      (record) => new Date(record.created_at) >= thirtyDaysAgo,
    );

    if (recentRecords.length === 0) {
      return lowStockItems.map((item) => ({ ...item, daysLeft: null }));
    }

    const earliestRecordDate = recentRecords.reduce((earliest, record) => {
      const recordDate = new Date(record.created_at);
      return recordDate < earliest ? recordDate : earliest;
    }, new Date());

    const daysInPeriod = Math.max(1, differenceInDays(new Date(), earliestRecordDate));

    return lowStockItems.map((item) => {
      const totalIssued = recentRecords.reduce((sum, record) => {
        const med = record.medicine_taken?.find(
          (m) => m.medicine_name === item.medicine_name,
        );
        return sum + (med ? med.quantity : 0);
      }, 0);

      if (totalIssued === 0) {
        return { ...item, daysLeft: null }; // No recent usage
      }

      const averageDailyUsage = totalIssued / daysInPeriod;
      const daysLeft = Math.floor(item.current_stock / averageDailyUsage);
      return { ...item, daysLeft };
    });
  }, [lowStockItems, records]);
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

  const groupedRecentRecords = useMemo(() => {
    const sortedRecords = [...records].sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime(),
    ).slice(0, 4); // Show only the 3 most recent records
    
    const groups = sortedRecords.reduce(
      (acc, record) => {
        const recordDate = new Date(record.created_at);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let dateKey = recordDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        if (recordDate.toDateString() === today.toDateString()) {
          dateKey = "Today";
        } else if (recordDate.toDateString() === yesterday.toDateString()) {
          dateKey = "Yesterday";
        }

        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(record);
        return acc;
      },
      {} as Record<string, IssuanceDbRow[]>,
    );
    return groups;
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
            <div className="space-y-6">
              {Object.keys(groupedRecentRecords).length > 0 ? (
                Object.entries(groupedRecentRecords).map(([date, dayRecords]) => (
                  <div key={date}>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3 sticky top-0 bg-background/80 backdrop-blur-sm py-2">
                      {date}
                    </h4>
                    <div className="space-y-4">
                      {dayRecords.map((record) => {
                        const isNew =
                          new Date().getTime() -
                            new Date(record.created_at).getTime() <
                          10 * 60 * 1000; // 10 minutes

                        return (
                          <div
                            key={record.id}
                            className="flex items-start gap-4 rounded-lg border p-3 transition-all hover:bg-muted/50"
                          >
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium leading-none text-accent flex items-center gap-2">
                                  {record.name}
                                  {isNew && (
                                    <Badge className="animate-pulse bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-[9px] h-4 px-2">
                                      Just In
                                    </Badge>
                                  )}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  {record.time}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                {record.department}
                                <Building2 className="h-3 w-3" />
                              </p>
                              <div className="pt-2 text-xs text-muted-foreground">
                                {record.medicine_taken?.map((med) => (
                                  <div key={med.medicine_name} className="flex justify-between items-center">
                                    <span>- {med.medicine_name}</span>
                                    <span className="font-mono text-accent">{med.quantity} pcs</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
            {records.length > 0 && (
              <Button variant="link" asChild className="mt-4 p-0 text-primary">
                <Link href="/dashboard/audit-logs">View Audit Logs →</Link>
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
            {!loading && criticalItems.length === 0 && lowStockItems.length === 0 && (
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

            {/* Low Stocks */}
            {!loading && lowStockItemsWithSupply.length > 0 && (
              <div className="rounded-2xl border border-amber-300 bg-linear-to-br from-amber-50 to-white p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
                    <Info className="h-7 w-7 text-amber-600" />
                  </div>

                  <div className="flex-1">
                    <h4 className="font-semibold text-amber-700">
                      {lowStockItemsWithSupply.length} Low Stock Item
                      {lowStockItemsWithSupply.length > 1 ? "s" : ""}
                    </h4>

                    <p className="text-sm text-muted-foreground mt-1">
                      These items are approaching their minimum stock level.
                    </p>

                    <div className="mt-4 space-y-2">
                      {lowStockItemsWithSupply.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-xl border bg-white px-3 py-2 transition-all duration-300 hover:border-amber-300 hover:shadow-md hover:-translate-y-0.5"
                        >
                          <div>
                            <span className="font-medium text-sm">
                              {item.medicine_name}
                            </span>
                            {item.daysLeft !== null && (
                              <p className="text-xs text-muted-foreground">
                                ~{item.daysLeft} day
                                {item.daysLeft !== 1 ? "s" : ""} of supply left
                              </p>
                            )}
                          </div>

                          <span className="text-sm font-bold text-amber-600 shrink-0 pl-2">
                            {item.current_stock}{" "}
                            <span className="text-xs font-normal text-muted-foreground">
                              left
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
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