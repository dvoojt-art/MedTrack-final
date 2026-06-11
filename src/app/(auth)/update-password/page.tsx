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
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // The user is in the password recovery flow.
        // You can use the session to update the password.
      }
    });

    // Check for error in URL, which Supabase adds for invalid tokens
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const urlError = params.get('error_description');
    if (urlError) {
      setError(urlError);
    }

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      setSubmitted(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast({
        title: "Error",
        description: message || "Failed to update password.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-white p-4 text-center">
            <Card className="w-full max-w-md p-8">
                <CardTitle className="text-destructive">Error</CardTitle>
                <CardDescription className="mt-2">{error}</CardDescription>
                <Button asChild className="mt-4"><Link href="/login">Back to Login</Link></Button>
            </Card>
        </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md">
        <Card className="border-none shadow-2xl overflow-hidden bg-slate-50">
          <div className="h-2 bg-primary w-full" />
          <CardHeader className="space-y-2 text-center pb-8 pt-10">
            <CardTitle className="text-3xl font-bold font-headline text-accent tracking-tight uppercase">
              Set New Password
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium tracking-wide uppercase text-[10px]">
              Enter and confirm your new password
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8 space-y-6">
            {submitted ? (
              <div className="text-center p-4 bg-emerald-50 border border-emerald-200 rounded-md">
                <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <h3 className="font-bold text-slate-700">Password Updated!</h3>
                <p className="text-sm text-slate-500 mt-1">You can now log in with your new password.</p>
                <Button asChild className="mt-4"><Link href="/login">Back to Login</Link></Button>
              </div>
            ) : (
              <form onSubmit={handleUpdatePassword} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <Input id="password" type="password" placeholder="••••••••" className="pl-10 h-12" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
                  </div>
                </div>
                <Button type="submit" className="w-full h-12" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
