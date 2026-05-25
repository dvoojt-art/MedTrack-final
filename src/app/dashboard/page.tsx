"use client";

import { supabase } from "@/lib/supabase";
import { useMemo, useEffect, useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function DashboardOverview() {
  const [records, setRecords] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);

    const loadDashboardData = async () => {
      try {
        // Issuance records
        const { data: issuances, error: issuanceError } = await supabase
          .from("issuances")
          .select("*");

        if (issuanceError) throw issuanceError;

        // Admin users
        const { data: adminsData, error: adminError } = await supabase
          .from("admins")
          .select("*");

        if (adminError) throw adminError;

        setRecords(issuances || []);
        setAdmins(adminsData || []);
      } catch (err) {
        console.error("Dashboard Load Error:", err);
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
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
        <Card className="border-none shadow-sm">
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
        <Card className="border-none shadow-sm">
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
        <Card className="border-none shadow-sm">
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
        <Card className="border-none shadow-sm">
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
        <Card className="lg:col-span-4 border-none shadow-sm">
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
                  <div key={record.id} className="flex items-center">
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

        <Card className="lg:col-span-3 border-none shadow-sm bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              Quick Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-white p-4 shadow-sm border border-primary/10">
              <h4 className="text-sm font-semibold text-accent mb-1">
                AI Recommendation
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Based on current trends, consider checking Paracetamol stock
                levels due to an increase in reports from certain departments.
              </p>
              <Button
                size="sm"
                variant="outline"
                asChild
                className="mt-3 w-full"
              >
                <Link href="/dashboard/insights">Run Full Analysis</Link>
              </Button>
            </div>

            <div className="p-4 border-l-4 border-amber-400 bg-amber-50/50 rounded-r-lg">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-bold text-amber-700">
                  Security Note
                </span>
              </div>
              <p className="text-[10px] text-amber-800/80">
                Regularly audit administrator access in the User Management
                section to maintain system integrity.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
