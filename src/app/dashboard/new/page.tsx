"use client";

import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Send,
  Stethoscope,
  Home,
  CheckCircle2,
  UserCheck,
  UserX,
  AlertCircle,
  Clock3,
  Package2,
  Search,
} from "lucide-react";
import { ReceiptView } from "@/components/records/receipt-view";
import { useToast } from "@/hooks/use-toast";
import type {
  IssuanceFormData,
  IssuanceRecord,
  MedicineItem,
  MedicineOption,
} from "@/types/issuance";
import Link from "next/link";

const ORG_DOMAIN = "callboxinc.com";

export default function PublicPortalPage() {
  const { toast } = useToast();
  const [showReceipt, setShowReceipt] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState<IssuanceRecord | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [medicineDialogOpen, setMedicineDialogOpen] = useState(false);
  const [medicineSearch, setMedicineSearch] = useState("");
  const [selectedMedicineIndex, setSelectedMedicineIndex] = useState<
    number | null
  >(null);

  const [formData, setFormData] = useState<IssuanceFormData>({
    name: "",
    email: "",
    age: "",
    gender: "Male",
    department: "",
    chiefComplaints: "",
  });

  const [medicines, setMedicines] = useState<MedicineItem[]>([
    {
      medicine_id: "",
      medicine_name: "",
      quantity: 1,
      minimum_stock: 1,
      dosage: "",
      name: "",
    },
  ]);

  const [medicineOptions, setMedicineOptions] = useState<MedicineOption[]>([]);

  useEffect(() => {
    setIsMounted(true);
    loadMedicines();
  }, []);

  // Personnel Verification logic
  useEffect(() => {
    if (
      !isMounted ||
      formData.email.length < 5 ||
      !formData.email.toLowerCase().endsWith(`@${ORG_DOMAIN}`)
    ) {
      setIsVerified(null);
      return;
    }

    const timer = setTimeout(async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("email", formData.email.toLowerCase())
        .single();

      if (error || !data) {
        setIsVerified(false);
        return;
      }

      setFormData((prev) => ({
        ...prev,
        name: data.full_name,
        department: data.department,
      }));

      setIsVerified(true);
    }, 400);

    return () => clearTimeout(timer);
  }, [formData.email, isMounted]);

  const addMedicine = () => {
    setMedicines([
      ...medicines,
      {
        medicine_id: "",
        medicine_name: "",
        quantity: 1,
        minimum_stock: 1,
        dosage: "",
        name: "",
      },
    ]);
  };

  const removeMedicine = (index: number) => {
    if (medicines.length === 1) return;
    const newMedicines = [...medicines];
    newMedicines.splice(index, 1);
    setMedicines(newMedicines);
  };

  const updateMedicine = (
    index: number,
    field: keyof MedicineItem,
    value: string | number,
  ) => {
    const newMedicines = [...medicines];
    newMedicines[index] = { ...newMedicines[index], [field]: value };
    setMedicines(newMedicines);
  };

  const loadMedicines = async () => {
    const { data, error } = await supabase
      .from<"medicines", MedicineOption>("medicines")
      .select("*")
      .order("medicine_name");

    if (error) {
      console.error(error);
      return;
    }

    setMedicineOptions(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isVerified) {
      toast({
        title: "Personnel Not Registered",
        description: `Your @${ORG_DOMAIN} account is not found in the personnel list.`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    for (const med of medicines) {
      const stock = medicineOptions.find((m) => m.id === med.medicine_id);

      if (!stock) continue;

      if (med.quantity > stock.current_stock) {
        toast({
          title: "Insufficient Stock",
          description: `${stock.medicine_name} only has ${stock.current_stock} remaining.`,
          variant: "destructive",
        });

        return;
      }
    }
    try {
      const now = new Date();

      const { data, error } = await supabase
        .from("issuances")
        .insert({
          name: formData.name,
          email: formData.email.toLowerCase(),
          age: parseInt(formData.age) || 0,
          gender: formData.gender,
          department: formData.department,
          chief_complaints: formData.chiefComplaints,
          medicine_taken: medicines,

          date: now.toISOString().split("T")[0],
          time: now.toLocaleTimeString("en-PH", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            timeZone: "Asia/Manila",
          }),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      for (const med of medicines) {
        const stock = medicineOptions.find((m) => m.id === med.medicine_id);

        if (!stock) continue;

        const newStock = stock.current_stock - med.quantity;

        const { error: updateError } = await supabase
          .from("medicines")
          .update({
            current_stock: newStock,
            updated_at: new Date().toISOString(),
          })
          .eq("id", med.medicine_id);

        if (updateError) {
          console.error(updateError);
        }
      }
      const record = {
        id: data.id,
        name: data.name,
        email: data.email,
        age: data.age,
        gender: data.gender,
        department: data.department,
        chiefComplaints: data.chief_complaints,
        medicineTaken: data.medicine_taken,
        createdAt: data.created_at,
        date: data.time,
        time: data.time,
      };

      setSubmittedRecord(record);
      setIsSuccess(true);

      setTimeout(() => {
        setIsSuccess(false);
        setShowReceipt(true);

        toast({
          title: "Log Finalized",
          description: "Record successfully captured in system.",
        });
      }, 800);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Database Error",
        description: message || "Failed to save issuance record.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMedicineOptions = medicineOptions.filter((med) =>
    med.medicine_name?.toLowerCase().includes(medicineSearch.toLowerCase()),
  );

  if (!isMounted) return null;

  if (showReceipt && submittedRecord) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 animate-in fade-in zoom-in-95 duration-500">
        <ReceiptView
          record={submittedRecord}
          onClose={() => {
            setShowReceipt(false);
            setFormData({
              name: "",
              email: "",
              age: "",
              gender: "Male",
              department: "",
              chiefComplaints: "",
            });
            setMedicines([
              {
                medicine_id: "",
                medicine_name: "",
                quantity: 1,
                minimum_stock: 1,
                dosage: "",
                name: "",
              },
            ]);
            setIsVerified(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col animate-in fade-in duration-700">
      {isSuccess && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-full shadow-2xl border border-slate-200 zoom-in-50 duration-500 animate-pulse">
            <CheckCircle2 className="h-20 w-20 text-accent animate-bounce" />
          </div>

          <p className="mt-4 text-xl font-black uppercase text-slate-800 tracking-widest animate-in fade-in delay-200">
            Finalizing Entry...
          </p>
        </div>
      )}
      <main className="max-w-4xl mx-auto p-6 md:p-10 w-full flex-1">
        <div className="mb-8 animate-in fade-in slide-in-from-left-8 duration-700">
          <h2 className="text-3xl font-black font-headline tracking-tighter text-slate-800 uppercase">
            Employee Clinical Entry
          </h2>

          <p className="text-slate-500 mt-1 font-bold uppercase text-[10px] tracking-[0.2em]">
            Verified Facility Access Required
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-none shadow-sm overflow-hidden bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-500 animate-in zoom-in-95">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-xs font-black uppercase text-slate-500 tracking-widest">
                Personnel Verification
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">
                    Work Email (@{ORG_DOMAIN})
                  </Label>

                  <div className="relative">
                    <Input
                      type="email"
                      placeholder={`username@${ORG_DOMAIN}`}
                      className={`h-12 transition-all duration-300 focus:scale-[1.02] ${
                        isVerified === false
                          ? "border-destructive ring-destructive/10"
                          : "border-slate-200"
                      }`}
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          email: e.target.value,
                        })
                      }
                      required
                    />

                    <div className="absolute right-3 top-3.5">
                      {isVerified === true && (
                        <UserCheck className="h-5 w-5 text-emerald-500" />
                      )}

                      {isVerified === false && (
                        <UserX className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                  </div>

                  {isVerified === false && (
                    <p className="text-[10px] font-bold text-destructive uppercase tracking-widest flex items-center gap-1 animate-in fade-in">
                      <AlertCircle className="h-3 w-3" />
                      Personnel not found in directory
                    </p>
                  )}

                  {isVerified === true && (
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1 animate-in fade-in">
                      <CheckCircle2 className="h-3 w-3" />
                      Identified: {formData.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">
                    Identified Name
                  </Label>

                  <Input
                    value={formData.name || "Awaiting Verification..."}
                    readOnly
                    className="h-12 bg-slate-50 font-bold border-slate-100 text-slate-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">
                    Age
                  </Label>

                  <Input
                    type="number"
                    placeholder="Years"
                    value={formData.age}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        age: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">
                    Gender
                  </Label>

                  <Select
                    value={formData.gender}
                    onValueChange={(val) =>
                      setFormData({
                        ...formData,
                        gender: val,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Gender" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">
                    Department
                  </Label>

                  <Input
                    value={formData.department || "—"}
                    readOnly
                    className="bg-slate-50 font-bold border-slate-100"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <Label className="text-[10px] font-black uppercase text-slate-400">
                  Chief Complaints
                </Label>

                <Textarea
                  placeholder="Describe current symptoms briefly..."
                  className="min-h-25 mt-2 border-slate-200 transition-all duration-300 focus:scale-[1.01]"
                  value={formData.chiefComplaints}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      chiefComplaints: e.target.value,
                    })
                  }
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-black uppercase text-slate-500 tracking-widest">
                Clinical Distribution
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMedicine}
                className="gap-2 border-slate-200 text-[10px] font-bold uppercase cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Add Line
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {medicines.map((medicine, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-50 relative border border-slate-100"
                >
                  <div className="sm:col-span-2 space-y-2">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase">
                      Medicine
                    </Label>
                    <div className="flex gap-2">
                      <Select
                        value={medicine.medicine_id}
                        onValueChange={(value) => {
                          const selected = medicineOptions.find(
                            (m) => m.id === value,
                          );

                          if (!selected) return;

                          const updated = [...medicines];

                          updated[index] = {
                            ...updated[index],
                            medicine_id: selected.id,
                            medicine_name: selected.medicine_name,
                          };

                          setMedicines(updated);
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select medicine" />
                        </SelectTrigger>

                        <SelectContent>
                          {medicineOptions.map((med) => {
                            const isOutOfStock = med.current_stock <= 0;

                            return (
                              <SelectItem
                                key={med.id}
                                value={med.id}
                                disabled={isOutOfStock}
                                className={`
          cursor-pointer
          ${isOutOfStock ? "opacity-50 cursor-not-allowed" : ""}
        `}
                              >
                                <div className="flex items-center justify-between w-full gap-3">
                                  <span>{med.medicine_name}</span>

                                  <span
                                    className={`text-xs font-medium ${
                                      isOutOfStock
                                        ? "text-red-500"
                                        : "text-muted-foreground"
                                    }`}
                                  >
                                    {isOutOfStock
                                      ? "Out of Stock"
                                      : `Stock: ${med.current_stock}`}
                                  </span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setSelectedMedicineIndex(index);
                          setMedicineDialogOpen(true);
                        }}
                        className="cursor-pointer"
                      >
                        Browse
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase">
                      Qty
                    </Label>
                    <Input
                      type="number"
                      value={medicine.quantity}
                      min={1}
                      max={Math.min(
                        10,
                        medicineOptions.find(
                          (m) => m.id === medicine.medicine_id,
                        )?.current_stock || 1,
                      )}
                      onChange={(e) => {
                        if (e.target.value === "") {
                          updateMedicine(index, "quantity", "");
                          return;
                        }

                        const selectedMedicine = medicineOptions.find(
                          (m) => m.id === medicine.medicine_id,
                        );

                        const stock = selectedMedicine?.current_stock || 1;
                        const maxAllowed = Math.min(10, stock);

                        const inputValue = Number(e.target.value);

                        if (inputValue > maxAllowed) {
                          toast({
                            title: "Quantity Limit Reached",
                            description:
                              stock < 10
                                ? `Only ${stock} item(s) available in stock.`
                                : "Maximum allowed quantity is 10.",
                            variant: "destructive",
                          });
                        }

                        updateMedicine(
                          index,
                          "quantity",
                          Math.min(maxAllowed, Math.max(1, inputValue)),
                        );
                      }}
                      onBlur={() => {
                        if (
                          medicine.quantity === null ||
                          medicine.quantity === undefined ||
                          (typeof medicine.quantity === "string" &&
                            medicine.quantity === "")
                        ) {
                          updateMedicine(index, "quantity", 1);
                        }
                      }}
                      className="bg-white border-slate-200"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase">
                      Dosage
                    </Label>

                    {(() => {
                      const selectedMedicine = medicineOptions.find(
                        (m) => m.id === medicine.medicine_id,
                      );
                      
                      const databaseDosage = typeof selectedMedicine?.dosage === "string" 
                      ? selectedMedicine.dosage: "";
                      return (
                        <div className="space-y-1">
                          <div className="flex gap-2">
                            <Input
                              placeholder={
                                databaseDosage
                                  ? "Dosage loaded from inventory"
                                  : "Type dosage manually"
                              }
                              value={medicine.dosage || databaseDosage}
                              onChange={(e) =>
                                updateMedicine(index, "dosage", e.target.value)
                              }
                              className="
                              bg-white
                              border-slate-200
                                focus-visible:ring-2
                                focus-visible:ring-primary/30
                              "
                            />

                            {medicines.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="
                                  shrink-0
                                text-slate-300
                                  hover:text-destructive
                                  hover:bg-destructive/10
                                "
                                onClick={() => removeMedicine(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          {databaseDosage && !medicine.dosage && (
                            <p className="text-[10px] text-muted-foreground">
                              Auto-filled from inventory:{" "}
                              <span className="font-medium">
                                {databaseDosage}
                              </span>
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Dialog
            open={medicineDialogOpen}
            onOpenChange={setMedicineDialogOpen}
          >
            <DialogContent className="data-[state=open]:animate-[dialogPop_0.35s_cubic-bezier(0.34,1.56,0.64,1)]">
              {/* Header */}
              <div className="border-b bg-muted/30 px-5 py-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <DialogTitle className="text-2xl font-bold">
                      Select Medicine
                    </DialogTitle>

                    <DialogDescription className="text-sm text-muted-foreground">
                      Choose medicine from inventory stock
                    </DialogDescription>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-2">
                    <div className="rounded-2xl border bg-background px-4 py-2 text-center">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-lg font-bold">
                        {filteredMedicineOptions.length}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-2 text-center">
                      <p className="text-xs text-green-700">Available</p>
                      <p className="text-lg font-bold text-green-700">
                        {
                          filteredMedicineOptions.filter(
                            (m) => m.current_stock > 0,
                          ).length
                        }
                      </p>
                    </div>

                    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-center">
                      <p className="text-xs text-red-700">Out</p>
                      <p className="text-lg font-bold text-red-700">
                        {
                          filteredMedicineOptions.filter(
                            (m) => m.current_stock <= 0,
                          ).length
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="border-b px-5 py-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    placeholder="Search medicine name or category..."
                    value={medicineSearch}
                    onChange={(e) => setMedicineSearch(e.target.value)}
                    className="h-11 rounded-xl pl-10"
                  />
                </div>
              </div>

              {/* Medicine List */}
              <div className="max-h-[65vh] overflow-y-auto p-4">
                {filteredMedicineOptions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Package2 className="mb-4 h-10 w-10 text-muted-foreground" />

                    <h3 className="text-lg font-semibold">
                      No medicines found
                    </h3>

                    <p className="text-sm text-muted-foreground">
                      Try searching another keyword
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredMedicineOptions.map((med) => {
                      const isOut = med.current_stock <= 0;

                      const isLow =
                        med.current_stock > 0 &&
                        med.current_stock <= med.minimum_stock;

                      return (
                        <button
                          key={med.id}
                          disabled={isOut}
                          onClick={() => {
                            if (selectedMedicineIndex === null || isOut) return;

                            const updated = [...medicines];

                            updated[selectedMedicineIndex] = {
                              ...updated[selectedMedicineIndex],
                              medicine_id: med.id,
                              medicine_name: med.medicine_name,
                            };

                            setMedicines(updated);
                            setMedicineDialogOpen(false);
                          }}
                          className={`
          w-full
          rounded-2xl
          border
          transition-all
          duration-200
          text-left
          overflow-hidden
          ${
            isOut
              ? "opacity-50 cursor-not-allowed border-red-200 bg-red-50/40"
              : "cursor-pointer hover:border-primary hover:shadow-md bg-background"
          }
        `}
                        >
                          <div className="flex items-center justify-between gap-4 p-4">
                            {/* Left */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="truncate text-sm font-semibold">
                                  {med.medicine_name}
                                </h3>

                                <div
                                  className={`
                  h-2.5
                  w-2.5
                  rounded-full
                  shrink-0
                  ${
                    isOut
                      ? "bg-red-500"
                      : isLow
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }
                `}
                                />
                              </div>

                              <p className="mt-1 text-xs text-muted-foreground uppercase tracking-wide">
                                {med.category}
                              </p>
                            </div>

                            {/* Center */}
                            <div className="hidden md:flex items-center gap-6">
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Current Stock
                                </p>

                                <p className="text-lg font-bold">
                                  {med.current_stock}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Min
                                </p>

                                <p className="text-sm font-medium">
                                  {med.minimum_stock}
                                </p>
                              </div>
                            </div>

                            {/* Right */}
                            <div className="flex items-center gap-3">
                              <Badge
                                variant={isOut ? "destructive" : "secondary"}
                                className={`
                rounded-full
                px-3
                py-1
                text-xs
                font-medium
                ${
                  !isOut && isLow
                    ? "bg-yellow-100 text-yellow-700"
                    : !isOut
                      ? "bg-green-100 text-green-700"
                      : ""
                }
              `}
                              >
                                {isOut
                                  ? "Out of Stock"
                                  : isLow
                                    ? "Low Stock"
                                    : "Available"}
                              </Badge>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              size="lg"
              className="bg-accent hover:bg-accent/90 cursor-pointer text-primary font-black uppercase tracking-widest min-w-70 h-14 shadow-xl"
              disabled={isSubmitting || isSuccess || isVerified === false}
            >
              <Send className="h-4 w-4" />{" "}
              {isSubmitting ? "Finalizing..." : "Submit & Generate Receipt"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
