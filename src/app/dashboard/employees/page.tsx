"use client";

import { useState, useMemo } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  AlertCircle 
} from "lucide-react";
import { useFirestore, useCollection } from "@/firebase";
import { collection, addDoc, serverTimestamp, deleteDoc, doc, query, orderBy } from "firebase/firestore";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    return employees.filter(emp => 
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight text-accent">Employee Master List</h1>
          <p className="text-muted-foreground mt-1">Verified personnel directory for clinical reference.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary text-accent hover:bg-primary/90">
              <UserPlus className="h-4 w-4" /> Add Verified Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddEmployee}>
              <DialogHeader>
                <DialogTitle className="font-headline text-accent">Register New Employee</DialogTitle>
                <DialogDescription>
                  Add a verified staff member to the facility's clinical master list.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-xs font-bold uppercase text-slate-500">Full Name</Label>
                  <Input 
                    id="fullName" 
                    placeholder="e.g. Juan Dela Cruz" 
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold uppercase text-slate-500">Work Email (@{ORG_DOMAIN})</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder={`username@${ORG_DOMAIN}`} 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className={formData.email && !validateEmail(formData.email) ? "border-destructive ring-destructive/20" : ""}
                    required
                  />
                  {formData.email && !validateEmail(formData.email) && (
                    <p className="text-[10px] font-bold text-destructive uppercase flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Requires official @{ORG_DOMAIN} address
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employeeId" className="text-xs font-bold uppercase text-slate-500">Employee ID</Label>
                    <Input 
                      id="employeeId" 
                      placeholder="Optional" 
                      value={formData.employeeId}
                      onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-xs font-bold uppercase text-slate-500">Department</Label>
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
                <Button type="submit" className="w-full bg-accent text-primary font-bold" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Add to Master List"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <CardHeader className="bg-slate-50 border-b p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, email, ID or department..."
              className="pl-10 h-10 border-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">Identity</TableHead>
                  <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">Department</TableHead>
                  <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-wider text-center">ID</TableHead>
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
                          <p className="font-medium italic">No verified personnel found matching your search.</p>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
