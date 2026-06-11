"use client";
import { supabase } from "@/lib/supabase";
import { useState, useMemo, useEffect, useRef } from "react";
import type { InventoryDbRow, InventoryFormData } from "@/types/issuance";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Plus,
  Trash2,
  Loader2,
  Download,
  FileText,
  File,
  FileSpreadsheet,
  AlertTriangle,
  RefreshCcw,
  Upload,
  Info,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
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
  HeadingLevel,
  Table as DocxTable,
  TableRow as DocxTableRow,
  TableCell as DocxTableCell,
  WidthType,
  TextRun,
} from "docx";
import { saveAs } from "file-saver";

const CATEGORIES = [
  "Analgesic",
  "Antipyretic",
  "Antacid",
  "Antihistamine",
  "Antibiotic",
  "Vitamins",
  "First Aid",
  "Others",
];

const UNITS = ["Tablet", "Capsule", "Bottle", "Sachet", "Pack"];

export default function InventoryPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [inventory, setInventory] = useState<InventoryDbRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [additionalStock, setAdditionalStock] = useState(0);

  const [formData, setFormData] = useState<InventoryFormData>({
    medicine_name: "",
    category: "Analgesic",

    current_stock: 0,
    minimum_stock: 10,

    unit: "Tablet",
    dosage: "",

    expiration_date: "",
    quality: "Good",
    remarks: "",

    description: "",
  });

  useEffect(() => {
    loadMedicines();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter]);

  const loadMedicines = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from<InventoryDbRow>("medicines")
      .select("*")
      .order("medicine_name", { ascending: true });

    if (error) {
      console.error(error);

      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });

      setLoading(false);
      return;
    }

    setInventory(data || []);
    setLoading(false);
  };

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);

    const newMed = {
      id: crypto.randomUUID(),

      medicine_name: formData.medicine_name,
      category: formData.category,

      current_stock: formData.current_stock,
      minimum_stock: formData.minimum_stock,

      unit: formData.unit,
      dosage: formData.dosage,

      expiration_date: formData.expiration_date || null,

      quality: formData.quality,
      remarks: formData.remarks,

      description: formData.description,

      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("medicines").insert([newMed]);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });

      setIsSubmitting(false);
      return;
    }

    await loadMedicines();

    toast({
      title: "Medicine Added",
      description: `${formData.medicine_name} added successfully.`,
    });

    setFormData({
      medicine_name: "",
      category: "Analgesic",

      current_stock: 0,
      minimum_stock: 10,

      unit: "Tablet",
      dosage: "",

      expiration_date: "",

      quality: "Good",
      remarks: "",

      description: "",
    });

    setIsDialogOpen(false);

    setIsSubmitting(false);
  };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setIsImporting(true);

    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const csvData = event.target?.result as string;
        const sanitizedCsvData = csvData.startsWith("\uFEFF")
          ? csvData.substring(1)
          : csvData;
        const rows = sanitizedCsvData.split(/\r\n?|\n/);
        const headers =
          rows[0]?.split(",").map((h) => h.trim().toLowerCase()) || [];
        const dataRows = rows.slice(1);

        const headerMappings = {
          medicine_name: [
            "medicine name",
            "medicine_name",
            "name",
            "item name",
          ],
          category: ["category"],
          current_stock: [
            "current stock",
            "current_stock",
            "stock",
            "quantity",
          ],
          minimum_stock: ["minimum stock", "minimum_stock", "reorder point"],
          dosage: ["dosage"],
          expiration_date: [
            "expiration date",
            "expiration_date",
            "expiry",
            "exp date",
          ],
          quality: ["quality", "condition"],
          remarks: ["remarks", "notes"],
          unit: ["unit"],
          description: ["description"],
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

        const nameIndex = findHeaderIndex(
          headers,
          headerMappings.medicine_name,
        );

        if (nameIndex === -1) {
          throw new Error("CSV must include a 'Medicine Name' column.");
        }

        const categoryIndex = findHeaderIndex(headers, headerMappings.category);
        const stockIndex = findHeaderIndex(
          headers,
          headerMappings.current_stock,
        );
        const minStockIndex = findHeaderIndex(
          headers,
          headerMappings.minimum_stock,
        );
        const dosageIndex = findHeaderIndex(headers, headerMappings.dosage);
        const expIndex = findHeaderIndex(
          headers,
          headerMappings.expiration_date,
        );
        const qualityIndex = findHeaderIndex(headers, headerMappings.quality);
        const remarksIndex = findHeaderIndex(headers, headerMappings.remarks);
        const unitIndex = findHeaderIndex(headers, headerMappings.unit);
        const descIndex = findHeaderIndex(headers, headerMappings.description);

        const newItems: InventoryImportRow[] = [];
        for (const row of dataRows) {
          if (!row.trim()) continue;
          const values = row.split(",").map((s) => s.trim());

          const medicine_name = values[nameIndex];
          if (!medicine_name) continue;

          const category =
            categoryIndex > -1 ? values[categoryIndex] : "Others";
          const current_stock = stockIndex > -1 ? values[stockIndex] : "0";
          const minimum_stock =
            minStockIndex > -1 ? values[minStockIndex] : "10";
          const unit = unitIndex > -1 ? values[unitIndex] : "Tablet";

          newItems.push({
            medicine_name,
            category: CATEGORIES.includes(category) ? category : "Others",
            current_stock: Number(current_stock) || 0,
            minimum_stock: Number(minimum_stock) || 10,
            dosage: dosageIndex > -1 ? values[dosageIndex] : "",
            expiration_date: expIndex > -1 ? values[expIndex] || null : null,
            quality: qualityIndex > -1 ? values[qualityIndex] : "Good",
            remarks: remarksIndex > -1 ? values[remarksIndex] : "",
            unit: UNITS.includes(unit) ? unit : "Tablet",
            description: descIndex > -1 ? values[descIndex] : "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }

        if (newItems.length > 0) {
          const { error } = await supabase.from("medicines").insert(newItems);
          if (error) {
            throw new Error(error.message);
          }

          await loadMedicines();
          toast({
            title: "Import Successful",
            description: `${newItems.length} medicines imported successfully.`,
          });
          setIsImportDialogOpen(false);
        } else {
          toast({
            title: "Nothing to Import",
            description: "The CSV file is empty or has no valid data.",
            variant: "default",
          });
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("CSV Import Error:", err);

        toast({
          title: "Import Failed",
          description:
            message || "Ensure the CSV follows the correct format.",
          variant: "destructive",
        });
      } finally {
        setIsImporting(false);

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };

    reader.readAsText(file);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === "text/csv" || file.name.endsWith(".csv"))) {
      setIsImporting(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const csvData = event.target?.result as string;
          const sanitizedCsvData = csvData.startsWith("\uFEFF")
            ? csvData.substring(1)
            : csvData;
          const rows = sanitizedCsvData.split(/\r\n?|\n/);
          const headers =
            rows[0]?.split(",").map((h) => h.trim().toLowerCase()) || [];
          const dataRows = rows.slice(1);

          const headerMappings = {
            medicine_name: [
              "medicine name",
              "medicine_name",
              "name",
              "item name",
            ],
            category: ["category"],
            current_stock: [
              "current stock",
              "current_stock",
              "stock",
              "quantity",
            ],
            minimum_stock: ["minimum stock", "minimum_stock", "reorder point"],
            dosage: ["dosage"],
            expiration_date: [
              "expiration date",
              "expiration_date",
              "expiry",
              "exp date",
            ],
            quality: ["quality", "condition"],
            remarks: ["remarks", "notes"],
            unit: ["unit"],
            description: ["description"],
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

          const nameIndex = findHeaderIndex(
            headers,
            headerMappings.medicine_name,
          );

          if (nameIndex === -1) {
            throw new Error("CSV must include a 'Medicine Name' column.");
          }

          const categoryIndex = findHeaderIndex(
            headers,
            headerMappings.category,
          );
          const stockIndex = findHeaderIndex(
            headers,
            headerMappings.current_stock,
          );
          const minStockIndex = findHeaderIndex(
            headers,
            headerMappings.minimum_stock,
          );
          const dosageIndex = findHeaderIndex(headers, headerMappings.dosage);
          const expIndex = findHeaderIndex(
            headers,
            headerMappings.expiration_date,
          );
          const qualityIndex = findHeaderIndex(headers, headerMappings.quality);
          const remarksIndex = findHeaderIndex(headers, headerMappings.remarks);
          const unitIndex = findHeaderIndex(headers, headerMappings.unit);
          const descIndex = findHeaderIndex(
            headers,
            headerMappings.description,
          );

          const newItems: InventoryImportRow[] = [];
          for (const row of dataRows) {
            if (!row.trim()) continue;
            const values = row.split(",").map((s) => s.trim());

            const medicine_name = values[nameIndex];
            if (!medicine_name) continue;

            const category =
              categoryIndex > -1 ? values[categoryIndex] : "Others";
            const current_stock = stockIndex > -1 ? values[stockIndex] : "0";
            const minimum_stock =
              minStockIndex > -1 ? values[minStockIndex] : "10";
            const unit = unitIndex > -1 ? values[unitIndex] : "Tablet";

            newItems.push({
              medicine_name,
              category: CATEGORIES.includes(category) ? category : "Others",
              current_stock: Number(current_stock) || 0,
              minimum_stock: Number(minimum_stock) || 10,
              dosage: dosageIndex > -1 ? values[dosageIndex] : "",
              expiration_date: expIndex > -1 ? values[expIndex] || null : null,
              quality: qualityIndex > -1 ? values[qualityIndex] : "Good",
              remarks: remarksIndex > -1 ? values[remarksIndex] : "",
              unit: UNITS.includes(unit) ? unit : "Tablet",
              description: descIndex > -1 ? values[descIndex] : "",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }

          if (newItems.length > 0) {
            const { error } = await supabase.from("medicines").insert(newItems);
            if (error) {
              throw new Error(error.message);
            }

            await loadMedicines();
            toast({
              title: "Import Successful",
              description: `${newItems.length} medicines imported successfully.`,
            });
            setIsImportDialogOpen(false);
          } else {
            toast({
              title: "Nothing to Import",
              description: "The CSV file is empty or has no valid data.",
              variant: "default",
            });
          }
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          console.error("CSV Import Error:", err);

          toast({
            title: "Import Failed",
            description:
              errorMessage || "Ensure the CSV follows the correct format.",
            variant: "destructive",
          });
        } finally {
          setIsImporting(false);

          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      };
      reader.readAsText(file);
    } else if (file) {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Please upload a .csv file.",
      });
    }
  };

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchesSearch =
        item.medicine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === "All" || item.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [inventory, searchTerm, categoryFilter]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredInventory.length / itemsPerPage);
  }, [filteredInventory, itemsPerPage]);

  const paginatedInventory = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredInventory.slice(startIndex, endIndex);
  }, [filteredInventory, currentPage, itemsPerPage]);

  const exportAsPDF = () => {
    if (filteredInventory.length === 0) return;

    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.text("Medicine Inventory Report", 14, 18);

    doc.setFontSize(10);
    doc.setTextColor(100);

    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);

    // Table
    autoTable(doc, {
      startY: 34,

      head: [
        [
          "Date",
          "Medicine",
          "Stock",
          "Dosage",
          "Unit",
          "Quality",
          "Expiration",
        ],
      ],

      body: filteredInventory.map((item) => [
        item.created_at.split("T")[0],
        item.medicine_name || "-",
        item.current_stock || 0,
        item.dosage || "-",
        item.unit || "-",
        item.quality || "-",
        item.expiration_date
          ? new Date(item.expiration_date).toLocaleDateString()
          : "-",
      ]),

      styles: {
        fontSize: 9,
        cellPadding: 4,
        valign: "middle",
      },

      headStyles: {
        fillColor: [15, 23, 42], // slate-900
        textColor: 255,
        fontStyle: "bold",
      },

      alternateRowStyles: {
        fillColor: [248, 250, 252], // slate-50
      },

      bodyStyles: {
        textColor: [30, 41, 59],
      },

      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 28 },
        2: { halign: "left" },
        3: { halign: "left" },
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
        6: { cellWidth: 25 },
        7: { cellWidth: 28 },
      },

      didParseCell: (data) => {
        // Highlight low stock
        if (data.section === "body" && data.column.index === 2) {
          const row = filteredInventory[data.row.index];

          if (row.current_stock <= 0) {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = "bold";
          } else if (row.current_stock <= row.minimum_stock) {
            data.cell.styles.textColor = [202, 138, 4];
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
    });

    // Footer
    const pageCount = doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      doc.setFontSize(9);

      doc.text(`Page ${i} of ${pageCount}`, 180, 290);
    }

    doc.save(
      `medicine_inventory_${new Date().toISOString().split("T")[0]}.pdf`,
    );
  };

  const exportAsCSV = () => {
    if (filteredInventory.length === 0) return;

    const headers = [
      "Medicine Name",
      "Category",
      "Current Stock",
      "Minimum Stock",
      "Unit",
      "Dosage",
      "Expiration Date",
      "Quality",
      "Remarks",
      "Description",
      "Status",
      "Last Updated",
    ];

    const rows = filteredInventory.map((item) => {
      const status =
        item.current_stock <= 0
          ? "Out of Stock"
          : item.current_stock <= item.minimum_stock
            ? "Low Stock"
            : "Available";

      return [
        item.medicine_name || "",
        item.category || "",
        item.current_stock || 0,
        item.minimum_stock || 0,
        item.unit || "",
        item.dosage || "",
        item.expiration_date || "",
        item.quality || "",
        item.remarks || "",
        item.description || "",
        status,
        item.updated_at ? new Date(item.updated_at).toLocaleString() : "",
      ];
    });

    // Escape commas and quotes properly
    const csvContent = [
      headers.join(","),

      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    saveAs(
      blob,
      `medicine_inventory_${new Date().toISOString().split("T")[0]}.csv`,
    );

    toast({
      title: "Export Successful",
      description: "CSV file downloaded successfully.",
    });
  };

  const exportAsDOCX = async () => {
    if (filteredInventory.length === 0) return;

    const doc = new Document({
      sections: [
        {
          children: [
            // Title
            new Paragraph({
              children: [
                new TextRun({
                  text: "Clinical Inventory Report",
                  bold: true,
                  size: 32,
                }),
              ],
              heading: HeadingLevel.HEADING_1,
            }),

            // Generated Date
            new Paragraph({
              text: `Generated: ${new Date().toLocaleString()}`,
              spacing: {
                after: 300,
              },
            }),

            // Table
            new DocxTable({
              width: {
                size: 100,
                type: WidthType.PERCENTAGE,
              },

              rows: [
                // Header Row
                new DocxTableRow({
                  children: [
                    "Medicine",
                    "Category",
                    "Stock",
                    "Minimum",
                    "Dosage",
                    "Unit",
                    "Quality",
                    "Expiration",
                  ].map(
                    (header) =>
                      new DocxTableCell({
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: header,
                                bold: true,
                              }),
                            ],
                          }),
                        ],
                      }),
                  ),
                }),

                // Data Rows
                ...filteredInventory.map(
                  (item) =>
                    new DocxTableRow({
                      children: [
                        new DocxTableCell({
                          children: [new Paragraph(item.medicine_name || "-")],
                        }),

                        new DocxTableCell({
                          children: [new Paragraph(item.category || "-")],
                        }),

                        new DocxTableCell({
                          children: [
                            new Paragraph(String(item.current_stock || 0)),
                          ],
                        }),

                        new DocxTableCell({
                          children: [
                            new Paragraph(String(item.minimum_stock || 0)),
                          ],
                        }),

                        new DocxTableCell({
                          children: [new Paragraph(item.dosage || "-")],
                        }),

                        new DocxTableCell({
                          children: [new Paragraph(item.unit || "-")],
                        }),

                        new DocxTableCell({
                          children: [new Paragraph(item.quality || "-")],
                        }),

                        new DocxTableCell({
                          children: [
                            new Paragraph(
                              item.expiration_date
                                ? new Date(
                                    item.expiration_date,
                                  ).toLocaleDateString()
                                : "-",
                            ),
                          ],
                        }),
                      ],
                    }),
                ),
              ],
            }),

            // Footer
            new Paragraph({
              text: "",
              spacing: {
                before: 300,
              },
            }),

            new Paragraph({
              text: `Total Medicines: ${filteredInventory.length}`,
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);

    saveAs(
      blob,
      `medicine_inventory_${new Date().toISOString().split("T")[0]}.docx`,
    );

    toast({
      title: "Export Successful",
      description: "DOCX file downloaded successfully.",
    });
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    const { error } = await supabase
      .from("medicines")
      .delete()
      .eq("id", itemToDelete);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setInventory((prev) => prev.filter((item) => item.id !== itemToDelete));
      toast({
        title: "Item Removed",
        description: "Medicine deleted successfully.",
      });
    }
    setIsDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const updateStock = async (id: string, newStock: number) => {
    const { error } = await supabase
      .from("medicines")
      .update({
        current_stock: newStock,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });

      return;
    }

    await loadMedicines();

    toast({
      title: "Stock Updated",
      description: "Inventory adjusted successfully.",
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="mb-8 animate-in fade-in slide-in-from-left-8 duration-700">
          <h1 className="text-3xl font-bold font-headline tracking-tight text-accent uppercase">
            Inventory Management
          </h1>
          <p className="mt-1 text-muted-foreground font-medium">
            Manage facility medicine stocks and reorder points.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Dialog
            open={isImportDialogOpen}
            onOpenChange={setIsImportDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 border-slate-200">
                <Upload className="h-4 w-4" />
                Import CSV
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md rounded-3xl border-0 p-0 overflow-hidden data-[state=open]:animate-[dialogPop_0.35s_cubic-bezier(0.34,1.56,0.64,1)]">
              {/* Header */}
              <div className="border-b bg-linear-to-r from-primary/10 to-transparent px-6 py-5">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3 text-xl font-bold">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                      <FileSpreadsheet className="h-5 w-5 text-primary" />
                    </div>
                    CSV Import
                  </DialogTitle>

                  <DialogDescription className="text-sm text-muted-foreground pt-1">
                    Upload a CSV file to import medicines into inventory.
                  </DialogDescription>
                </DialogHeader>
              </div>

              {/* Body */}
              <div className="space-y-5 px-6 py-6">
                {/* Upload */}
                <div
                  className="space-y-3"
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleCSVImport}
                  />

                  {/* Drag and Drop Area */}
                  <div
                    className={cn(
                      "relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-muted/20 p-8 text-center transition-colors",
                      isDragging && "border-primary bg-primary/10",
                      "data-[state=importing]:cursor-not-allowed data-[state=importing]:opacity-50",
                    )}
                    data-state={isImporting ? "importing" : "idle"}
                    onClick={() => {
                      if (!isImporting) {
                        fileInputRef.current?.click();
                      }
                    }}
                  >
                    {isImporting ? (
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="font-semibold">
                          Importing, please wait...
                        </p>
                      </div>
                    ) : isDragging ? (
                      <p className="font-semibold text-primary">
                        Drop the file here...
                      </p>
                    ) : (
                      <div className="space-y-3">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border bg-background">
                          <Upload className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="font-semibold">
                          Drag & drop a CSV file here, or click to select
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Only .csv files are supported
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Important Notes */}
                  <div className="flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold">Important Notes</h4>
                      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-xs text-amber-800">
                        <li>
                          The CSV file <strong>must</strong> include a column
                          for <code>medicine_name</code>. Other columns are
                          optional.
                        </li>
                        <li>
                          Use the <strong>Download CSV Template</strong> button
                          to get a file with the correct headers.
                        </li>
                        <li>
                          If optional columns are missing (e.g.,{" "}
                          <code>category</code>, <code>unit</code>), default
                          values will be used.
                        </li>
                        <li>
                          Ensure dates are in a standard format like YYYY-MM-DD.
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Download Template Button */}
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full rounded-2xl"
                    disabled={isImporting}
                    onClick={(e) => {
                      e.stopPropagation(); // prevent triggering the file input click from the parent div
                      const csvTemplate = [
                        [
                          "medicine_name",
                          "category",
                          "current_stock",
                          "minimum_stock",
                          "dosage",
                          "expiration_date",
                          "quality",
                          "remarks",
                          "unit",
                          "description",
                        ].join(","),

                        [
                          "Paracetamol",
                          "Analgesic",
                          "100",
                          "10",
                          "500mg",
                          "2026-12-31",
                          "Good",
                          "For fever",
                          "Tablet",
                          "Pain reliever medicine",
                        ].join(","),

                        [
                          "Amoxicillin",
                          "Antibiotic",
                          "50",
                          "5",
                          "250mg",
                          "2027-05-20",
                          "Good",
                          "Take after meal",
                          "Capsule",
                          "Antibiotic medicine",
                        ].join(","),
                      ].join("\n");

                      const blob = new Blob([csvTemplate], {
                        type: "text/csv;charset=utf-8;",
                      });

                      saveAs(blob, "medicine_inventory_template.csv");
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV Template
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 border-slate-200"
                disabled={!filteredInventory.length}
              >
                <Download className="h-4 w-4" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={exportAsPDF}
                className="gap-2 cursor-pointer"
              >
                <FileText className="h-4 w-4 text-red-500" /> PDF Report
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={exportAsDOCX}
                className="gap-2 cursor-pointer"
              >
                <File className="h-4 w-4 text-blue-500" /> DOCX Record
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={exportAsCSV}
                className="gap-2 cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-500" /> CSV
                Sheet
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-accent text-primary hover:bg-accent/90 font-bold uppercase text-[10px] shadow-lg shadow-accent/10">
                <Plus className="h-4 w-4" />
                Add Medicine
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-3xl p-0 overflow-hidden rounded-3xl border-0 bg-background">
              <form onSubmit={handleAddMedicine}>
                {/* Header */}
                <div className="border-b bg-linear-to-r from-primary/5 via-primary/10 to-transparent px-6 py-5">
                  <DialogHeader className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                        <Plus className="h-5 w-5 text-primary" />
                      </div>

                      <div>
                        <DialogTitle className="text-2xl font-bold tracking-tight">
                          Register Medicine
                        </DialogTitle>

                        <DialogDescription className="text-sm text-muted-foreground">
                          Add a new medicine to inventory stock.
                        </DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>
                </div>

                {/* Body */}
                <div className="max-h-[75vh] overflow-y-auto px-6 py-6">
                  <div className="grid gap-5">
                    {/* Medicine Name */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Medicine Name
                      </Label>

                      <Input
                        placeholder="Paracetamol 500mg"
                        value={formData.medicine_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            medicine_name: e.target.value,
                          })
                        }
                        required
                        className="h-12 rounded-2xl"
                      />
                    </div>

                    {/* Category + Unit */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Category
                        </Label>

                        <Select
                          value={formData.category}
                          onValueChange={(val) =>
                            setFormData({
                              ...formData,
                              category: val,
                            })
                          }
                        >
                          <SelectTrigger className="h-12 rounded-2xl">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>

                          <SelectContent>
                            {CATEGORIES.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Unit
                        </Label>

                        <Select
                          value={formData.unit}
                          onValueChange={(val) =>
                            setFormData({
                              ...formData,
                              unit: val,
                            })
                          }
                        >
                          <SelectTrigger className="h-12 rounded-2xl">
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>

                          <SelectContent>
                            {UNITS.map((u) => (
                              <SelectItem key={u} value={u}>
                                {u}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Dosage + Expiration */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Dosage
                        </Label>

                        <Input
                          placeholder="500mg"
                          value={formData.dosage}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              dosage: e.target.value,
                            })
                          }
                          className="h-12 rounded-2xl"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Expiration Date
                        </Label>

                        <Input
                          type="date"
                          value={formData.expiration_date}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              expiration_date: e.target.value,
                            })
                          }
                          className="h-12 rounded-2xl"
                        />
                      </div>
                    </div>

                    {/* Stock */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Current Stock
                        </Label>

                        <Input
                          type="number"
                          min={0}
                          value={formData.current_stock}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              current_stock: parseInt(e.target.value) || 0,
                            })
                          }
                          required
                          className="h-12 rounded-2xl"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Minimum Stock
                        </Label>

                        <Input
                          type="number"
                          min={1}
                          value={formData.minimum_stock}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              minimum_stock: parseInt(e.target.value) || 10,
                            })
                          }
                          required
                          className="h-12 rounded-2xl"
                        />
                      </div>
                    </div>

                    {/* Quality + Remarks */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Quality
                        </Label>

                        <Select
                          value={formData.quality}
                          onValueChange={(val) =>
                            setFormData({
                              ...formData,
                              quality: val,
                            })
                          }
                        >
                          <SelectTrigger className="h-12 rounded-2xl">
                            <SelectValue />
                          </SelectTrigger>

                          <SelectContent>
                            <SelectItem value="Good">Good</SelectItem>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Damaged">Damaged</SelectItem>
                            <SelectItem value="Expired">Expired</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Remarks
                        </Label>

                        <Input
                          placeholder="Optional remarks"
                          value={formData.remarks}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              remarks: e.target.value,
                            })
                          }
                          className="h-12 rounded-2xl"
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Description
                      </Label>

                      <Textarea
                        rows={4}
                        placeholder="Medicine notes, usage, instructions..."
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        className="resize-none rounded-2xl"
                      />
                    </div>
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
                    {isSubmitting ? "Saving..." : "Save Medicine"}
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
            Search Supplies
          </Label>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <Input
              className="w-full pl-10 h-10 border-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Medicine name..."
            />
          </div>
        </div>

        <div className="w-full sm:w-60 space-y-2">
          <Label className="text-[10px] font-black uppercase text-slate-400">
            Filter Category
          </Label>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full border-slate-200">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>

              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
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
              <TableHead className="font-bold text-[10px] uppercase text-slate-600">
                Date
              </TableHead>
              <TableHead className="font-bold text-[10px] uppercase text-slate-600">
                Medicine Details
              </TableHead>
              <TableHead className="font-bold text-[10px] uppercase text-slate-600">
                Dosage
              </TableHead>
              <TableHead className="font-bold text-[10px] uppercase text-slate-600 text-center">
                Quantity
              </TableHead>
              <TableHead className="font-bold text-[10px] uppercase text-slate-600 text-center">
                Status
              </TableHead>
              <TableHead className="font-bold text-[10px] uppercase text-slate-600 text-center">
                Expiration Date
              </TableHead>
              <TableHead className="font-bold text-[10px] uppercase text-slate-600 text-right px-5">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedInventory.length > 0 ? (
              paginatedInventory.map((item) => {
                const isLow = item.current_stock <= item.minimum_stock;

                const isOut = item.current_stock <= 0;

                return (
                  <TableRow
                    key={item.id}
                    className={isOut ? "bg-red-50/30" : "hover:bg-slate-50/50"}
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">
                          {item.created_at.split("T")[0]}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">
                          {item.medicine_name}
                        </span>
                        <span className="text-[9px] text-slate-400 uppercase font-black tracking-tighter">
                          ID: {item.id}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="text-[9px] font-bold uppercase tracking-tighter bg-slate-100 text-slate-600 border-none"
                      >
                        {item.dosage}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span
                          className={`font-mono font-bold text-sm ${isLow ? "text-destructive" : "text-slate-700"}`}
                        >
                          {item.current_stock}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {isOut ? (
                        <Badge className="bg-destructive text-white border-none text-[9px] font-black uppercase">
                          Out of Stock
                        </Badge>
                      ) : isLow ? (
                        <Badge className="bg-amber-100 text-amber-700 border-none text-[9px] font-black uppercase flex items-center gap-1 mx-auto w-fit">
                          <AlertTriangle className="h-3 w-3" /> Low Stock
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-100 text-emerald-700 border-none text-[9px] font-black uppercase flex items-center gap-1 mx-auto w-fit">
                          <CheckCircle2 className="h-3 w-3" /> Sufficient
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <span
                          className={`font-mono font-bold text-sm ${isLow ? "text-destructive" : "text-slate-700"}`}
                        >
                          {item.expiration_date}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="
        h-9 w-9 rounded-xl
        border border-border/50
        bg-background
        hover:bg-primary/10
        hover:text-primary
        transition-all duration-200
      "
                            >
                              <RefreshCcw className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>

                          <DialogContent className="sm:max-w-105 rounded-3xl border-0 p-0 overflow-hidden">
                            {/* Header */}
                            <div className="border-b bg-linear-to-r from-primary/10 to-transparent px-6 py-5">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    <RefreshCcw className="h-4 w-4" />
                                  </div>
                                  Adjust Stock
                                </DialogTitle>

                                <DialogDescription className="text-sm text-muted-foreground pt-1">
                                  Add additional stock quantity for this
                                  medicine.
                                </DialogDescription>
                              </DialogHeader>
                            </div>

                            {/* Content */}
                            <div className="space-y-5 px-6 py-6">
                              {/* Medicine Info */}
                              <div className="rounded-2xl border bg-muted/30 p-4">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                  Medicine
                                </p>

                                <h3 className="mt-1 font-semibold text-base">
                                  {item.medicine_name}
                                </h3>

                                <div className="mt-4 flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">
                                    Current Stock
                                  </span>

                                  <span className="text-2xl font-bold">
                                    {item.current_stock}
                                  </span>
                                </div>
                              </div>

                              {/* Add Quantity */}
                              <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  Add Quantity ({item.unit})
                                </Label>

                                <Input
                                  type="number"
                                  min={0}
                                  value={additionalStock}
                                  onChange={(e) =>
                                    setAdditionalStock(
                                      parseInt(e.target.value) || 0,
                                    )
                                  }
                                  placeholder="Enter quantity to add"
                                  className="
          h-12 rounded-2xl
          border-border/60
          bg-background
          text-base font-semibold
        "
                                />
                              </div>

                              {/* Preview */}
                              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">
                                    Updated Stock
                                  </span>

                                  <span className="text-2xl font-bold text-primary">
                                    {item.current_stock + additionalStock}
                                  </span>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center justify-end gap-3 pt-2">
                                <DialogClose asChild>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-xl"
                                  >
                                    Cancel
                                  </Button>
                                </DialogClose>

                                <DialogClose asChild>
                                  <Button
                                    type="button"
                                    className="rounded-xl px-6"
                                    onClick={async () => {
                                      const updatedStock =
                                        item.current_stock + additionalStock;

                                      await updateStock(item.id, updatedStock);

                                      setAdditionalStock(0);
                                    }}
                                  >
                                    Confirm Update
                                  </Button>
                                </DialogClose>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setItemToDelete(item.id);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="h-8 w-8 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-48 text-center text-slate-400 italic"
                >
                  {loading
                    ? "Loading inventory..."
                    : searchTerm || categoryFilter !== "All"
                      ? "No medicines in inventory matching search criteria."
                      : "No medicines in inventory yet."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <CardFooter className="flex flex-col md:flex-row items-center justify-between gap-4 border-t px-6 py-3">
          <div className="text-sm text-muted-foreground">
            <strong>{filteredInventory.length}</strong> total{" "}
            {filteredInventory.length === 1 ? "item" : "items"}.
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">Rows per page</p>
              <Select
                value={`${itemsPerPage}`}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
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
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="animate-danger-dialog border-red-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              medicine from the inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>
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
