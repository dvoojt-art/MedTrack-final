"use client";

import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck,
  Lock,
  User,
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

const ORG_DOMAIN = "callboxinc.com";
const MASTER_USER = "admin@callboxinc.com";
const MASTER_PASS = "password123";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState(false);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const validateEmail = (email: string) => {
    return email.toLowerCase().endsWith(`@${ORG_DOMAIN}`);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    setLoginError(false);

    if (!validateEmail(username)) {
      toast({
        title: "Domain Restricted",
        description: `Access is limited to verified @${ORG_DOMAIN} accounts.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Check if system has already been initialized
      const { count, error: countError } = await supabase
        .from("admins")
        .select("*", { count: "exact", head: true });

      if (countError) {
        throw countError;
      }

      const isFirstRun = (count ?? 0) === 0;

      // Bootstrap login (first run only)
      if (isFirstRun) {
        if (
          username.toLowerCase() === MASTER_USER &&
          password === MASTER_PASS
        ) {
          localStorage.setItem("medtrack_auth_role", "Super Admin");
          localStorage.setItem("medtrack_admin_auth", "true");
          localStorage.setItem("medtrack_system_initialized", "false");

          toast({
            title: "First-Time Setup",
            description: "Welcome. Please complete system initialization.",
          });

          router.push("/dashboard");
          return;
        }

        toast({
          title: "Access Denied",
          description: "Invalid bootstrap credentials.",
          variant: "destructive",
        });

        setLoading(false);
        return;
      }

      // Normal Supabase login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password,
      });

      if (error) {
        throw error;
      }

      // Load role from admins table
      const { data: adminData } = await supabase
        .from("admins")
        .select("role")
        .eq("email", username.toLowerCase())
        .single();

      localStorage.setItem(
        "medtrack_auth_role",
        adminData?.role || "Clinic Staff",
      );

      localStorage.setItem("medtrack_admin_auth", "true");
      localStorage.setItem("medtrack_user_id", data.user.id);
      localStorage.setItem("medtrack_system_initialized", "true");

      toast({
        title: "Login Successful",
        description: "Welcome to MedTrack",
      });

      router.push("/dashboard");
    } catch (err: any) {
      setLoginError(true);

      toast({
        title: "Access Denied",
        description: err.message || "Login failed.",
        variant: "destructive",
      });

      setLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="absolute top-6 left-6">
        <Button
          variant="ghost"
          asChild
          className="text-accent hover:text-primary font-bold transition-colors"
        >
          <Link
            href="/"
            className="gap-2 text-xs font-semibold uppercase tracking-wider"
          >
            <ArrowLeft className="h-4 w-4" /> Public Portal
          </Link>
        </Button>
      </div>

      <div className="w-full max-w-md">
        <div className="space-y-6">
          <Card className="border-none shadow-2xl overflow-hidden bg-slate-50">
            <div className="h-2 bg-primary w-full" />
            <CardHeader className="space-y-2 text-center pb-8 pt-10">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-accent rounded-2xl flex items-center justify-center border-4 border-white shadow-sm">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold font-headline text-accent tracking-tight uppercase">
                Admin Access
              </CardTitle>
              <CardDescription className="text-slate-500 font-medium tracking-wide uppercase text-[10px]">
                Secure Clinical Gateway
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-6">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="username"
                    className="text-xs font-bold uppercase text-slate-500"
                  >
                    Work Email
                  </Label>
                  <div className="relative">
                    <User
                      className={`absolute left-3 top-3 h-5 w-5 ${username && !validateEmail(username) ? "text-destructive" : "text-slate-400"}`}
                    />
                    <Input
                      id="username"
                      type="text"
                      placeholder={`username@${ORG_DOMAIN}`}
                      className={`pl-10 h-12 border-slate-200 focus:border-primary focus:ring-primary/20 bg-white ${username && !validateEmail(username) ? "border-destructive ring-destructive/20" : ""}`}
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setLoginError(false);
                      }}
                      required
                    />
                  </div>
                  {username && !validateEmail(username) && (
                    <p className="text-[10px] font-bold text-destructive uppercase pl-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Requires official @
                      {ORG_DOMAIN} address
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-xs font-bold uppercase text-slate-500"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Lock
                      className={`absolute left-3 top-3 h-5 w-5 ${loginError ? "text-destructive" : "text-slate-400"}`}
                    />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className={`pl-10 h-12 border-slate-200 focus:border-primary focus:ring-primary/20 bg-white ${loginError ? "border-destructive ring-destructive/20" : ""}`}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setLoginError(false);
                      }}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3 text-slate-400 hover:text-primary transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {loginError && (
                    <p className="text-[10px] font-bold text-destructive uppercase pl-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Incorrect Username or
                      Password.
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-md font-bold bg-accent hover:bg-accent/90 text-primary shadow-lg mt-4"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Access Dashboard"
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col items-center bg-slate-100 border-t p-6">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
                Authorized Personnel Only
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
