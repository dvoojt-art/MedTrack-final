"use client";

import { useState, useMemo, useRef } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
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
  Filter
} from "lucide-react";
import { useFirestore, useCollection } from "@/firebase";
import { collection, addDoc, serverTimestamp, deleteDoc, doc, query, orderBy, writeBatch } from "firebase/firestore";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DEPARTMENTS = [
  "North America (NAM)",
  "Asia Pacific (APAC)",
  "Finance",
  "HR",
  "General Services (GenServ)",
  "IT",
  "OJT"
];

const ORG_DOMAIN = "callboxinc.com";

export default function EmployeeMasterListPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    department: "",
    employeeId: "",
  });

  const employeesQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "employees"), orderBy("fullName", "asc"));
  }, [db]);

  const { data: employees, loading } = useCollection(employeesQuery);

  const validateEmail = (email: string) => {
    return email.toLowerCase().endsWith(`@${ORG_DOMAIN}`);
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    if (!validateEmail(formData.email)) {
      toast({
        title: "Domain Verification Failed",
        description: `Only users with @${ORG_DOMAIN} emails are authorized for the master list.`,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "employees"), {
        ...formData,
        status: "Active",
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Employee Added",
        description: `${formData.fullName} has been added to the Master List.`,
      });

      setFormData({ fullName: "", email: "", department: "", employeeId: "" });
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add employee to the system.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !db) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const batch = writeBatch(db);
      let count = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const [name, email, dept, id] = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
        
        if (name && email && validateEmail(email)) {
          const newDocRef = doc(collection(db, "employees"));
          batch.set(newDocRef, {
            fullName: name,
            email: email,
            department: dept || "General Services (GenServ)",
            employeeId: id || "",
            status: "Active",
            createdAt: serverTimestamp(),
          });
          count++;
        }
      }

      try {
        await batch.commit();
        toast({
          title: "Import Successful",
          description: `Successfully added ${count} verified personnel to the clinical list.`,
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "There was an error processing the CSV file.",
          variant: "destructive"
        });
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const removeEmployee = async (id: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, "employees", id));
      toast({
        title: "Employee Removed",
        description: "Record deleted from the master list.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove employee.",
        variant: "destructive"
      });
    }
  };

  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    return employees.filter(emp => {
      const matchesSearch = 
        emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDept = deptFilter === "All" || emp.department === deptFilter;
      
      return matchesSearch && matchesDept;
    });
  }, [employees, searchTerm, deptFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight text-accent uppercase">Clinical Directory</h1>
          <p className="text-muted-foreground mt-1">Personnel authorized for medicine acquisition.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />
          <Button 
            variant="outline" 
            className="gap-2 border-slate-200 text-slate-600 font-bold uppercase text-[10px]"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Import CSV
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-primary text-accent hover:bg-primary/90 font-bold uppercase text-[10px]">
                <UserPlus className="h-4 w-4" /> Register Personnel
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleAddEmployee}>
                <DialogHeader>
                  <DialogTitle className="font-headline text-accent uppercase tracking-tight">New Verified Employee</DialogTitle>
                  <DialogDescription>
                    Add a staff member to the facility's clinical directory.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Full Name</Label>
                    <Input 
                      placeholder="e.g. Juan Dela Cruz" 
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Work Email (@{ORG_DOMAIN})</Label>
                    <Input 
                      type="email" 
                      placeholder={`username@${ORG_DOMAIN}`} 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className={formData.email && !validateEmail(formData.email) ? "border-destructive ring-destructive/20" : ""}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">ID Number</Label>
                      <Input 
                        placeholder="Optional" 
                        value={formData.employeeId}
                        onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Department</Label>
                      <Select value={formData.department} onValueChange={(val) => setFormData({...formData, department: val})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Dept" />
                        </SelectTrigger>
                        <SelectContent>
                          {DEPARTMENTS.map((dept) => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full bg-accent text-primary font-black uppercase tracking-widest" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Save"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 space-y-2">
          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Global Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, email or ID..."
              className="pl-10 h-10 border-slate-200 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="w-full sm:w-[240px] space-y-2">
          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Dept Filter</Label>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="h-10 bg-white border-slate-200">
              <div className="flex items-center gap-2">
                <Filter className="h-3 w-3 text-slate-400" />
                <SelectValue placeholder="All Departments" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Departments</SelectItem>
              {DEPARTMENTS.map((dept) => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">Identity</TableHead>
                <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">Department</TableHead>
                <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-wider text-center">Employee ID</TableHead>
                <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-wider text-center">Status</TableHead>
                <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-wider text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => (
                  <TableRow key={emp.id} className="hover:bg-primary/5 transition-colors group">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{emp.fullName}</span>
                        <span className="text-xs text-slate-500 font-medium">{emp.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-bold text-[10px] uppercase bg-slate-100 text-slate-600 border-none">
                        {emp.department}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs text-slate-500">
                      {emp.employeeId || "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-emerald-600 uppercase">
                        <CheckCircle2 className="h-3 w-3" /> Verified
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeEmployee(emp.id)}
                        className="text-slate-400 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center">
                    {loading ? (
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="text-xs font-bold uppercase tracking-widest">Accessing Directory...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <Contact2 className="h-10 w-10 opacity-20" />
                        <p className="font-medium italic">No personnel found matching current filters.</p>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
      
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-start gap-3">
        <FileSpreadsheet className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
        <div className="text-[10px] text-slate-500 font-medium uppercase leading-relaxed tracking-wider">
          <p className="font-bold text-slate-700 mb-1">CSV Import Format:</p>
          <p>[Full Name], [Email], [Department], [Employee ID]</p>
          <p>Strict @{ORG_DOMAIN} validation enforced for all entries.</p>
        </div>
      </div>
    </div>
  );
}