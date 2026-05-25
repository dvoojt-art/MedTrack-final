"use client";

import { supabase } from "@/lib/supabase";
import { useState, useMemo, useRef, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Search,
  UserPlus,
  Trash2,
  Contact2,
  Loader2,
  CheckCircle2,
  Upload,
  FileSpreadsheet,
  Filter,
  Download,
  FileText,
  File,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const DEPARTMENTS = [
  "North America (NAM)",
  "Asia Pacific (APAC)",
  "Finance",
  "HR",
  "General Services (GenServ)",
  "IT",
  "OJT",
];

const ORG_DOMAIN = "callboxinc.com";

export default function EmployeeMasterListPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    department: "",
    employeeId: "",
  });

  useEffect(() => {
    const loadEmployees = async () => {
      setIsMounted(true);

      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          title: "Database Error",
          description: error.message,
          variant: "destructive",
        });

        setLoading(false);
        return;
      }

      setEmployees(
        (data || []).map((emp) => ({
          id: emp.id,
          fullName: emp.full_name,
          email: emp.email,
          department: emp.department,
          employeeId: emp.employee_id,
          status: emp.status,
          createdAt: emp.created_at,
        })),
      );

      setLoading(false);
    };

    loadEmployees();
  }, [toast]);

  const validateEmail = (email: string) => {
    return email.toLowerCase().endsWith(`@${ORG_DOMAIN}`);
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(formData.email)) {
      toast({
        title: "Domain Verification Failed",
        description: `Only users with @${ORG_DOMAIN} emails are authorized.`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const { data, error } = await supabase
      .from("employees")
      .insert({
        full_name: formData.fullName,
        email: formData.email,
        department: formData.department,
        employee_id: formData.employeeId,
        status: "Active",
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });

      setIsSubmitting(false);
      return;
    }

    setEmployees((prev) => [
      {
        id: data.id,
        fullName: data.full_name,
        email: data.email,
        department: data.department,
        employeeId: data.employee_id,
        status: data.status,
        createdAt: data.created_at,
      },
      ...prev,
    ]);

    toast({
      title: "Employee Added",
      description: `${formData.fullName} added to directory.`,
    });

    setFormData({
      fullName: "",
      email: "",
      department: "",
      employeeId: "",
    });

    setIsDialogOpen(false);
    setIsSubmitting(false);
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDept = deptFilter === "All" || emp.department === deptFilter;

      return matchesSearch && matchesDept;
    });
  }, [employees, searchTerm, deptFilter]);

  const exportAsCSV = () => {
    if (filteredEmployees.length === 0) return;
    const headers = ["Full Name", "Email", "Department", "ID", "Status"];
    const rows = filteredEmployees.map((emp) => [
      emp.fullName,
      emp.email,
      emp.department,
      emp.employeeId,
      emp.status,
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `employees_${new Date().toISOString().split("T")[0]}.csv`);
  };

  const exportAsPDF = () => {
    if (filteredEmployees.length === 0) return;
    const doc = new jsPDF();
    doc.text("Clinical Directory", 14, 15);
    autoTable(doc, {
      head: [["Name", "Email", "Department", "ID"]],
      body: filteredEmployees.map((emp) => [
        emp.fullName,
        emp.email,
        emp.department,
        emp.employeeId || "—",
      ]),
      startY: 20,
    });
    doc.save(`employees_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const exportAsDOCX = async () => {
    if (filteredEmployees.length === 0) return;
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: "Clinical Directory",
              heading: HeadingLevel.HEADING_1,
            }),
            new DocxTable({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new DocxTableRow({
                  children: [
                    new DocxTableCell({ children: [new Paragraph("Name")] }),
                    new DocxTableCell({ children: [new Paragraph("Email")] }),
                    new DocxTableCell({ children: [new Paragraph("Dept")] }),
                  ],
                }),
                ...filteredEmployees.map(
                  (emp) =>
                    new DocxTableRow({
                      children: [
                        new DocxTableCell({
                          children: [new Paragraph(emp.fullName)],
                        }),
                        new DocxTableCell({
                          children: [new Paragraph(emp.email)],
                        }),
                        new DocxTableCell({
                          children: [new Paragraph(emp.department)],
                        }),
                      ],
                    }),
                ),
              ],
            }),
          ],
        },
      ],
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `employees_${new Date().toISOString().split("T")[0]}.docx`);
  };
  const removeEmployee = async (id: string) => {
    const { error } = await supabase.from("employees").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setEmployees((prev) => prev.filter((emp) => emp.id !== id));

    toast({
      title: "Employee Removed",
      description: "Directory updated.",
    });
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight text-accent uppercase">
            Clinical Directory
          </h1>
          <p className="text-muted-foreground mt-1">
            Personnel authorized for medicine acquisition.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Input
            type="file"
            accept=".csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleAddEmployee}
          />
          <Button
            variant="outline"
            className="gap-2 border-slate-200"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            {isImporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Import CSV
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 border-slate-200"
                disabled={!filteredEmployees.length}
              >
                <Download className="h-4 w-4" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={exportAsPDF} className="gap-2">
                <FileText className="h-4 w-4 text-red-500" /> PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportAsDOCX} className="gap-2">
                <File className="h-4 w-4 text-blue-500" /> DOCX
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportAsCSV} className="gap-2">
                <FileSpreadsheet className="h-4 w-4 text-emerald-500" /> CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-primary text-accent hover:bg-primary/90 font-bold uppercase text-[10px]">
                <UserPlus className="h-4 w-4" /> Register Personnel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleAddEmployee}>
                <DialogHeader>
                  <DialogTitle className="font-headline text-accent uppercase tracking-tight">
                    New Employee
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">
                      Full Name
                    </Label>
                    <Input
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">
                      Work Email (@{ORG_DOMAIN})
                    </Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">
                        ID Number
                      </Label>
                      <Input
                        value={formData.employeeId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            employeeId: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">
                        Department
                      </Label>
                      <Select
                        value={formData.department}
                        onValueChange={(val) =>
                          setFormData({ ...formData, department: val })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DEPARTMENTS.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    className="w-full bg-accent text-primary font-black uppercase tracking-widest"
                    disabled={isSubmitting}
                  >
                    Save
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 space-y-2">
          <Label className="text-[10px] font-black uppercase text-slate-400">
            Search
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              className="pl-10 h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Name, Email or ID"
            />
          </div>
        </div>
        <div className="w-full sm:w-[240px] space-y-2">
          <Label className="text-[10px] font-black uppercase text-slate-400">
            Filter
          </Label>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Departments</SelectItem>
              {DEPARTMENTS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-bold text-[10px] uppercase">
                Identity
              </TableHead>
              <TableHead className="font-bold text-[10px] uppercase">
                Department
              </TableHead>
              <TableHead className="font-bold text-[10px] uppercase text-center">
                ID
              </TableHead>
              <TableHead className="font-bold text-[10px] uppercase text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold">{emp.fullName}</span>
                      <span className="text-xs text-slate-500">
                        {emp.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="text-[10px] uppercase"
                    >
                      {emp.department}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs">
                    {emp.employeeId || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEmployee(emp.id)}
                    >
                      <Trash2 className="h-4 w-4 text-slate-400 hover:text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-48 text-center text-slate-400 italic"
                >
                  No personnel found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
