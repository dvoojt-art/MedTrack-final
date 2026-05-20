
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Send, Stethoscope, Home, CheckCircle2 } from "lucide-react";
import { ReceiptView } from "@/components/records/receipt-view";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

const DEPARTMENTS = [
  "North America (NAM)",
  "Asia Pacific (APAC)",
  "Finance",
  "HR",
  "General Services (GenServ)",
  "IT",
  "OJT"
];

export default function PublicPortalPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const [showReceipt, setShowReceipt] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const isMedicinesValid = medicines.every(m => m.name.trim() !== "" && m.dosage.trim() !== "" && m.quantity > 0);
    const isFormValid = 
      formData.name.trim() !== "" && 
      formData.email.trim() !== "" && 
      formData.age.trim() !== "" && 
      formData.department !== "" && 
      formData.chiefComplaints.trim() !== "";

    if (!isFormValid || !isMedicinesValid) {
      toast({
        title: "Incomplete Form",
        description: "Please fill in all employee and medicine details before recording.",
        variant: "destructive"
      });
      return;
    }

    if (!db) return;
    setIsSubmitting(true);

    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().slice(0, 5);

    const record = {
      ...formData,
      date,
      time,
      age: parseInt(formData.age) || 0,
      medicineTaken: medicines,
      createdAt: serverTimestamp(),
    };

    // Optimistic background save
    addDoc(collection(db, "issuances"), record)
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: "issuances",
          operation: "create",
          requestResourceData: record,
        });
        errorEmitter.emit("permission-error", permissionError);
      });

    // Immediate feedback
    setSubmittedRecord(record);
    setIsSuccess(true);
    setIsSubmitting(false);

    setTimeout(() => {
      setIsSuccess(false);
      setShowReceipt(true);
      toast({
        title: "Record Saved",
        description: "Medicine distribution successfully logged in the system.",
      });
    }, 700);
  };

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
          <p className="mt-4 text-xl font-bold text-slate-800">Record Logged!</p>
        </div>
      )}

      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-accent rounded-lg flex items-center justify-center text-primary">
            <Stethoscope className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold text-slate-700 font-headline">Clinic Entry Portal</h1>
        </div>
        <Button variant="ghost" size="sm" asChild className="text-accent hover:text-primary font-bold">
          <Link href="/" className="gap-2">
            <Home className="h-4 w-4" /> Exit to Home
          </Link>
        </Button>
      </header>

      <main className="max-w-4xl mx-auto p-6 md:p-10 w-full flex-1">
        <div className="mb-8 animate-in fade-in slide-in-from-left-4 duration-500">
          <h2 className="text-3xl font-bold font-headline tracking-tight text-slate-800">New Medicine Distribution</h2>
          <p className="text-slate-500 mt-1 text-lg">Enter employee and medicine details for the record.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          <div className="grid grid-cols-1 gap-6">
            <Card className="border-none shadow-sm overflow-hidden bg-white">
              <CardHeader className="bg-slate-50 border-b">
                <CardTitle className="text-lg font-headline text-slate-700">Personal Details</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-600">Full Name</Label>
                    <Input 
                      id="name" 
                      placeholder="e.g. Juan Dela Cruz" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-600">Work Email</Label>
                    <Input 
                      id="email" 
                      type="email"
                      placeholder="employee@callboxinc.com" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age" className="text-slate-600">Age</Label>
                    <Input 
                      id="age" 
                      type="number" 
                      placeholder="Years" 
                      value={formData.age}
                      onChange={(e) => setFormData({...formData, age: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-slate-600">Gender</Label>
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
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm overflow-hidden bg-white">
              <CardHeader className="bg-slate-50 border-b">
                <CardTitle className="text-lg font-headline text-slate-700">Employment Information</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-slate-600">Department</Label>
                    <Select value={formData.department} onValueChange={(val) => setFormData({...formData, department: val})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="pt-2">
                  <Label htmlFor="complaints" className="text-slate-600">Chief Complaints / Symptoms</Label>
                  <Textarea 
                    id="complaints" 
                    placeholder="Briefly describe what the employee is feeling..." 
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
                <CardTitle className="text-lg font-headline text-slate-700">Medicine Issued</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addMedicine} className="gap-2 border-slate-200">
                  <Plus className="h-4 w-4" /> Add Item
                </Button>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {medicines.map((med, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-50 relative border border-slate-100 animate-in fade-in duration-300">
                    <div className="sm:col-span-2 space-y-2">
                      <Label className="text-slate-500">Medicine Name</Label>
                      <Input 
                        placeholder="e.g. Paracetamol" 
                        value={med.name}
                        onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                        required
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-500">Quantity</Label>
                      <Input 
                        type="number" 
                        value={med.quantity}
                        min={1}
                        onChange={(e) => updateMedicine(index, 'quantity', parseInt(e.target.value))}
                        required
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-500">Dosage</Label>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="e.g. 500mg" 
                          value={med.dosage}
                          onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                          required
                          className="bg-white"
                        />
                        {medicines.length > 1 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="text-slate-400 hover:text-destructive shrink-0"
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
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" size="lg" className="bg-accent hover:bg-accent/90 text-primary gap-2 min-w-[240px] shadow-lg shadow-slate-200" disabled={isSubmitting || isSuccess}>
              <Send className="h-4 w-4" /> {isSubmitting ? "Recording..." : "Record & Print Receipt"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
