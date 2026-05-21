
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
import { Download, Search, Filter, FileText, FileSpreadsheet, File } from "lucide-react";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Document, Packer, Paragraph, Table as DocxTable, TableCell as DocxTableCell, TableRow as DocxTableRow, WidthType, AlignmentType, HeadingLevel } from "docx";
import { saveAs } from "file-saver";

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

  const exportAsCSV = () => {
    if (!filteredRecords || filteredRecords.length === 0) return;
    
    const headers = ["Date", "Time", "Patient Name", "Email", "Age", "Gender", "Department", "Chief Complaints", "Medicines Issued"];
    const rows = filteredRecords.map(r => [
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

  const exportAsPDF = () => {
    if (!filteredRecords || filteredRecords.length === 0) return;

    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFontSize(18);
    doc.text("MedTrack Medicine Issuance Report", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const tableHeaders = [["Date", "Time", "Patient Name", "Email", "Dept", "Medicines"]];
    const tableData = filteredRecords.map(r => [
      r.date,
      r.time,
      r.name,
      r.email || "N/A",
      r.department,
      r.medicineTaken?.map((m: any) => `${m.name} (${m.quantity})`).join(', ')
    ]);

    autoTable(doc, {
      head: tableHeaders,
      body: tableData,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [51, 65, 85], textColor: [255, 202, 9] },
      styles: { fontSize: 8 },
    });

    doc.save(`medtrack_records_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportAsDOCX = async () => {
    if (!filteredRecords || filteredRecords.length === 0) return;

    const tableRows = filteredRecords.map(r => 
      new DocxTableRow({
        children: [
          new DocxTableCell({ children: [new Paragraph(r.date || "")] }),
          new DocxTableCell({ children: [new Paragraph(r.name || "")] }),
          new DocxTableCell({ children: [new Paragraph(r.department || "")] }),
          new DocxTableCell({ children: [new Paragraph(r.medicineTaken?.map((m: any) => `${m.name}(${m.quantity})`).join(', ') || "")] }),
        ],
      })
    );

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: "MedTrack Clinical Issuance Record",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `Generated on: ${new Date().toLocaleString()}`,
            alignment: AlignmentType.RIGHT,
          }),
          new Paragraph({ text: "" }),
          new DocxTable({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new DocxTableRow({
                children: [
                  new DocxTableCell({ children: [new Paragraph({ text: "Date", style: "bold" })] }),
                  new DocxTableCell({ children: [new Paragraph({ text: "Patient", style: "bold" })] }),
                  new DocxTableCell({ children: [new Paragraph({ text: "Department", style: "bold" })] }),
                  new DocxTableCell({ children: [new Paragraph({ text: "Medicines", style: "bold" })] }),
                ],
              }),
              ...tableRows,
            ],
          }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `medtrack_records_${new Date().toISOString().split('T')[0]}.docx`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight text-accent uppercase">Medicine Issuance Logs</h1>
          <p className="text-muted-foreground mt-1 text-slate-500 font-medium">Real-time distribution records.</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={loading || !filteredRecords?.length} className="gap-2 border-slate-200">
                <Download className="h-4 w-4" /> Export Report
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={exportAsPDF} className="gap-2 cursor-pointer">
                <FileText className="h-4 w-4 text-red-500" /> Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportAsDOCX} className="gap-2 cursor-pointer">
                <File className="h-4 w-4 text-blue-500" /> Export as DOCX
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportAsCSV} className="gap-2 cursor-pointer">
                <FileSpreadsheet className="h-4 w-4 text-emerald-500" /> Export as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                      {loading ? (
                        "Loading records..."
                      ) : searchTerm ? "No records found matching your search." : "No issuance records logged yet."}
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
