"use client";

import { supabase } from "@/lib/supabase";
import { useState, useMemo, useEffect } from "react";
import type { IssuanceRecord, MedicineItem } from "@/types/issuance";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Download,
  Search,
  FileText,
  FileSpreadsheet,
  File,
  Trash2,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Document,
  Packer,
  Paragraph,
  Table as DocxTable,
  TableCell as DocxTableCell,
  TableRow as DocxTableRow,
  WidthType,
  AlignmentType,
  HeadingLevel,
} from "docx";
import { saveAs } from "file-saver";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RecordsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [records, setRecords] = useState<IssuanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [date, setDate] = useState<DateRange | undefined>();
  const [isClearAllDialogOpen, setIsClearAllDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const loadRecords = async () => {
      const { data, error } = await supabase
        .from("issuances")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      setRecords(
        (data || []).map((record) => ({
          id: record.id,
          name: record.name,
          email: record.email,
          age: record.age,
          gender: record.gender,
          department: record.department,
          chiefComplaints: record.chief_complaints,
          medicineTaken: record.medicine_taken || [],
          date: new Date(record.created_at).toLocaleDateString("en-PH", {
            timeZone: "Asia/Manila",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          time: record.time,
          createdAt: record.created_at,
        })),
      );

      setLoading(false);
    };

    loadRecords();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, date, itemsPerPage]);

  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => {
        const recordDate = new Date(r.createdAt);
        if (date?.from && recordDate < date.from) {
          return false;
        }
        if (date?.to) {
          const toDate = new Date(date.to);
          toDate.setDate(toDate.getDate() + 1);
          if (recordDate >= toDate) {
            return false;
          }
        }

        const search = searchTerm.toLowerCase();
        if (!search) {
          return true;
        }

        return (
          r.name?.toLowerCase().includes(search) ||
          r.email?.toLowerCase().includes(search) ||
          r.department?.toLowerCase().includes(search) ||
          r.chiefComplaints?.toLowerCase().includes(search) ||
          r.date?.toLowerCase().includes(search) ||
          r.medicineTaken?.some((m: MedicineItem) =>
            m.medicine_name?.toLowerCase().includes(search),
          )
        );
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [records, searchTerm, date]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRecords, currentPage]);

  const exportAsCSV = () => {
    if (!filteredRecords || filteredRecords.length === 0) return;

    const headers = [
      "Date",
      "Time",
      "Patient Name",
      "Email",
      "Age",
      "Gender",
      "Department",
      "Chief Complaints",
      "Medicines Issued",
    ];
    const rows = filteredRecords.map((r) => [
      r.date,
      r.time,
      `"${r.name.replace(/"/g, '""')}"`,
      `"${(r.email || "").replace(/"/g, '""')}"`,
      r.age,
      r.gender,
      `"${r.department.replace(/"/g, '""')}"`,
      `"${(r.chiefComplaints || "").replace(/"/g, '""')}"`,
      `"${r.medicineTaken?.map((m: MedicineItem) => `${m.medicine_name} (${m.quantity})`).join("; ")}"`,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `medtrack_records_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportAsPDF = () => {
    if (!filteredRecords || filteredRecords.length === 0) return;

    const doc = new jsPDF("l", "mm", "a4");
    doc.setFontSize(18);
    doc.text("MedTrack Medicine Issuance Report", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const tableHeaders = [
      ["Date", "Time", "Patient Name", "Email", "Dept", "Medicines"],
    ];
    const tableData = filteredRecords.map((r) => [
      r.date,
      r.time,
      r.name,
      r.email || "N/A",
      r.department,
      r.medicineTaken
        ?.map((m: MedicineItem) => `${m.medicine_name} (${m.quantity})`)
        .join(", "),
    ]);

    autoTable(doc, {
      head: tableHeaders,
      body: tableData,
      startY: 35,
      theme: "grid",
      headStyles: { fillColor: [51, 65, 85], textColor: [255, 202, 9] },
      styles: { fontSize: 8 },
    });

    doc.save(`medtrack_records_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const exportAsDOCX = async () => {
    if (!filteredRecords || filteredRecords.length === 0) return;

    const tableRows = filteredRecords.map(
      (r) =>
        new DocxTableRow({
          children: [
            new DocxTableCell({ children: [new Paragraph(r.date || "")] }),
            new DocxTableCell({ children: [new Paragraph(r.name || "")] }),
            new DocxTableCell({
              children: [new Paragraph(r.department || "")],
            }),
            new DocxTableCell({
              children: [
                new Paragraph(
                  r.medicineTaken
                    ?.map((m: MedicineItem) => `${m.medicine_name}(${m.quantity})`)
                    .join(", ") || "",
                ),
              ],
            }),
          ],
        }),
    );

    const doc = new Document({
      sections: [
        {
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
                    new DocxTableCell({
                      children: [
                        new Paragraph({ text: "Date", style: "bold" }),
                      ],
                    }),
                    new DocxTableCell({
                      children: [
                        new Paragraph({ text: "Patient", style: "bold" }),
                      ],
                    }),
                    new DocxTableCell({
                      children: [
                        new Paragraph({ text: "Department", style: "bold" }),
                      ],
                    }),
                    new DocxTableCell({
                      children: [
                        new Paragraph({ text: "Medicines", style: "bold" }),
                      ],
                    }),
                  ],
                }),
                ...tableRows,
              ],
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(
      blob,
      `medtrack_records_${new Date().toISOString().split("T")[0]}.docx`,
    );
  };

  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;
    const { error } = await supabase
      .from("issuances")
      .delete()
      .eq("id", recordToDelete);

    if (error) {
      console.error("Error deleting record:", error);
      // A toast notification could be added here for better user feedback
    } else {
      setRecords((prev) => prev.filter((r) => r.id !== recordToDelete));
    }
    setIsDeleteDialogOpen(false);
    setRecordToDelete(null);
  };

  const handleClearAllRecords = async () => {
    const { error } = await supabase
      .from("issuances")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // A filter is required for delete.

    if (error) {
      console.error("Error clearing records:", error);
      toast({
        title: "Error Clearing Records",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setRecords([]);
      toast({
        title: "All Records Cleared",
        description: "All issuance records have been permanently deleted.",
      });
    }
    setIsClearAllDialogOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="mb-8 animate-in fade-in slide-in-from-left-8 duration-700">
          <h1 className="text-3xl font-bold font-headline tracking-tight text-accent uppercase">
            Medicine Issuance Logs
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">
            Real-time distribution records.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={loading || !filteredRecords?.length}
                className="gap-2 border-slate-200"
              >
                <Download className="h-4 w-4" /> Export Report
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={exportAsPDF}
                className="gap-2 cursor-pointer"
              >
                <FileText className="h-4 w-4 text-red-500" /> Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={exportAsDOCX}
                className="gap-2 cursor-pointer"
              >
                <File className="h-4 w-4 text-blue-500" /> Export as DOCX
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={exportAsCSV}
                className="gap-2 cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-500" /> Export
                as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsClearAllDialogOpen(true)}
            disabled={loading || records.length === 0}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-white border-b space-y-4 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                placeholder="Search by patient, email, medicine or symptoms..."
                className="w-full pl-8 h-10 border-slate-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-full sm:w-75 justify-start text-left font-normal h-10 border-slate-200",
                    !date && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y")} -{" "}
                        {format(date.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-25 font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                    Date
                  </TableHead>
                  <TableHead className="w-20 font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                    Time
                  </TableHead>
                  <TableHead className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">
                    Patient Name
                  </TableHead>
                  <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                    Email
                  </TableHead>
                  <TableHead className="w-15 font-bold text-slate-600 uppercase text-[10px] tracking-wider text-center">
                    Age
                  </TableHead>
                  <TableHead className="w-20 font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                    Gender
                  </TableHead>
                  <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                    Department
                  </TableHead>
                  <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                    Chief Complaints
                  </TableHead>
                  <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                    Medicines
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRecords.length > 0 ? (
                  paginatedRecords.map((record, index) => (
                    <TableRow
                      key={record.id || index}
                      className="hover:bg-primary/5 transition-colors cursor-default border-slate-100"
                    >
                      <TableCell className="font-medium whitespace-nowrap text-slate-500 text-xs">
                        {record.date}
                      </TableCell>
                      <TableCell className="text-slate-400 whitespace-nowrap text-xs">
                        {record.time}
                      </TableCell>
                      <TableCell className="font-bold text-slate-700">
                        {record.name}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 font-medium">
                        {record.email}
                      </TableCell>
                      <TableCell className="text-center text-slate-600">
                        {record.age}
                      </TableCell>
                      <TableCell className="text-slate-500 text-xs">
                        {record.gender}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="font-bold text-[10px] uppercase bg-slate-100 text-slate-600 border-none"
                        >
                          {record.department}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-50">
                        <p
                          className="text-xs text-slate-500 line-clamp-2 italic"
                          title={record.chiefComplaints}
                        >
                          {record.chiefComplaints}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {record.medicineTaken?.map((m: MedicineItem, i: number) => (
                            <span
                              key={i}
                              className="inline-flex items-center rounded-sm bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-primary/20"
                            >
                              {m.medicine_name} ({m.quantity})
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setRecordToDelete(record.id);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="h-48 text-center text-slate-400 font-medium italic"
                    >
                      {loading
                        ? "Loading records..."
                        : searchTerm
                          ? "No records found matching your search."
                          : "No issuance records logged yet."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex flex-col items-center justify-between gap-4 p-4 border-t border-slate-100 md:flex-row">
              <div className="text-sm text-muted-foreground">
                Showing {paginatedRecords.length} of {filteredRecords.length}{" "}
                records.
              </div>
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium">Rows per page</p>
                  <Select
                    value={`${itemsPerPage}`}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value));
                    }}
                  >
                    <SelectTrigger className="h-8 w-17.5">
                      <SelectValue placeholder={itemsPerPage} />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {[10, 20, 50, 100].map((pageSize) => (
                        <SelectItem key={pageSize} value={`${pageSize}`}>
                          {pageSize}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm font-medium">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(p + 1, totalPages))
                      }
                      disabled={currentPage >= totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={isClearAllDialogOpen}
        onOpenChange={setIsClearAllDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all{" "}
              <strong>{records.length}</strong> issuance records.
              <br />
              <br />
              Before proceeding, please ensure you have downloaded a backup of
              your records (e.g., PDF, CSV, or DOCX).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAllRecords}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, delete all records
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this issuance record? This action
              is permanent and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRecordToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
