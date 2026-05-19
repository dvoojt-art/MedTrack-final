
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stethoscope, Lock, User, Info, UserCircle, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent, roleHint: string) => {
    e.preventDefault();
    setLoading(true);

    // Mock login logic with roles
    setTimeout(() => {
      const isAdmin = username === "admin" && password === "password";
      const isEmployee = username === "employee" && password === "password";

      if (isAdmin || isEmployee) {
        const role = isAdmin ? "admin" : "employee";
        localStorage.setItem("medtrack_auth_role", role);
        localStorage.setItem("medtrack_admin_auth", "true");
        
        toast({
          title: "Login Successful",
          description: `Welcome, ${role.charAt(0).toUpperCase() + role.slice(1)}.`,
        });
        
        // Employees go straight to the entry form
        if (role === "employee") {
          router.push("/dashboard/new");
        } else {
          router.push("/dashboard");
        }
      } else {
        toast({
          title: "Authentication Failed",
          description: "Invalid credentials. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md border-none shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <div className="h-2 bg-primary w-full" />
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="flex justify-center mb-2">
            <div className="h-14 w-14 bg-primary rounded-xl flex items-center justify-center shadow-lg">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold font-headline text-primary tracking-tight">MedTrack Portal</CardTitle>
          <CardDescription>Secure medical administration access</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="employee" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="employee" className="gap-2">
                <UserCircle className="h-4 w-4" /> Employee
              </TabsTrigger>
              <TabsTrigger value="admin" className="gap-2">
                <ShieldCheck className="h-4 w-4" /> Admin
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="employee" className="space-y-4 pt-4">
              <Alert className="bg-primary/5 border-primary/20">
                <Info className="h-4 w-4 text-primary" />
                <AlertDescription className="text-xs text-primary/80">
                  Employee access: <span className="font-bold">employee</span> / <span className="font-bold">password</span>
                </AlertDescription>
              </Alert>
              <form onSubmit={(e) => handleLogin(e, "employee")} className="space-y-4">
                <LoginFormFields 
                  username={username} 
                  setUsername={setUsername} 
                  password={password} 
                  setPassword={setPassword} 
                  loading={loading}
                  role="Employee"
                />
              </form>
            </TabsContent>

            <TabsContent value="admin" className="space-y-4 pt-4">
              <Alert className="bg-primary/5 border-primary/20">
                <Info className="h-4 w-4 text-primary" />
                <AlertDescription className="text-xs text-primary/80">
                  Admin access: <span className="font-bold">admin</span> / <span className="font-bold">password</span>
                </AlertDescription>
              </Alert>
              <form onSubmit={(e) => handleLogin(e, "admin")} className="space-y-4">
                <LoginFormFields 
                  username={username} 
                  setUsername={setUsername} 
                  password={password} 
                  setPassword={setPassword} 
                  loading={loading}
                  role="Admin"
                />
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col items-center bg-slate-50 border-t p-6">
          <p className="text-xs text-muted-foreground text-center">
            Unauthorized access is strictly prohibited and monitored.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

function LoginFormFields({ username, setUsername, password, setPassword, loading, role }: any) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <div className="relative">
          <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
          <Input 
            id="username" 
            placeholder={role.toLowerCase()} 
            className="pl-10 h-11 border-slate-200"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
          <Input 
            id="password" 
            type="password" 
            placeholder="••••••••" 
            className="pl-10 h-11 border-slate-200"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
      </div>
      <Button type="submit" className="w-full h-11 text-lg font-semibold bg-primary hover:bg-primary/90 mt-2" disabled={loading}>
        {loading ? "Authenticating..." : `Sign In as ${role}`}
      </Button>
    </>
  );
}
