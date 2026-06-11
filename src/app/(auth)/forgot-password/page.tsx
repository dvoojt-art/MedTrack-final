"use client";

import { supabase } from "@/lib/supabase";
import { useState } from "react";
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
import { ArrowLeft, Mail, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

const ORG_DOMAIN = "callboxinc.com";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      // NOTE: As requested, this function currently only handles the UI flow
      // without sending an actual email. The call to Supabase to send a reset
      // link has been temporarily removed.
      //
      // To re-enable this, you can restore the previous logic which calls
      // `supabase.auth.resetPasswordForEmail`.
      // Simulate a network request for UI demonstration purposes.
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSubmitted(true);
    } catch (err: unknown) {
      // This block is currently unreachable but is kept for future implementation.
      const message = err instanceof Error ? err.message : String(err);
      toast({
        title: "Error",
        description: message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="absolute top-6 left-6">
        <Button
          variant="ghost"
          asChild
          className="text-accent hover:text-primary font-bold transition-colors"
        >
          <Link
            href="/login"
            className="gap-2 text-xs font-semibold uppercase tracking-wider"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Login
          </Link>
        </Button>
      </div>

      <div className="w-full max-w-md">
        <Card className="border-none shadow-2xl overflow-hidden bg-slate-50">
          <div className="h-2 bg-primary w-full" />
          <CardHeader className="space-y-2 text-center pb-8 pt-10">
            <CardTitle className="text-3xl font-bold font-headline text-accent tracking-tight uppercase">
              Reset Password
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium tracking-wide uppercase text-[10px]">
              Enter your email to receive a reset link
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8 space-y-6">
            {submitted ? (
              <div className="text-center p-4 bg-emerald-50 border border-emerald-200 rounded-md">
                <Mail className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <h3 className="font-bold text-slate-700">Check your email</h3>
                <p className="text-sm text-slate-500 mt-1">
                  A password reset link has been sent to{" "}
                  <span className="font-bold">{email}</span> if it's associated with an account.
                </p>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold uppercase text-slate-500">
                    Work Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <Input id="email" type="email" placeholder={`username@${ORG_DOMAIN}`} className="pl-10 h-12 border-slate-200 focus:border-primary focus:ring-primary/20 bg-white" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 text-md font-bold bg-accent hover:bg-accent/90 text-primary shadow-lg mt-4" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Reset Link"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}