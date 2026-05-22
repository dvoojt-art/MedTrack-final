
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Send, Stethoscope, Home, CheckCircle2, UserCheck, UserX, AlertCircle } from "lucide-react";
import { ReceiptView } from "@/components/records/receipt-view";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

const ORG_DOMAIN = "callboxinc.com";

export default function PublicPortalPage() {
  const { toast } = useToast();
  const [showReceipt, setShowReceipt] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: "",
    gender: "Male",
    department: "",
    chiefComplaints: "",
  });

  const [medicines, setMedicines] = useState([
    { name: "", quantity: 1, dosage: "" }
  ]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Personnel Verification logic
  useEffect(() => {
    if (!isMounted || formData.email.length < 5 || !formData.email.endsWith(`@${ORG_DOMAIN}`)) {
      setIsVerified(null);
      return;
    }

    const checkEmployee = () => {
      const storedEmployees = JSON.parse(localStorage.getItem("medtrack_employees") || "[]");
      const found = storedEmployees.find((e: any) => e.email.toLowerCase() === formData.email.toLowerCase());
      
      if (found) {
        setFormData(prev => ({
          ...prev,
          name: found.fullName,
          department: found.department
        }));
        setIsVerified(true);
      } else {
        setIsVerified(false);
      }
    };

    const timer = setTimeout(checkEmployee, 400);
    return () => clearTimeout(timer);
  }, [formData.email, isMounted]);

  const addMedicine = () => {
    setMedicines([...medicines, { name: "", quantity: 1, dosage: "" }]);
  };

  const removeMedicine = (index: number) => {
    if (medicines.length === 1) return;
    const newMedicines = [...medicines];
    newMedicines.splice(index, 1);
    setMedicines(newMedicines);
  };

  const updateMedicine = (index: number, field: string, value: string | number) => {
    const newMedicines = [...medicines];
    newMedicines[index] = { ...newMedicines[index], [field]: value };
    setMedicines(newMedicines);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isVerified) {
      toast({
        title: "Personnel Not Registered",
        description: `Your @${ORG_DOMAIN} account is not found in the verified personnel list.`,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().slice(0, 5);

    const record = {
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
      date,
      time,
      age: parseInt(formData.age) || 0,
      medicineTaken: medicines,
      createdAt: new Date().toISOString(),
    };

    const existingLogs = JSON.parse(localStorage.getItem("medtrack_issuances") || "[]");
    localStorage.setItem("medtrack_issuances", JSON.stringify([...existingLogs, record]));

    setSubmittedRecord(record);
    setIsSuccess(true);
    setIsSubmitting(false);

    setTimeout(() => {
      setIsSuccess(false);
      setShowReceipt(true);
      toast({
        title: "Log Finalized",
        description: "Record successfully captured in system.",
      });
    }, 800);
  };

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
            setMedicines([{ name: "", quantity: 1, dosage: "" }]);
            setIsVerified(null);
          }} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {isSuccess && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-full shadow-2xl border border-slate-200 animate-in zoom-in-50 duration-500">
            <CheckCircle2 className="h-20 w-20 text-accent animate-bounce" />
          </div>
          <p className="mt-4 text-xl font-black uppercase text-slate-800 tracking-widest">Finalizing Entry...</p>
        </div>
      )}

      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 bg-accent rounded-xl flex items-center justify-center text-primary shadow-sm border border-accent/10">
            <Stethoscope className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-black text-slate-700 font-headline uppercase tracking-tighter">Clinical Log Portal</h1>
        </div>
        <Button variant="ghost" size="sm" asChild className="text-accent hover:text-primary font-bold uppercase text-[10px]">
          <Link href="/" className="gap-2">
            <Home className="h-4 w-4" /> Home
          </Link>
        </Button>
      </header>

      <main className="max-w-4xl mx-auto p-6 md:p-10 w-full flex-1">
        <div className="mb-8 animate-in fade-in slide-in-from-left-4 duration-500">
          <h2 className="text-3xl font-black font-headline tracking-tighter text-slate-800 uppercase">Employee Clinical Entry</h2>
          <p className="text-slate-500 mt-1 font-bold uppercase text-[10px] tracking-[0.2em]">Verified Facility Access Required</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-none shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-xs font-black uppercase text-slate-500 tracking-widest">Personnel Verification</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Work Email (@{ORG_DOMAIN})</Label>
                  <div className="relative">
                    <Input 
                      type="email"
                      placeholder={`username@${ORG_DOMAIN}`} 
                      className={`h-12 text-md transition-all ${isVerified === false ? "border-destructive ring-destructive/10" : "border-slate-200"}`}
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                    <div className="absolute right-3 top-3.5">
                      {isVerified === true && <UserCheck className="h-5 w-5 text-emerald-500" />}
                      {isVerified === false && <UserX className="h-5 w-5 text-destructive" />}
                    </div>
                  </div>
                  {isVerified === false && (
                    <p className="text-[10px] font-bold text-destructive uppercase tracking-widest flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Personnel not found in directory
                    </p>
                  )}
                  {isVerified === true && (
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Identified: {formData.name}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Identified Name</Label>
                  <Input 
                    value={formData.name || "Awaiting Verification..."} 
                    readOnly 
                    className="h-12 bg-slate-50 font-bold border-slate-100 text-slate-600" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Age</Label>
                  <Input 
                    type="number" 
                    placeholder="Years" 
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Gender</Label>
                  <Select value={formData.gender} onValueChange={(val) => setFormData({...formData, gender: val})}>
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
                  <Label className="text-[10px] font-black uppercase text-slate-400">Department</Label>
                  <Input 
                    value={formData.department || "—"} 
                    readOnly 
                    className="bg-slate-50 font-bold border-slate-100" 
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <Label className="text-[10px] font-black uppercase text-slate-400">Chief Complaints</Label>
                <Textarea 
                  placeholder="Describe current symptoms briefly..." 
                  className="min-h-[100px] mt-2 border-slate-200"
                  value={formData.chiefComplaints}
                  onChange={(e) => setFormData({...formData, chiefComplaints: e.target.value})}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-black uppercase text-slate-500 tracking-widest">Medical Distribution</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addMedicine} className="gap-2 border-slate-200 text-[10px] font-bold uppercase">
                <Plus className="h-4 w-4" /> Add Line
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {medicines.map((med, index) => (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-50 relative border border-slate-100">
                  <div className="sm:col-span-2 space-y-2">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase">Medicine</Label>
                    <Input 
                      placeholder="e.g. Paracetamol" 
                      value={med.name}
                      onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                      required
                      className="bg-white border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase">Qty</Label>
                    <Input 
                      type="number" 
                      value={med.quantity}
                      min={1}
                      onChange={(e) => updateMedicine(index, 'quantity', parseInt(e.target.value))}
                      required
                      className="bg-white border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase">Dosage</Label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="500mg" 
                        value={med.dosage}
                        onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                        required
                        className="bg-white border-slate-200"
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
            </CardContent>
          </Card>

          <div className="flex justify-end pt-4">
            <Button type="submit" size="lg" className="bg-accent hover:bg-accent/90 text-primary font-black uppercase tracking-widest min-w-[280px] h-14 shadow-xl" disabled={isSubmitting || isSuccess || isVerified === false}>
              <Send className="h-4 w-4" /> {isSubmitting ? "Finalizing..." : "Submit & Generate Receipt"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
