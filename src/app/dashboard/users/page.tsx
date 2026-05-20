
"use client";

import { useState, useMemo } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  UserPlus, 
  ShieldCheck, 
  Mail, 
  Trash2,
  ShieldAlert,
  Lock,
  Loader2,
  Users as UsersIcon
} from "lucide-react";
import { useFirestore, useCollection } from "@/firebase";
import { collection, addDoc, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function UserManagementPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "Clinic Staff",
  });

  const adminsQuery = useMemo(() => {
    if (!db) return null;
    return collection(db, "admins");
  }, [db]);

  const { data: admins, loading } = useCollection(adminsQuery);

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    if (!formData.fullName || !formData.email || !formData.password) {
      toast({
        title: "Validation Error",
        description: "All fields including password are required.",
        variant: "destructive"
      });
      return;
    }

    const adminDataToSave = {
      ...formData,
      status: "Active",
      addedAt: serverTimestamp(),
    };

    // 1. Immediate UI update (Optimistic)
    setFormData({ fullName: "", email: "", password: "", role: "Clinic Staff" });
    setIsDialogOpen(false);
    
    toast({
      title: "Registration Initiated",
      description: `${adminDataToSave.fullName} is being registered. Access will be available shortly.`,
    });

    // 2. Background Firestore call without await for faster feedback
    addDoc(collection(db, "admins"), adminDataToSave)
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: "admins",
          operation: "create",
          requestResourceData: adminDataToSave,
        });
        errorEmitter.emit("permission-error", permissionError);
      });
  };

  const removeAdmin = (id: string) => {
    if (!db) return;
    
    // Background delete without await
    deleteDoc(doc(db, "admins", id))
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: `admins/${id}`,
          operation: "delete",
        });
        errorEmitter.emit("permission-error", permissionError);
      });

    // Immediate feedback
    toast({
      title: "Access Revoked",
      description: "User access is being removed.",
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight text-primary">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage all system administrators and staff permissions.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" /> Register System Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddAdmin}>
              <DialogHeader>
                <DialogTitle>Add System Administrator</DialogTitle>
                <DialogDescription>
                  Credentials created here will be required for dashboard access.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input 
                    id="fullName" 
                    placeholder="Enter full name" 
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="e.g. admin@callboxinc.com" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Login Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="password" 
                      type="password"
                      className="pl-9"
                      placeholder="Assign secure password" 
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Permission Role</Label>
                  <Select value={formData.role} onValueChange={(val) => setFormData({...formData, role: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Super Admin">Super Admin</SelectItem>
                      <SelectItem value="Clinic Staff">Clinic Staff</SelectItem>
                      <SelectItem value="HR Viewer">HR Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full">
                  Register & Grant Access
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b">
            <div className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Registered Access List</CardTitle>
            </div>
            <CardDescription>Active personnel authorized to view clinical records.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-bold">Identity</TableHead>
                    <TableHead className="font-bold">Role</TableHead>
                    <TableHead className="font-bold text-center">Status</TableHead>
                    <TableHead className="font-bold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins && admins.length > 0 ? (
                    admins.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-primary">{admin.fullName}</span>
                            <span className="text-xs text-muted-foreground">{admin.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal border-primary/20">
                            {admin.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">
                            {admin.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => removeAdmin(admin.id)}>
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                        No administrators registered. System is currently in bootstrap mode.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5" /> 
                System Access
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-4">
              <p className="opacity-90 leading-relaxed">
                All administrators managed here can log in via the primary security portal.
              </p>
              <div className="pt-2">
                <p className="font-bold mb-1">Security Standards:</p>
                <ul className="list-disc pl-4 space-y-1 opacity-80">
                  <li>Real-time database verification.</li>
                  <li>Instant access revocation.</li>
                  <li>Role-based dashboard visibility.</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm border-l-4 border-l-amber-500 bg-amber-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
                <ShieldAlert className="h-4 w-4" /> Management Policy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[10px] text-amber-800/80 leading-relaxed">
                Ensure at least one "Super Admin" is registered before removing all other access points. Deleting your own account will result in session termination.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
