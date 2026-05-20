
"use client";

import { useState, useMemo } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Download, Search, Filter } from "lucide-react";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";

export default function RecordsPage() {
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");

  const issuancesQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "issuances"), orderBy("createdAt", "desc"));
  }, [db]);

  const { data: records, loading } = useCollection(issuancesQuery);

  const filteredRecords = useMemo(() => {
    if (!records) return [];
    return records.filter(r => 
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.chiefComplaints && r.chiefComplaints.toLowerCase().includes(searchTerm.toLowerCase())) ||
      r.medicineTaken?.some((m: any) => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [records, searchTerm]);

  const exportData = () => {
    if (!records || records.length === 0) return;
    
    const headers = ["Date", "Time", "Patient Name", "Email", "Age", "Gender", "Department", "Chief Complaints", "Medicines Issued"];
    const rows = records.map(r => [
      r.date,
      r.time,
      `"${r.name.replace(/"/g, '""')}"`,
      `"${(r.email || "").replace(/"/g, '""')}"`,
      r.age,
      r.gender,
      `"${r.department.replace(/"/g, '""')}"`,
      `"${(r.chiefComplaints || "").replace(/"/g, '""')}"`,
      `"${r.medicineTaken?.map((m: any) => `${m.name} (${m.quantity})`).join('; ')}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `medtrack_records_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight text-accent">Medicine Issuance Logs</h1>
          <p className="text-muted-foreground mt-1 text-slate-500 font-medium">Real-time distribution records.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportData} disabled={loading || !records?.length} className="gap-2 border-slate-200">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-white border-b space-y-4 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by patient, email, medicine or symptoms..."
                className="pl-8 h-10 border-slate-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2 h-10 border-slate-200">
              <Filter className="h-4 w-4" /> Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[100px] font-bold text-slate-600 uppercase text-[10px] tracking-wider">Date</TableHead>
                  <TableHead className="w-[80px] font-bold text-slate-600 uppercase text-[10px] tracking-wider">Time</TableHead>
                  <TableHead className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">Patient Name</TableHead>
                  <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">Email</TableHead>
                  <TableHead className="w-[60px] font-bold text-slate-600 uppercase text-[10px] tracking-wider text-center">Age</TableHead>
                  <TableHead className="w-[80px] font-bold text-slate-600 uppercase text-[10px] tracking-wider">Gender</TableHead>
                  <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">Department</TableHead>
                  <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">Chief Complaints</TableHead>
                  <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">Medicines</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record, index) => (
                    <TableRow 
                      key={record.id || index} 
                      className="hover:bg-primary/5 transition-colors cursor-default border-slate-100"
                    >
                      <TableCell className="font-medium whitespace-nowrap text-slate-500 text-xs">{record.date}</TableCell>
                      <TableCell className="text-slate-400 whitespace-nowrap text-xs">{record.time}</TableCell>
                      <TableCell className="font-bold text-slate-700">{record.name}</TableCell>
                      <TableCell className="text-xs text-slate-500 font-medium">{record.email}</TableCell>
                      <TableCell className="text-center text-slate-600">{record.age}</TableCell>
                      <TableCell className="text-slate-500 text-xs">{record.gender}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-bold text-[10px] uppercase bg-slate-100 text-slate-600 border-none">
                          {record.department}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="text-xs text-slate-500 line-clamp-2 italic" title={record.chiefComplaints}>
                          {record.chiefComplaints}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {record.medicineTaken?.map((m: any, i: number) => (
                            <span key={i} className="inline-flex items-center rounded-sm bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-primary/20">
                              {m.name} ({m.quantity})
                            </span>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-48 text-center text-slate-400 font-medium italic">
                      {loading ? "" : searchTerm ? "No records found matching your search." : "No issuance records logged yet."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
