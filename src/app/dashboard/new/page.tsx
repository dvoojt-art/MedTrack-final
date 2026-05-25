"use client";

import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Trash2,
  ArrowLeft,
  Send,
  CheckCircle2,
  UserCheck,
  UserX,
} from "lucide-react";
import { ReceiptView } from "@/components/records/receipt-view";
import { useToast } from "@/hooks/use-toast";

const ORG_DOMAIN = "callboxinc.com";

export default function NewRecordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [showReceipt, setShowReceipt] = useState(false);
  type Medicine = {
    name: string;
    quantity: number;
    dosage: string;
  };

  type IssuanceRecord = {
    id: string;
    name: string;
    email: string;
    age: number;
    gender: string;
    department: string;
    chiefComplaints: string;
    medicineTaken: Medicine[];
    date: string;
    time: string;
    createdAt: string;
  };

  const [submittedRecord, setSubmittedRecord] = useState<IssuanceRecord | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: "",
    gender: "Male",
    department: "",
    chiefComplaints: "",
  });

  const [medicines, setMedicines] = useState([
    { name: "", quantity: 1, dosage: "" },
  ]);

  // Personnel Verification logic using Local Storage
  useEffect(() => {
    if (
      formData.email.length < 5 ||
      !formData.email.endsWith(`@${ORG_DOMAIN}`)
    ) {
      setIsVerified(null);
      return;
    }

    const verifyEmployee = async () => {
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
    };

    const timer = setTimeout(verifyEmployee, 400);

    return () => clearTimeout(timer);
  }, [formData.email]);

  const addMedicine = () => {
    setMedicines([...medicines, { name: "", quantity: 1, dosage: "" }]);
  };

  const removeMedicine = (index: number) => {
    if (medicines.length === 1) return;
    const newMedicines = [...medicines];
    newMedicines.splice(index, 1);
    setMedicines(newMedicines);
  };

  const updateMedicine = (
    index: number,
    field: string,
    value: string | number,
  ) => {
    const newMedicines = [...medicines];
    newMedicines[index] = { ...newMedicines[index], [field]: value };
    setMedicines(newMedicines);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isVerified) {
      toast({
        title: "Personnel Not Found",
        description: "The patient is not registered in the Master List.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const now = new Date();

    const { data, error } = await supabase
      .from("issuances")
      .insert({
        name: formData.name,
        email: formData.email,
        age: Number(formData.age),
        gender: formData.gender,
        department: formData.department,
        chief_complaints: formData.chiefComplaints,
        medicine_taken: medicines,
        date: now.toISOString().split("T")[0],
        time: now.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Database Error",
        description: error.message,
        variant: "destructive",
      });

      setIsSubmitting(false);
      return;
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
      date: new Date(data.created_at).toLocaleDateString(),
      time: new Date(data.created_at).toLocaleTimeString(),
    };

    setSubmittedRecord(record);
    setIsSuccess(true);
    setIsSubmitting(false);

    setTimeout(() => {
      setIsSuccess(false);
      setShowReceipt(true);

      toast({
        title: "Log Success",
        description: "Clinical record finalized.",
      });
    }, 1200);
  };

  if (showReceipt && submittedRecord) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-6 animate-in zoom-in-95 duration-500">
        <ReceiptView
          record={submittedRecord}
          onClose={() => router.push("/dashboard/records")}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      {isSuccess && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-full shadow-2xl border border-accent/20 animate-in zoom-in-50 duration-500">
            <CheckCircle2 className="h-16 w-16 text-accent animate-bounce" />
          </div>
          <p className="mt-4 text-lg font-bold text-primary">Log Finalized</p>
        </div>
      )}

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight text-accent uppercase tracking-tighter">
            Clinical Manual Log
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">
            Capture medicine issuance for verified personnel.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-sm font-black uppercase text-accent tracking-widest">
                Personnel Identification
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">
                      Work Email (@{ORG_DOMAIN})
                    </Label>
                    <div className="relative">
                      <Input
                        type="email"
                        placeholder={`employee@${ORG_DOMAIN}`}
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className={
                          isVerified === false
                            ? "border-destructive ring-destructive/20"
                            : ""
                        }
                        required
                      />
                      <div className="absolute right-3 top-3">
                        {isVerified === true && (
                          <UserCheck className="h-4 w-4 text-emerald-500" />
                        )}
                        {isVerified === false && (
                          <UserX className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    </div>
                    {isVerified === false && (
                      <p className="text-[10px] font-bold text-destructive uppercase tracking-widest">
                        Not found in clinical directory
                      </p>
                    )}
                    {isVerified === true && (
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Personnel Verified
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">
                      Full Name
                    </Label>
                    <Input
                      placeholder="Identified automatically"
                      value={formData.name}
                      readOnly
                      className="bg-slate-50 cursor-not-allowed font-bold"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">
                      Department
                    </Label>
                    <Input
                      placeholder="Department detected"
                      value={formData.department}
                      readOnly
                      className="bg-slate-50 cursor-not-allowed font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">
                      Age
                    </Label>
                    <Input
                      type="number"
                      placeholder="Years"
                      value={formData.age}
                      onChange={(e) =>
                        setFormData({ ...formData, age: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">
                  Chief Complaints
                </Label>
                <Textarea
                  placeholder="Describe patient symptoms..."
                  className="min-h-[100px] border-slate-200"
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

          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black uppercase text-accent tracking-widest">
                Clinical Distribution
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMedicine}
                className="gap-2 border-slate-200 text-[10px] font-bold uppercase"
              >
                <Plus className="h-3 w-3" /> Add Item
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {medicines.map((med, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-50 relative animate-in fade-in duration-300 border border-slate-100"
                  >
                    <div className="sm:col-span-2 space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">
                        Medicine
                      </Label>
                      <Input
                        placeholder="e.g. Paracetamol"
                        value={med.name}
                        onChange={(e) =>
                          updateMedicine(index, "name", e.target.value)
                        }
                        className="bg-white"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">
                        Qty
                      </Label>
                      <Input
                        type="number"
                        value={med.quantity}
                        min={1}
                        onChange={(e) =>
                          updateMedicine(
                            index,
                            "quantity",
                            parseInt(e.target.value),
                          )
                        }
                        className="bg-white"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">
                        Dosage
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="500mg"
                          value={med.dosage}
                          onChange={(e) =>
                            updateMedicine(index, "dosage", e.target.value)
                          }
                          className="bg-white"
                          required
                        />
                        {medicines.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-slate-300 hover:text-destructive shrink-0"
                            onClick={() => removeMedicine(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end mt-8">
          <Button
            type="submit"
            size="lg"
            className="bg-accent text-primary font-black uppercase tracking-widest min-w-[240px] shadow-lg shadow-accent/20"
            disabled={isSubmitting || isSuccess}
          >
            <Send className="h-4 w-4" />{" "}
            {isSubmitting ? "Finalizing..." : "Submit Log & Print Receipt"}
          </Button>
        </div>
      </form>
    </div>
  );
}
