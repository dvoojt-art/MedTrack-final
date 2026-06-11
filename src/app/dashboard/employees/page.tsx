"use client";

import { supabase } from "@/lib/supabase";
import { useState, useMemo, useRef, useEffect } from "react";
import type { EmployeeDbRow, EmployeeRecord } from "@/types/issuance";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  Edit,
  ChevronLeft,
  ChevronRight,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

const DEPARTMENTS = ["NAM", "APAC", "Finance", "HR", "GenServ", "IT", "OJT"];

const ORG_DOMAIN = "callboxinc.com";

export default function EmployeeMasterListPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    department: "",
    employeeId: "",
    team: "", // Added team field
  });

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRecord | null>(null);

  const [editFormData, setEditFormData] = useState({
    fullName: "",
    email: "",
    department: "",
    position: "",
    status: "",
  });

  const handleUpdateEmployee = async () => {
    if (!selectedEmployee) return;

    const { error } = await supabase
      .from("employees")
      .update({
        full_name: editFormData.fullName,
        email: editFormData.email,
        department: editFormData.department,
        position: editFormData.position,
        status: editFormData.status,
      })
      .eq("id", selectedEmployee.id);

    if (error) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });

      return;
    }

    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === selectedEmployee.id
          ? {
              ...emp,
              full_name: editFormData.fullName,
              email: editFormData.email,
              department: editFormData.department,
              position: editFormData.position,
              status: editFormData.status,
            }
          : emp,
      ),
    );

    toast({
      title: "Employee Updated",
      description: "Employee information has been updated.",
    });

    setIsEditDialogOpen(false);
  };

  useEffect(() => {
    const loadEmployees = async () => {
      setIsMounted(true);

      const { data, error } = await supabase
        .from<EmployeeDbRow>("employees")
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
          team: emp.team,
        })),
      );

      setLoading(false);
    };

    loadEmployees();
  }, [toast]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedEmployees([]);
  }, [searchTerm, deptFilter, itemsPerPage]);

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
        team: formData.team, // Added team to insertion
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
        team: data.team, // Ensure team is included in the new employee object
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
      team: "", // Reset team field
    });

    setIsDialogOpen(false);
    setIsSubmitting(false);
  };

  const processCsvFile = async (file: File) => {
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const csvData = event.target?.result as string;
        // Handle BOM and different line endings
        const sanitizedCsvData = csvData.startsWith("\uFEFF")
          ? csvData.substring(1)
          : csvData;
        const rows = sanitizedCsvData.split(/\r\n?|\n/);
        const headers =
          rows[0]?.split(",").map((h) => h.trim().toLowerCase()) || [];
        const dataRows = rows.slice(1);

        const headerMappings = {
          fullName: ["full name", "name", "employee name"],
          email: ["email", "work email", "email address"],
          department: ["department", "dept", "shift"],
          employeeId: ["id", "employee id", "employee_id"],
          team: ["team", "division"],
        };

        const findHeaderIndex = (
          headers: string[],
          possibleNames: string[],
        ): number => {
          for (const name of possibleNames) {
            const index = headers.indexOf(name);
            if (index !== -1) return index;
          }
          return -1;
        };

        const nameIndex = findHeaderIndex(headers, headerMappings.fullName);
        const emailIndex = findHeaderIndex(headers, headerMappings.email);

        if (nameIndex === -1 || emailIndex === -1) {
          toast({
            title: "Invalid CSV Format",
            description:
              "CSV must include columns for 'Full Name' and 'Email'.",
            variant: "destructive",
          });
          // Ensure loading state is reset on early exit
          setIsImporting(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }

        const deptIndex = findHeaderIndex(headers, headerMappings.department);
        const idIndex = findHeaderIndex(headers, headerMappings.employeeId);
        const teamIndex = findHeaderIndex(headers, headerMappings.team);

        const employeesToInsert = [];
        const validationErrors = [];

        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i];
          if (!row.trim()) continue;

          const values = row.split(",").map((v) => v.trim());
          const fullName = values[nameIndex];
          const email = values[emailIndex];
          const rawDepartment = deptIndex > -1 ? values[deptIndex] : undefined;
          let department = rawDepartment;
          const employeeId = idIndex > -1 ? values[idIndex] : "";
          const team = teamIndex > -1 ? values[teamIndex] : undefined;

          if (!fullName || !email) {
            validationErrors.push(
              `Row ${i + 2}: Missing required fields (Full Name and Email).`,
            );
            continue;
          }

          if (!validateEmail(email)) {
            validationErrors.push(
              `Row ${i + 2}: Invalid email domain for ${email}.`,
            );
            continue;
          }

          // Standardize department name if it exists and matches a known department, case-insensitively
          if (rawDepartment) {
            const matchedDept = DEPARTMENTS.find(
              (d) => d.toLowerCase() === rawDepartment.toLowerCase(),
            );
            if (matchedDept) {
              department = matchedDept;
            }
          }

          employeesToInsert.push({
            full_name: fullName,
            email: email,
            department: department || null,
            employee_id: employeeId || null,
            status: "Active",
            team: team || null,
          });
        }

        if (validationErrors.length > 0) {
          toast({
            title: "Import Validation Errors",
            description: `${validationErrors.length} rows had issues. See console for details.`,
            variant: "destructive",
          });
          console.error("CSV Import Validation Errors:", validationErrors);
        }

        if (employeesToInsert.length > 0) {
          const { data, error } = await supabase
            .from("employees")
            .insert(employeesToInsert)
            .select();

          if (error) {
            throw new Error(error.message);
          }

          const newEmployees = (data || []).map((emp) => ({
            id: emp.id,
            fullName: emp.full_name,
            email: emp.email,
            department: emp.department,
            employeeId: emp.employee_id,
            status: emp.status,
            createdAt: emp.created_at,
            team: emp.team,
          }));

          setEmployees((prev) => [...newEmployees, ...prev]);
          toast({
            title: "Import Successful",
            description: `${newEmployees.length} employees were added.`,
          });
        } else if (validationErrors.length === 0) {
          toast({
            title: "Nothing to Import",
            description: "The CSV file is empty or has no valid data.",
            variant: "default",
          });
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        toast({
          title: "Import Failed",
          description: message || "An unexpected error occurred.",
          variant: "destructive",
        });
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };

    reader.onerror = () => {
      toast({
        title: "File Read Error",
        description: "Could not read the selected file.",
        variant: "destructive",
      });
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    reader.readAsText(file);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processCsvFile(file);
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.team?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDept = deptFilter === "All" || emp.department === deptFilter;

      return matchesSearch && matchesDept;
    });
  }, [employees, searchTerm, deptFilter]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredEmployees.length / itemsPerPage);
  }, [filteredEmployees, itemsPerPage]);

  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredEmployees.slice(startIndex, endIndex);
  }, [filteredEmployees, currentPage, itemsPerPage]);

  const exportAsCSV = () => {
    if (filteredEmployees.length === 0) return;
    const headers = [
      "Full Name",
      "Email",
      "Department",
      "ID",
      "Team",
      "Status",
    ];
    const rows = filteredEmployees.map((emp) => [
      emp.fullName,
      emp.email,
      emp.department,
      emp.employeeId,
      emp.team,
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
      head: [["Name", "Email", "Department", "ID", "Team"]],
      body: filteredEmployees.map((emp) => [
        emp.fullName,
        emp.email,
        emp.department,
        emp.employeeId || "—",
        emp.team || "—",
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
                    new DocxTableCell({ children: [new Paragraph("ID")] }),
                    new DocxTableCell({ children: [new Paragraph("Team")] }),
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
                          children: [new Paragraph(emp.department || "")],
                        }),
                        new DocxTableCell({
                          children: [new Paragraph(emp.employeeId || "")],
                        }),
                        new DocxTableCell({
                          children: [new Paragraph(emp.team || "")],
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
  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;

    const { error } = await supabase
      .from("employees")
      .delete()
      .eq("id", employeeToDelete);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setEmployees((prev) => prev.filter((emp) => emp.id !== employeeToDelete));
      toast({
        title: "Employee Removed",
        description: "Directory updated.",
      });
    }
    setIsDeleteDialogOpen(false);
    setEmployeeToDelete(null);
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedEmployees.length === 0) return;

    const { error } = await supabase
      .from("employees")
      .delete()
      .in("id", selectedEmployees);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setEmployees((prev) =>
        prev.filter((emp) => !selectedEmployees.includes(emp.id)),
      );
      setSelectedEmployees([]);
      toast({
        title: "Employees Removed",
        description: `${selectedEmployees.length} employees deleted successfully.`,
      });
    }
    setIsBulkDeleteDialogOpen(false);
  };

  if (!isMounted) return null;

  const downloadTemplate = () => {
    const csv = `full name,email,department,employee_id
Juan Dela Cruz,juan@company.com,Pharmacy,EMP001
Maria Santos,maria@company.com,Nursing,EMP002`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "clinical-directory-template.csv");

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processCsvFile(file);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="mb-8 animate-in fade-in slide-in-from-left-8 duration-700">
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
            onChange={handleImportCSV}
          />
          <Button
            variant="outline"
            className="gap-2 cursor-pointer border-slate-200"
            onClick={() => setIsImportDialogOpen(true)}
            disabled={isImporting}
          >
            <Upload className="h-4 w-4" />
            Import Personnel
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 border-slate-200 cursor-pointer"
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
              <Button className="gap-2 bg-primary cursor-pointer text-accent hover:bg-primary/90 font-bold uppercase text-[10px]">
                <UserPlus className="h-4 w-4" /> Register Personnel
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md rounded-3xl border-0 p-0 overflow-hidden data-[state=open]:animate-[dialogPop_0.35s_cubic-bezier(0.34,1.56,0.64,1)]">
              <form onSubmit={handleAddEmployee}>
                {/* Header */}
                <div className="border-b bg-linear-to-r from-primary/10 to-transparent px-6 py-5">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-xl font-bold">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                        <UserPlus className="h-5 w-5 text-primary" />
                      </div>
                      Register Personnel
                    </DialogTitle>

                    <DialogDescription className="text-sm text-muted-foreground pt-1">
                      Enter employee information to register authorized
                      personnel.
                    </DialogDescription>
                  </DialogHeader>
                </div>

                {/* Body */}
                <div className="space-y-5 px-6 py-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Full Name
                    </Label>
                    <Input
                      placeholder="Juan Dela Cruz"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fullName: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Work Email (@{ORG_DOMAIN})
                    </Label>
                    <Input
                      placeholder="juan@callboxinc.com"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          email: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        ID Number
                      </Label>
                      <Input
                        placeholder="EMP001"
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
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Department
                      </Label>
                      <Select
                        value={formData.department}
                        onValueChange={(val) =>
                          setFormData({ ...formData, department: val })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Department" />
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

                  {/* Team */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Team
                    </Label>
                    <Input
                      placeholder="e.g., Alpha, Beta, etc."
                      value={formData.team}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          team: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 border-t bg-muted/20 px-6 py-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="rounded-2xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-2xl px-6 shadow-lg"
                  >
                    {isSubmitting ? "Saving..." : "Save Employee"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="w-full flex-1 space-y-2">
          <Label className="text-[10px] font-black uppercase text-slate-400">
            Search
          </Label>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <Input
              className="w-full pl-10 h-10 border-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Name, Email, ID, or Team"
            />
          </div>
        </div>

        <div className="w-full sm:w-60 space-y-2">
          <Label className="text-[10px] font-black uppercase text-slate-400">
            Filter
          </Label>

          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-full h-10 border-slate-200">
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
        {selectedEmployees.length > 0 && (
          <Button
            variant="destructive"
            onClick={() => setIsBulkDeleteDialogOpen(true)}
            className="h-10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete ({selectedEmployees.length})
          </Button>
        )}
      </div>

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border-0 p-0 overflow-hidden data-[state=open]:animate-[dialogPop_0.35s_cubic-bezier(0.34,1.56,0.64,1)]">
          <div className="border-b bg-linear-to-r from-primary/10 to-transparent px-6 py-5">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-xl font-bold">
                Import Personnel Records
              </DialogTitle>

              <DialogDescription className="text-sm text-muted-foreground pt-1">
                Upload a CSV file containing employee information authorized for
                medicine acquisition.
              </DialogDescription>
            </DialogHeader>
          </div>

           <div className="space-y-5 px-6 py-6">
            <div
              onDragEnter={isImporting ? undefined : handleDragEnter}
              onDragLeave={isImporting ? undefined : handleDragLeave}
              onDragOver={isImporting ? undefined : handleDragOver}
              onDrop={isImporting ? undefined : handleDrop}
              onClick={
                isImporting ? undefined : () => fileInputRef.current?.click()
              }
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDraggingOver
                  ? "border-primary bg-primary/10"
                  : "border-slate-300 bg-muted/20 hover:border-primary"
              }`}
            >
              {isImporting ? (
                <div className="flex flex-col items-center justify-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="mt-4 text-sm font-semibold">
                    Importing, please wait...
                  </p>
                </div>
              ) : (
                <>
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border bg-background">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="mt-3 font-semibold">
                    Drag & drop your CSV file here, or{" "}
                    <span className="font-semibold text-primary">
                      click to browse
                    </span>
                    .
                  </p>
                </>
              )}
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
              <p className="font-semibold text-amber-700 mb-2">
                Important Notes
              </p>

              <ul className="space-y-1 text-muted-foreground list-disc pl-4">
                <li>Email addresses must be valid.</li>
                <li>Duplicate email addresses will be skipped.</li>
                <li>Department names should match existing departments.</li>
                <li>Download the template if you are unsure of the format.</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-end gap-3 border-t bg-muted/20 px-6 py-4">
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="cursor-pointer w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-12 px-4">
                <Checkbox
                  checked={
                    paginatedEmployees.length > 0 &&
                    paginatedEmployees.every((emp) =>
                      selectedEmployees.includes(emp.id),
                    )
                      ? true
                      : paginatedEmployees.some((emp) =>
                            selectedEmployees.includes(emp.id),
                          )
                        ? "indeterminate"
                        : false
                  }
                  onCheckedChange={(checked) => {
                    const paginatedIds = paginatedEmployees.map(
                      (emp) => emp.id,
                    );
                    if (checked) {
                      setSelectedEmployees((prev) => [
                        ...new Set([...prev, ...paginatedIds]),
                      ]);
                    } else {
                      setSelectedEmployees((prev) =>
                        prev.filter((id) => !paginatedIds.includes(id)),
                      );
                    }
                  }}
                />
              </TableHead>
              <TableHead className="font-bold text-[10px] uppercase">
                Identity
              </TableHead>
              <TableHead className="font-bold text-[10px] uppercase">
                Department
              </TableHead>
              <TableHead className="font-bold text-[10px] uppercase text-center">
                ID
              </TableHead>
              <TableHead className="font-bold text-[10px] uppercase text-center">
                Team
              </TableHead>
              <TableHead className="font-bold text-[10px] uppercase text-right px-5">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.length > 0 ? (
              paginatedEmployees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell className="px-4">
                    <Checkbox
                      checked={selectedEmployees.includes(emp.id)}
                      onCheckedChange={(checked) => {
                        setSelectedEmployees((prev) =>
                          checked
                            ? [...prev, emp.id]
                            : prev.filter((id) => id !== emp.id),
                        );
                      }}
                      aria-label={`Select ${emp.fullName}`}
                    />
                  </TableCell>
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
                  <TableCell className="text-center font-mono text-xs">
                    {emp.team || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* EDIT BUTTON */}
                      <Button
                        className="cursor-pointer"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedEmployee(emp);

                          setEditFormData({
                            fullName: emp.full_name,
                            email: emp.email,
                            department: emp.department,
                            position: emp.position,
                            status: emp.status,
                          });

                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4 text-slate-400 hover:text-blue-500" />
                      </Button>

                      {/* DELETE BUTTON */}
                      <Button
                        className="cursor-pointer"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEmployeeToDelete(emp.id);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500 hover:text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center">
                  {loading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                  ) : (
                    <p className="text-muted-foreground italic">
                      {searchTerm || deptFilter !== "All"
                        ? "No personnel found matching your criteria."
                        : "No personnel have been registered yet."}
                    </p>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <CardFooter className="flex flex-col md:flex-row items-center justify-between gap-4 border-t px-6 py-3">
          <div className="text-sm text-muted-foreground">
            <strong>{filteredEmployees.length}</strong> total{" "}
            {filteredEmployees.length === 1 ? "employee" : "employees"}.
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
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
                  {[10, 20, 30, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium">
                Page {currentPage} of {totalPages > 0 ? totalPages : 1}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>

      <AlertDialog
        open={isBulkDeleteDialogOpen}
        onOpenChange={setIsBulkDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              selected <strong>{selectedEmployees.length}</strong> employees
              from the directory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
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
              This action cannot be undone. This will permanently delete this
              employee from the directory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEmployeeToDelete(null)}>
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-137.5 border-0 bg-white/95 backdrop-blur-xl shadow-2xl rounded-3xl p-0 overflow-hidden">
          {/* HEADER */}
          <div className="bg-linear-to-r from-yellow-400 via-yellow-300 to-amber-400 px-6 py-5">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-black flex items-center gap-2">
                <Edit className="h-6 w-6" />
                Edit Employee
              </DialogTitle>

              <p className="text-sm text-black/70 mt-1">
                Update employee information and account details.
              </p>
            </DialogHeader>
          </div>

          {/* BODY */}
          <div className="p-6 space-y-5">
            {/* FULL NAME */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                Full Name
              </Label>

              <Input
                placeholder="Enter employee full name"
                value={editFormData.fullName || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    fullName: e.target.value,
                  })
                }
                className="h-12 rounded-xl border-slate-200 focus-visible:ring-yellow-400"
              />
            </div>

            {/* EMAIL */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                Email Address
              </Label>

              <Input
                placeholder="Enter email address"
                value={editFormData.email || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    email: e.target.value,
                  })
                }
                className="h-12 rounded-xl border-slate-200 focus-visible:ring-yellow-400"
              />
            </div>

            {/* GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* DEPARTMENT */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Department
                </Label>

                <Input
                  placeholder="Department"
                  value={editFormData.department || ""}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      department: e.target.value,
                    })
                  }
                  className="h-12 rounded-xl border-slate-200 focus-visible:ring-yellow-400"
                />
              </div>

              {/* POSITION */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Position
                </Label>

                <Input
                  placeholder="Position"
                  value={editFormData.position || ""}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      position: e.target.value,
                    })
                  }
                  className="h-12 rounded-xl border-slate-200 focus-visible:ring-yellow-400"
                />
              </div>
            </div>

            {/* STATUS */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                Employment Status
              </Label>

              <Select
                value={editFormData.status || ""}
                onValueChange={(value) =>
                  setEditFormData({
                    ...editFormData,
                    status: value,
                  })
                }
              >
                <SelectTrigger className="h-12 rounded-xl border-slate-200 focus:ring-yellow-400">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>

                <SelectContent className="rounded-xl">
                  <SelectItem value="Active">Active</SelectItem>

                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ACTIONS */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>

              <Button
                onClick={handleUpdateEmployee}
                className="rounded-xl bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-6"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
