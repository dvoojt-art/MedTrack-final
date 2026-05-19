
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
  Loader2
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

  const handleAddAdmin = async (e: React.FormEvent) => {
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

    setIsSubmitting(true);

    const newAdmin = {
      ...formData,
      status: "Active",
      addedAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, "admins"), newAdmin);
      toast({
        title: "Admin Registered",
        description: `${formData.fullName} can now log in using their email.`,
      });
      setFormData({ fullName: "", email: "", password: "", role: "Clinic Staff" });
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not add administrator at this time.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeAdmin = async (id: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, "admins", id));
      toast({
        title: "Access Revoked",
        description: "Administrator access has been removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not remove administrator.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight text-primary">User Management</h1>
          <p className="text-muted-foreground mt-1">Register new administrators and manage system access.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" /> Register New Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddAdmin}>
              <DialogHeader>
                <DialogTitle>Register New Administrator</DialogTitle>
                <DialogDescription>
                  This will create credentials for dashboard access.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input 
                    id="fullName" 
                    placeholder="Jane Smith" 
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address (Login ID)</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="staff@callboxinc.com" 
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
                      placeholder="Create secure password" 
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">System Role</Label>
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
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Register & Grant Access"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b">
            <CardTitle className="text-lg">Authorized Administrators</CardTitle>
            <CardDescription>Users with active credentials for this portal.</CardDescription>
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
                    <TableHead className="font-bold">Name & Email</TableHead>
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
                            <span className="font-medium">{admin.fullName}</span>
                            <span className="text-xs text-muted-foreground">{admin.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {admin.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
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
                        No additional administrators registered yet.
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
                Access Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-4">
              <p className="opacity-90 leading-relaxed">
                When you register a user here, they can immediately log in using their **Email** and the **Password** you assign.
              </p>
              <div className="pt-2">
                <p className="font-bold mb-1">Security Standards:</p>
                <ul className="list-disc pl-4 space-y-1 opacity-80">
                  <li>Credentials are stored in Firestore.</li>
                  <li>Roles determine dashboard permissions.</li>
                  <li>Accounts can be revoked at any time.</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm border-l-4 border-l-destructive bg-destructive/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                <ShieldAlert className="h-4 w-4" /> Access Policy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Only "Super Admin" users can register new accounts. All login attempts are recorded for auditing purposes.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
