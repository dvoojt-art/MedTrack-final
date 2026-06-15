"use client";

import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import type { IssuanceDbRow } from "@/types/issuance";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileClock } from "lucide-react";
import { format } from "date-fns";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<IssuanceDbRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("issuances")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setLogs(data || []);
      } catch (error) {
        console.error("Error fetching audit logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight text-accent">
            Audit Logs
          </h1>
          <p className="text-muted-foreground mt-1">
            A chronological record of all medicine issuances.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Issuance History</CardTitle>
          <CardDescription>
            Showing all {logs.length} records from the database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[60vh]">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Medicines Issued</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Loading logs...
                    </TableCell>
                  </TableRow>
                ) : logs.length > 0 ? (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        {format(new Date(log.created_at), "PPpp")}
                      </TableCell>
                      <TableCell>{log.name}</TableCell>
                      <TableCell>{log.department}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {log.medicine_taken?.map((med) => (
                            <Badge key={med.medicine_name} variant="secondary">
                              {med.medicine_name} ({med.quantity})
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No audit logs found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}