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
  Trash2,
  ShieldAlert,
  Lock,
  Users as UsersIcon,
  Eye,
  EyeOff
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

const ORG_DOMAIN = "callboxinc.com";

export default function UserManagementPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

    if (!formData.email.toLowerCase().endsWith(`@${ORG_DOMAIN}`)) {
      toast({
        title: "Unauthorized Domain",
        description: `Only users with @${ORG_DOMAIN} emails can be registered as system admins.`,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "admins"), {
        ...formData,
        status: "Active",
        addedAt: serverTimestamp(),
      });

      toast({
        title: "Admin Registered",
        description: `${formData.fullName} has been granted dashboard access.`,
      });

      setFormData({ fullName: "", email: "", password: "", role: "Clinic Staff" });
      setIsDialogOpen(false);
      setShowPassword(false);
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "Could not create administrator account.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(true);
    }
  };

  const removeAdmin = async (id: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, "admins", id));
      toast({
        title: "Access Revoked",
        description: "User has been removed from the system.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to revoke user access.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight text-accent uppercase">Access Control</h1>
          <p className="text-muted-foreground mt-1">Manage personnel authorized to access the clinical dashboard.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-accent text-primary hover:bg-accent/90 font-bold uppercase text-[10px]">
              <UserPlus className="h-4 w-4" /> Grant Access
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddAdmin}>
              <DialogHeader>
                <DialogTitle className="font-headline text-accent uppercase">Register System Admin</DialogTitle>
                <DialogDescription>
                  Provide clinical credentials for dashboard access.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Full Name</Label>
                  <Input 
                    placeholder="Enter full name" 
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Work Email (@{ORG_DOMAIN})</Label>
                  <Input 
                    type="email" 
                    placeholder={`admin@${ORG_DOMAIN}`} 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Login Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type={showPassword ? "text" : "password"}
                      className="pl-9 pr-10"
                      placeholder="Assign secure password" 
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Permission Role</Label>
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
                <Button type="submit" className="w-full bg-accent text-primary font-black uppercase tracking-widest" disabled={isSubmitting}>
                  Register & Grant Access
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 border-none shadow-sm overflow-hidden bg-white">
          <div className="p-4 border-b flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-accent" />
            <h3 className="font-bold text-accent uppercase text-xs">Authorized Dashboard Users</h3>
          </div>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold text-slate-600 uppercase text-[10px]">Identity</TableHead>
                <TableHead className="font-bold text-slate-600 uppercase text-[10px]">Role</TableHead>
                <TableHead className="font-bold text-slate-600 uppercase text-[10px] text-center">Status</TableHead>
                <TableHead className="font-bold text-slate-600 uppercase text-[10px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins && admins.length > 0 ? (
                admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{admin.fullName}</span>
                        <span className="text-xs text-muted-foreground">{admin.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-bold text-[10px] uppercase border-accent/20 text-accent">
                        {admin.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-bold text-[10px] uppercase">
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
                    {loading ? "Accessing Authorization List..." : "No administrators registered."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-accent text-primary p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-6 w-6" />
              <h3 className="text-lg font-black uppercase tracking-tight">Security Protocol</h3>
            </div>
            <p className="text-xs font-medium opacity-90 leading-relaxed uppercase tracking-wider">
              Access is restricted to verified organization personnel. Ensure one Super Admin remains registered at all times.
            </p>
          </Card>

          <Card className="border-none shadow-sm border-l-4 border-l-amber-500 bg-amber-50 p-6">
            <div className="flex items-center gap-2 mb-2 text-amber-700">
              <ShieldAlert className="h-4 w-4" />
              <h4 className="text-xs font-black uppercase tracking-widest">Management Policy</h4>
            </div>
            <p className="text-[10px] text-amber-800/80 font-bold uppercase leading-relaxed tracking-widest">
              DashBoard accounts are for administrative staff only. Do not add general employees here; use the Clinical Directory instead.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}