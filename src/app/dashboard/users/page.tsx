"use client";

import { supabase } from "@/lib/supabase";
import { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UserPlus,
  ShieldCheck,
  Trash2,
  ShieldAlert,
  Lock,
  Users as UsersIcon,
  Eye,
  EyeOff,
  Loader2,
  Edit,
  Info,
} from "lucide-react";
import type { AdminDbRow, AdminRecord } from "@/types/issuance";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const ORG_DOMAIN = "callboxinc.com";

export default function UserManagementPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] =
    useState(false);
  const [passwordAdmin, setPasswordAdmin] = useState<string | null>(null);
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isDeleteAdminDialogOpen, setIsDeleteAdminDialogOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<AdminRecord | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "Clinic Staff",
  });

  const [isEditAdminDialogOpen, setIsEditAdminDialogOpen] = useState(false);

  const [selectedAdmin, setSelectedAdmin] = useState<AdminRecord | null>(null);

  const [editAdminForm, setEditAdminForm] = useState({
    fullName: "",
    email: "",
    role: "",
    status: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleUpdateAdmin = async () => {
    if (!selectedAdmin) return;

    // Update Auth Email if changed
    if (
      editAdminForm.email.toLowerCase() !== selectedAdmin.email.toLowerCase()
    ) {
      const emailResponse = await fetch("/api/admin/update-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: selectedAdmin.userId,
          email: editAdminForm.email,
        }),
      });

      const emailResult = await emailResponse.json();

      if (!emailResponse.ok) {
        toast({
          title: "Email Update Failed",
          description: emailResult.error,
          variant: "destructive",
        });

        return;
      }
    }

    // Update Auth Password if provided
    if (editAdminForm.newPassword) {
      const response = await fetch("/api/admin/update-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: selectedAdmin.userId, // use userId
          password: editAdminForm.newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast({
          title: "Password Update Failed",
          description: result.error,
          variant: "destructive",
        });

        return;
      }
    }

    // Update Admin Table
    const { error } = await supabase
      .from("admins")
      .update({
        full_name: editAdminForm.fullName,
        email: editAdminForm.email,
        role: editAdminForm.role,
        status: editAdminForm.status,
      })
      .eq("id", selectedAdmin.id);

    if (error) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });

      return;
    }

    setAdmins((prev) =>
      prev.map((admin) =>
        admin.id === selectedAdmin.id
          ? {
              ...admin,
              fullName: editAdminForm.fullName,
              email: editAdminForm.email,
              role: editAdminForm.role,
              status: editAdminForm.status,
            }
          : admin,
      ),
    );

    toast({
      title: "Admin Updated",
      description:
        editAdminForm.newPassword || editAdminForm.email !== selectedAdmin.email
          ? "Administrator account and authentication details updated."
          : "Administrator information updated.",
    });

    setIsEditAdminDialogOpen(false);
  };

  useEffect(() => {
    const loadAdmins = async () => {
      const { data, error } = await supabase
        .from<AdminDbRow>("admins")
        .select("*")
        .order("added_at", { ascending: false });

      if (error) {
        toast({
          title: "Database Error",
          description: error.message,
          variant: "destructive",
        });

        setLoading(false);
        return;
      }
      const formattedAdmins = (data || [])
        .map((admin) => ({
          id: admin.id,
          userId: admin.user_id,
          fullName: admin.full_name,
          email: admin.email,
          role: admin.role,
          status: admin.status,
          addedAt: admin.added_at,
          isProtected: admin.is_protected,
        }))
        .sort((a, b) => {
          // Protected accounts always first
          if (a.isProtected && !b.isProtected) return -1;
          if (!a.isProtected && b.isProtected) return 1;

          // Then newest admins below
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
        });

      setAdmins(formattedAdmins);

      setLoading(false);
    };

    loadAdmins();
  }, [toast]);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email.toLowerCase().endsWith(`@${ORG_DOMAIN}`)) {
      toast({
        title: "Unauthorized Domain",
        description: `Only users with @${ORG_DOMAIN} emails can be registered as system admins.`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error);
      }

      setAdmins((prev) => [
        {
          id: result.admin.id,
          userId: result.admin.user_id,
          fullName: result.admin.full_name,
          email: result.admin.email,
          role: result.admin.role,
          status: result.admin.status,
          addedAt: result.admin.added_at,
          isProtected: result.admin.is_protected,
        },
        ...prev,
      ]);

      toast({
        title: "Admin Registered",
        description: `${formData.fullName} has been granted dashboard access.`,
      });

      setFormData({
        fullName: "",
        email: "",
        password: "",
        role: "Clinic Staff",
      });

      setShowPassword(false);
      setIsDialogOpen(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Registration Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeleteAdmin = async () => {
    if (!adminToDelete) return;

    // Protected account
    if (adminToDelete.isProtected) {
      toast({
        title: "Protected Account",
        description: "This administrator cannot be deleted.",
        variant: "destructive",
      });
      return;
    }

    const response = await fetch("/api/delete-admins", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: adminToDelete.id,
        user_id: adminToDelete.userId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      toast({
        title: "Deletion Failed",
        description: data.error,
        variant: "destructive",
      });
    } else {
      setAdmins((prev) =>
        prev.filter((admin) => admin.id !== adminToDelete.id),
      );

      toast({
        title: "Access Revoked",
        description: "User has been removed from the system.",
      });
    }

    setIsDeleteAdminDialogOpen(false);
    setAdminToDelete(null);
  };

  const handleChangePassword = async () => {
    if (!passwordAdmin) return;

    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/admin/update-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: selectedAdmin.userId,
          password: newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error);
      }

      toast({
        title: "Password Updated",
        description: "Administrator password has been updated successfully.",
      });

      setNewPassword("");
      setConfirmPassword("");
      setIsChangePasswordDialogOpen(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Update Failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="mb-8 animate-in fade-in slide-in-from-left-8 duration-700">
          <h1 className="text-3xl font-bold font-headline tracking-tight text-accent uppercase">
            Access Control
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage personnel authorized to access the clinical dashboard.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-accent text-primary hover:bg-accent/90 font-bold uppercase text-[10px]">
              <UserPlus className="h-4 w-4" />
              Grant Access
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-150 border-0 bg-white p-0 overflow-hidden rounded-4xl shadow-[0_25px_80px_rgba(0,0,0,0.18)]data-[state=open]:animate-[dialogPop_0.35s_cubic-bezier(0.34,1.56,0.64,1)]">
            {/* HEADER */}
            <div className="relative overflow-hidden bg-linear-to-br from-yellow-400 via-amber-300 to-yellow-500 px-8 py-7">
              <div className="absolute inset-0 bg-black/3" />

              <div className="relative flex items-start justify-between">
                <div>
                  <DialogHeader className="space-y-2">
                    <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-black tracking-tight">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black/10 backdrop-blur-sm">
                        <UserPlus className="h-5 w-5 text-black" />
                      </div>

                      <div className="flex flex-col">
                        <span>Grant Dashboard Access</span>
                      </div>
                    </DialogTitle>

                    <DialogDescription className="text-sm text-black/70">
                      Register a new administrator and assign access
                      permissions.
                    </DialogDescription>
                  </DialogHeader>
                </div>

                <div className="rounded-full border border-black/10 bg-white/30 px-3 py-1 text-xs font-semibold text-black backdrop-blur-sm">
                  User Management
                </div>
              </div>
            </div>

            {/* BODY */}
            <form onSubmit={handleAddAdmin}>
              <div className="px-8 py-7 space-y-6">
                {/* FULL NAME */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">
                    Full Name
                  </Label>

                  <Input
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fullName: e.target.value,
                      })
                    }
                    placeholder="Enter administrator full name"
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50/70"
                  />
                </div>

                {/* EMAIL */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">
                    Email Address
                  </Label>

                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email: e.target.value,
                      })
                    }
                    placeholder={`admin@${ORG_DOMAIN}`}
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50/70"
                  />
                </div>

                {/* PASSWORD */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">
                    Login Password
                  </Label>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />

                    <Input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          password: e.target.value,
                        })
                      }
                      placeholder="Assign secure password"
                      className="h-12 rounded-2xl border-slate-200 bg-slate-50/70 pl-11 pr-12"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* ROLE */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">
                    Permission Role
                  </Label>

                  <Select
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        role: value,
                      })
                    }
                  >
                    <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/70">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>

                    <SelectContent className="rounded-2xl">
                      <SelectItem value="Super Admin">Super Admin</SelectItem>

                      <SelectItem value="Clinic Staff">Clinic Staff</SelectItem>

                      <SelectItem value="HR Viewer">HR Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* SECURITY INFO */}
                <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
                      <ShieldAlert className="h-4 w-4 text-blue-700" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-blue-900">
                        Administrator Access
                      </p>

                      <p className="text-xs leading-relaxed text-blue-800">
                        Users granted access can log into the dashboard
                        according to their assigned role and permissions.
                      </p>
                    </div>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="h-11 rounded-2xl"
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-11 rounded-2xl linear-to-r from-yellow-400 to-amber-400 px-6 font-semibold text-black hover:from-yellow-500 hover:to-amber-500"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Grant Access"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 border-none shadow-sm overflow-hidden bg-white">
          <div className="p-4 border-b flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-accent" />
            <h3 className="font-bold text-accent uppercase text-xs">
              Authorized Dashboard Users
            </h3>
          </div>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold text-slate-600 uppercase text-[10px]">
                  Identity
                </TableHead>
                <TableHead className="font-bold text-slate-600 uppercase text-[10px]">
                  Role
                </TableHead>
                <TableHead className="font-bold text-slate-600 uppercase text-[10px] text-center">
                  Status
                </TableHead>
                <TableHead className="font-bold text-slate-600 uppercase text-[10px] text-right px-5">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins && admins.length > 0 ? (
                admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">
                          {admin.fullName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {admin.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="font-bold text-[10px] uppercase border-accent/20 text-accent"
                      >
                        {admin.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={`border-none font-bold text-[10px] uppercase px-3 py-1
      ${
        admin.status === "Active"
          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
          : "bg-red-100 text-red-700 hover:bg-red-100"
      }
    `}
                      >
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`h-1.5 w-1.5 rounded-full
          ${admin.status === "Active" ? "bg-emerald-500" : "bg-red-500"}
        `}
                          />

                          {admin.status}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* EDIT ADMIN */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedAdmin(admin);

                            setEditAdminForm({
                              fullName: admin.fullName || "",
                              email: admin.email || "",
                              role: admin.role || "",
                              status: admin.status || "Active",
                              newPassword: "",
                              confirmPassword: "",
                            });

                            setIsEditAdminDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 text-muted-foreground hover:text-blue-500" />
                        </Button>

                        {/* DELETE ADMIN */}
                        {!admin.isProtected && (
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setAdminToDelete({
                                id: admin.id,
                                userId: admin.userId,
                                isProtected: admin.isProtected,
                              });
                              setIsDeleteAdminDialogOpen(true);
                            }}
                            className="h-9 w-9 p-0 rounded-xl text-red-600 hover:bg-red-100 hover:text-red-700 transition-all cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-32 text-center text-muted-foreground"
                  >
                    {loading
                      ? "Accessing Authorization List..."
                      : "No administrators registered."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        <AlertDialog
          open={isDeleteAdminDialogOpen}
          onOpenChange={setIsDeleteAdminDialogOpen}
        >
          <AlertDialogContent className="animate-danger-dialog border-red-200">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently revoke this user's access and delete their
                account. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setAdminToDelete(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDeleteAdmin}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete User
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog
          open={isEditAdminDialogOpen}
          onOpenChange={setIsEditAdminDialogOpen}
        >
          <DialogContent
            className="
                w-[95vw]
                max-w-[95vw]
                sm:max-w-2xl
                md:max-w-3xl

                max-h-[90vh]
                overflow-y-auto

                border-0
                bg-white
                p-0
                overflow-hidden

                rounded-3xl
                sm:rounded-4xl

                shadow-[0_25px_80px_rgba(0,0,0,0.18)]

                data-[state=open]:animate-[dialogPop_0.35s_cubic-bezier(0.34,1.56,0.64,1)]
              "
          >
            {/* HEADER */}
            <div
              className="
                  relative overflow-hidden
                  bg-linear-to-br
                  from-yellow-400
                  via-amber-300
                  to-yellow-500

                  px-5 py-5
                  sm:px-8 sm:py-7
                "
            >
              <div className="absolute inset-0 bg-black/3" />

              <div className="relative flex items-start justify-between">
                <div>
                  <DialogHeader className="space-y-2">
                    <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-black tracking-tight">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black/10 backdrop-blur-sm">
                        <Edit className="h-5 w-5 text-black" />
                      </div>

                      <div className="flex flex-col">
                        <span>Edit Administrator</span>
                      </div>
                    </DialogTitle>
                    <DialogDescription className="text-sm text-black/70 mt-1">
                      Update administrator account details, permissions, and
                      access status.
                    </DialogDescription>
                  </DialogHeader>
                </div>

                <div className="rounded-full border border-black/10 bg-white/30 px-3 py-1 text-xs font-semibold text-black backdrop-blur-sm">
                  Admin Management
                </div>
              </div>
            </div>

            {/* BODY */}
            <div
              className="
                  px-4 py-5
                  sm:px-8 sm:py-7
                "
            >
              <div className="space-y-6">
                {/* FULL NAME */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">
                    Full Name
                  </Label>

                  <Input
                    value={editAdminForm.fullName || ""}
                    onChange={(e) =>
                      setEditAdminForm({
                        ...editAdminForm,
                        fullName: e.target.value,
                      })
                    }
                    placeholder="Enter administrator full name"
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50/70 px-4 text-sm shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-0"
                  />
                </div>

                {/* EMAIL */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">
                    Email Address
                  </Label>

                  <Input
                    type="email"
                    value={editAdminForm.email || ""}
                    onChange={(e) =>
                      setEditAdminForm({
                        ...editAdminForm,
                        email: e.target.value,
                      })
                    }
                    placeholder="Enter administrator email"
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50/70 px-4 text-sm shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-0"
                  />
                </div>

                {/* ROLE + STATUS */}
                <div
                  className="
                    grid
                    grid-cols-1
                    md:grid-cols-2
                    gap-4
                    md:gap-5
                  "
                >
                  {/* ROLE */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-semibold text-slate-700">
                        Role
                      </Label>

                      {selectedAdmin?.isProtected && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="text-amber-600 transition-colors hover:text-amber-700"
                            >
                              <Info className="h-4 w-4" />
                            </button>
                          </PopoverTrigger>

                          <PopoverContent className="w-72">
                            <div className="flex gap-3">
                              <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />

                              <div>
                                <p className="font-semibold text-sm">
                                  Protected Administrator
                                </p>

                                <p className="mt-1 text-xs text-muted-foreground">
                                  This administrator is a protected system
                                  account. Its role and status cannot be
                                  modified.
                                </p>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                    <Select>
                      <SelectTrigger
                        className={`h-12 rounded-2xl border-slate-200 bg-slate-50/70 shadow-sm focus:ring-2 focus:ring-yellow-400 ${
                          selectedAdmin?.isProtected
                            ? "cursor-not-allowed bg-slate-100 text-slate-500 opacity-80"
                            : ""
                        }`}
                      >
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>

                      <SelectContent className="rounded-2xl border-slate-200">
                        <SelectItem value="Super Admin">Super Admin</SelectItem>

                        <SelectItem value="HR Viewer">HR Viewer</SelectItem>

                        <SelectItem value="Clinic Staff">
                          Clinic Staff
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* STATUS */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-semibold text-slate-700">
                        Account Status
                      </Label>

                      {selectedAdmin?.isProtected && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="text-amber-600 hover:text-amber-700"
                            >
                              <Info className="h-4 w-4" />
                            </button>
                          </PopoverTrigger>

                          <PopoverContent className="w-64">
                            <div className="flex gap-2">
                              <ShieldCheck className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />

                              <div>
                                <p className="font-semibold text-sm">
                                  Protected Account
                                </p>

                                <p className="text-xs text-muted-foreground mt-1">
                                  This is a protected system administrator
                                  account. Its status cannot be modified.
                                </p>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                    <Select
                      value={editAdminForm.status || "Active"}
                      onValueChange={(value) =>
                        setEditAdminForm({
                          ...editAdminForm,
                          status: value,
                        })
                      }
                      disabled={selectedAdmin?.isProtected}
                    >
                      <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/70 shadow-sm focus:ring-2 focus:ring-yellow-400">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>

                      <SelectContent className="rounded-2xl border-slate-200">
                        <SelectItem value="Active">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                            Active
                          </div>
                        </SelectItem>

                        {!selectedAdmin?.isProtected && (
                          <SelectItem value="Deactivated">
                            <div className="flex items-center gap-2">
                              <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                              Deactivated
                            </div>
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* ACCESS CONTROL */}
                <div
                  className="
                    rounded-2xl
                    border border-amber-200
                    bg-amber-50/70
                    p-3 sm:p-4
                  "
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100">
                      <ShieldAlert className="h-4 w-4 text-amber-700" />
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-amber-900">
                        Access Control
                      </p>

                      <p className="text-xs leading-relaxed text-amber-800">
                        Deactivated administrators will immediately lose access
                        to the system until reactivated by a Super Admin.
                      </p>
                    </div>
                  </div>
                </div>
                {/* ACTIONS */}
                <div
                  className="
                    flex flex-col
                    gap-4
                    pt-4

                    lg:flex-row
                    lg:items-center
                    lg:justify-between
                  "
                >
                  {/* CHANGE PASSWORD */}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPasswordAdmin(selectedAdmin);
                      setIsChangePasswordDialogOpen(true);
                    }}
                    className="
                      h-11
                      w-full
                      lg:w-auto
                      cursor-pointer
                      rounded-2xl
                      border-blue-200
                      text-blue-700
                      hover:bg-blue-50
                    "
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    Change Password
                  </Button>

                  {/* RIGHT SIDE BUTTONS */}
                  <div className="flex flex-col-reverse gap-3 sm:flex-row">
                    <Button
                      variant="outline"
                      className="h-11 w-full sm:w-auto rounded-2xl border-slate-200 px-5 font-medium hover:bg-slate-100"
                      onClick={() => setIsEditAdminDialogOpen(false)}
                    >
                      Cancel
                    </Button>

                    <Button
                      onClick={handleUpdateAdmin}
                      className="h-11 w-full sm:w-auto rounded-2xl bg-linear-to-r from-yellow-400 to-amber-400 px-6 font-semibold text-black shadow-lg transition-all hover:scale-[1.02]"
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isChangePasswordDialogOpen}
          onOpenChange={setIsChangePasswordDialogOpen}
        >
          <DialogContent className="sm:max-w-lg border-0 rounded-4xl overflow-hidden p-0 shadow-[0_25px_80px_rgba(0,0,0,0.18)] data-[state=open]:animate-[dialogPop_0.35s_cubic-bezier(0.34,1.56,0.64,1)]">
            {/* Header */}
            <div className="bg-linear-to-br from-blue-600 via-blue-500 to-cyan-500 px-8 py-7 text-white">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                    <Lock className="h-5 w-5" />
                  </div>

                  <div>
                    <p>Change Password</p>
                    <p className="text-sm font-normal text-white/80">
                      Administrator Security
                    </p>
                  </div>
                </DialogTitle>

                <DialogDescription className="pt-2 text-white/80">
                  Set a new password for{" "}
                  <span className="font-semibold text-white">
                    {passwordAdmin?.fullName}
                  </span>
                </DialogDescription>
              </DialogHeader>
            </div>

            {/* Body */}
            <div className="px-8 py-7 space-y-6">
              {/* Security Notice */}
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <div className="flex gap-3">
                  <ShieldAlert className="h-5 w-5 text-blue-600 mt-0.5" />

                  <div>
                    <p className="font-semibold text-blue-900">
                      Security Notice
                    </p>

                    <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                      Changing this password will immediately affect the
                      administrator's next login session.
                    </p>
                  </div>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label className="font-semibold">New Password</Label>

                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter secure password"
                    className="h-12 rounded-2xl pr-12"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label className="font-semibold">Confirm Password</Label>

                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="h-12 rounded-2xl pr-12"
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Validation */}
              {newPassword && confirmPassword && (
                <div
                  className={`rounded-2xl px-4 py-3 text-sm font-medium ${
                    newPassword === confirmPassword
                      ? "border border-green-200 bg-green-50 text-green-700"
                      : "border border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {newPassword === confirmPassword
                    ? "✓ Passwords match"
                    : "✕ Passwords do not match"}
                </div>
              )}

              {/* Password Rules */}
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="font-semibold text-slate-800 mb-2">
                  Recommended Password
                </p>

                <ul className="space-y-1 text-xs text-slate-600">
                  <li>• Minimum 8 characters</li>
                  <li>• Include uppercase and lowercase letters</li>
                  <li>• Include at least one number</li>
                  <li>• Include a special character</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 h-12 rounded-2xl"
                  onClick={() => setIsChangePasswordDialogOpen(false)}
                >
                  Cancel
                </Button>

                <Button
                  onClick={handleChangePassword}
                  disabled={
                    !newPassword ||
                    !confirmPassword ||
                    newPassword !== confirmPassword
                  }
                  className="flex-1 h-12 rounded-2xl bg-linear-to-r from-blue-600 to-cyan-500 text-white font-semibold"
                >
                  Update Password
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-accent text-primary p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-6 w-6" />
              <h3 className="text-lg font-black uppercase tracking-tight">
                Security Protocol
              </h3>
            </div>
            <p className="text-xs font-medium opacity-90 leading-relaxed uppercase tracking-wider">
              Access is restricted to verified organization personnel. Ensure
              one Super Admin remains registered at all times.
            </p>
          </Card>

          <Card className="border-none shadow-sm border-l-4 border-l-amber-500 bg-amber-50 p-6">
            <div className="flex items-center gap-2 mb-2 text-amber-700">
              <ShieldAlert className="h-4 w-4" />
              <h4 className="text-xs font-black uppercase tracking-widest">
                Management Policy
              </h4>
            </div>
            <p className="text-[10px] text-amber-800/80 font-bold uppercase leading-relaxed tracking-widest">
              DashBoard accounts are for administrative staff only. Do not add
              general employees here; use the Clinical Directory instead.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
