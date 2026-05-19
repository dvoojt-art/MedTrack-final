"use client";

import { useEffect, useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Download, Search, Filter } from "lucide-react";
import { INITIAL_RECORDS } from "@/lib/mock-data";

export default function RecordsPage() {
  const [records, setRecords] = useState(INITIAL_RECORDS);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRecords = records.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.medicineTaken.some(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Date,Time,Name,Age,Gender,Department,Chief Complaints,Medicine\n" +
      records.map(r => `${r.date},${r.time},${r.name},${r.age},${r.gender},${r.department},"${r.chiefComplaints}","${r.medicineTaken.map(m => m.name).join('; ')}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "medtrack_export.csv");
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight text-primary">Medicine Issuance Logs</h1>
          <p className="text-muted-foreground mt-1">Monitor and manage all historical medicine distribution events.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportData} className="gap-2">
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
                placeholder="Search by patient, department or medicine..."
                className="pl-8 h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2 h-10">
              <Filter className="h-4 w-4" /> Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[100px] font-bold text-primary">Date</TableHead>
                  <TableHead className="w-[80px] font-bold text-primary">Time</TableHead>
                  <TableHead className="font-bold text-primary">Patient Name</TableHead>
                  <TableHead className="w-[60px] font-bold text-primary text-center">Age</TableHead>
                  <TableHead className="w-[80px] font-bold text-primary">Gender</TableHead>
                  <TableHead className="font-bold text-primary">Department</TableHead>
                  <TableHead className="max-w-[200px] font-bold text-primary">Chief Complaints</TableHead>
                  <TableHead className="font-bold text-primary">Medicines Issued</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record, index) => (
                    <TableRow 
                      key={index} 
                      className="hover:bg-primary/5 transition-colors cursor-default"
                    >
                      <TableCell className="font-medium whitespace-nowrap">{record.date}</TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">{record.time}</TableCell>
                      <TableCell className="font-semibold text-primary">{record.name}</TableCell>
                      <TableCell className="text-center">{record.age}</TableCell>
                      <TableCell>{record.gender}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal bg-slate-100">
                          {record.department}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs italic text-muted-foreground" title={record.chiefComplaints}>
                        {record.chiefComplaints}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {record.medicineTaken.map((m, i) => (
                            <span key={i} className="inline-flex items-center rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-100">
                              {m.name} ({m.quantity})
                            </span>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-48 text-center text-muted-foreground">
                      No records found matching your search.
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
