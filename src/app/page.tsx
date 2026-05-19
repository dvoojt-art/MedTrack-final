
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Send, Stethoscope, ShieldCheck, CheckCircle2 } from "lucide-react";
import { ReceiptView } from "@/components/records/receipt-view";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function PublicEntryPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const [showReceipt, setShowReceipt] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
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
    
    if (!formData.name || !formData.department || medicines.some(m => !m.name)) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
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

    addDoc(collection(db, "issuances"), record)
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: "issuances",
          operation: "create",
          requestResourceData: record,
        });
        errorEmitter.emit("permission-error", permissionError);
      });

    setSubmittedRecord(record);
    
    // Trigger success animation
    setIsSuccess(true);
    setIsSubmitting(false);

    // Transition to receipt after short delay
    setTimeout(() => {
      setIsSuccess(false);
      setShowReceipt(true);
      toast({
        title: "Log Recorded",
        description: "Medicine issuance has been successfully logged.",
      });
    }, 1200);
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
    <div className="min-h-screen bg-slate-50 relative">
      {isSuccess && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-full shadow-2xl border border-accent/20 animate-in zoom-in-50 duration-500">
            <CheckCircle2 className="h-20 w-20 text-accent animate-bounce" />
          </div>
          <p className="mt-4 text-xl font-bold text-primary animate-pulse">Record Logged!</p>
        </div>
      )}

      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-primary rounded flex items-center justify-center text-white">
            <Stethoscope className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold text-primary font-headline">Callbox Clinic Portal</h1>
        </div>
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-primary">
          <Link href="/login" className="gap-2">
            <ShieldCheck className="h-4 w-4" /> Admin Access
          </Link>
        </Button>
      </header>

      <main className="max-w-4xl mx-auto p-6 md:p-10">
        <div className="mb-8">
          <h2 className="text-3xl font-bold font-headline tracking-tight text-primary">Medicine Issuance Log</h2>
          <p className="text-muted-foreground mt-1">Please fill in the employee details. Date and time are recorded automatically.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-headline text-primary">Employee Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      placeholder="Enter name..." 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input 
                        id="age" 
                        type="number" 
                        placeholder="Years" 
                        value={formData.age}
                        onChange={(e) => setFormData({...formData, age: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select value={formData.department} onValueChange={(val) => setFormData({...formData, department: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Customer Support">Customer Support</SelectItem>
                      <SelectItem value="IT Support">IT Support</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="Human Resources">Human Resources</SelectItem>
                      <SelectItem value="Quality Assurance">Quality Assurance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="complaints">Symptoms / Chief Complaints</Label>
                  <Textarea 
                    id="complaints" 
                    placeholder="Describe symptoms briefly..." 
                    className="min-h-[80px]"
                    value={formData.chiefComplaints}
                    onChange={(e) => setFormData({...formData, chiefComplaints: e.target.value})}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-headline text-primary">Medicine Taken</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addMedicine} className="gap-2">
                  <Plus className="h-4 w-4" /> Add Item
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {medicines.map((med, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-50 relative animate-in fade-in duration-300">
                    <div className="sm:col-span-2 space-y-2">
                      <Label>Medicine Name</Label>
                      <Input 
                        placeholder="e.g. Paracetamol" 
                        value={med.name}
                        onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input 
                        type="number" 
                        value={med.quantity}
                        min={1}
                        onChange={(e) => updateMedicine(index, 'quantity', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Dosage</Label>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="e.g. 500mg" 
                          value={med.dosage}
                          onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                        />
                        {medicines.length > 1 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive shrink-0"
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
            <Button type="submit" size="lg" className="bg-primary gap-2 min-w-[220px]" disabled={isSubmitting || isSuccess}>
              <Send className="h-4 w-4" /> {isSubmitting ? "Recording..." : "Record Distribution"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
