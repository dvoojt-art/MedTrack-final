
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Stethoscope, ClipboardList, ShieldCheck, ArrowRight, Building2, Activity } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-12">
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4">
            <Activity className="h-3 w-3" /> Callbox Corporate Health
          </div>
          <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tighter text-primary max-w-2xl leading-tight">
            Efficient Medicine <span className="text-accent">Tracking</span> for Your Team.
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
            Welcome to the MedTrack Portal. A secure environment for clinic staff to log distribution and management to track inventory.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <Card className="group hover:shadow-xl transition-all border-none overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
            <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 bg-accent/10 rounded-2xl flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                <Stethoscope className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold font-headline">Clinic Portal</h3>
              <p className="text-muted-foreground text-sm">
                Log new medicine distributions for employees. Access the digital receipt generator instantly.
              </p>
              <Button asChild className="w-full bg-accent hover:bg-accent/90 mt-4 gap-2">
                <Link href="/portal">
                  Employee Entry Portal <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all border-none overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold font-headline">Admin Dashboard</h3>
              <p className="text-muted-foreground text-sm">
                Review distribution logs, generate CSV reports, and gain AI-powered inventory insights.
              </p>
              <Button asChild className="w-full bg-primary hover:bg-primary/90 mt-4 gap-2">
                <Link href="/dashboard">
                  Access Administration <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-6 text-muted-foreground/40 font-semibold uppercase text-xs tracking-[0.2em]">
          <span className="flex items-center gap-1"><Building2 className="h-4 w-4" /> Callbox Inc</span>
          <span className="h-1 w-1 rounded-full bg-muted-foreground/20" />
          <span>Clinic Administration v2.0</span>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center border-t bg-white">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} MedTrack System. Secure Digital Clinical Records.
        </p>
      </footer>
    </div>
  );
}
