
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Stethoscope, ShieldCheck, ArrowRight, Building2, Activity, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function WelcomePage() {
  return (
  <div className="min-h-screen bg-white flex flex-col overflow-hidden">
    <main className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-12">
      <div className="space-y-4 animate-in fade-in slide-in-from-top-10 duration-700">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-accent text-xs font-black uppercase tracking-wider mb-4 border border-primary/30 animate-pulse">
          <Activity className="h-3 w-3" />
          Clinical Systems Portal
        </div>

        <h1 className="text-4xl md:text-7xl font-black font-headline tracking-tighter text-accent max-w-4xl leading-[0.9] animate-[float_4s_ease-in-out_infinite]">
          MED<span className="text-primary">TRACK</span>
        </h1>

        <p className="text-lg md:text-xl max-w-xl mx-auto leading-relaxed font-black mt-32 uppercase tracking-[0.3em] animate-in fade-in zoom-in-95 delay-300 duration-1000">
          <span className="text-accent">Callbôx</span>{" "}
          <span className="text-primary">Davao</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl animate-in fade-in slide-in-from-bottom-10 delay-200 duration-1000">
        {/* Clinical Entry Card */}
        <Card className="group hover:-translate-y-3 hover:shadow-2xl transition-all duration-500 border-none overflow-hidden relative shadow-sm bg-slate-50 animate-in zoom-in-95 delay-300">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-400" />

          <CardContent className="p-10 flex flex-col items-center text-center space-y-5">
            <div className="h-20 w-20 bg-slate-500 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
              <Stethoscope className="h-10 w-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black font-headline uppercase tracking-tight text-accent">
                Clinical Entry
              </h3>

              <p className="text-slate-500 text-sm font-medium">
                Personnel portal for medicine issuance logs and digital receipt
                generation.
              </p>
            </div>

            <Button
              asChild
              className="w-full bg-slate-600 hover:bg-slate-700 text-primary font-bold h-12 mt-4 gap-2 transition-all duration-300 hover:scale-[1.02]"
            >
              <Link href="/portal">
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Open Entry Portal
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Admin Dashboard Card */}
        <Card className="group hover:-translate-y-3 hover:shadow-2xl transition-all duration-500 border-none overflow-hidden relative shadow-sm bg-slate-50 animate-in zoom-in-95 delay-500">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />

          <CardContent className="p-10 flex flex-col items-center text-center space-y-5">
            <div className="h-20 w-20 bg-primary rounded-2xl flex items-center justify-center text-accent group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500">
              <ShieldCheck className="h-10 w-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black font-headline uppercase tracking-tight text-accent">
                Admin Dashboard
              </h3>

              <p className="text-slate-500 text-sm font-medium">
                Authorized access for reviewing clinical trends, records, and AI
                insights.
              </p>
            </div>

            <Button
              asChild
              className="w-full bg-primary hover:bg-primary/90 text-accent font-bold h-12 mt-4 gap-2 transition-all duration-300 hover:scale-[1.02]"
            >
              <Link href="/login">
                Access Administration
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-6 text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] animate-in fade-in delay-700 duration-1000">
        <span className="flex items-center gap-1">
          <Building2 className="h-4 w-4" />
          FACILITY MGMT
        </span>

        <span className="h-1 w-1 rounded-full bg-primary animate-pulse" />

        <span>v2.5 STABLE</span>
      </div>
    </main>

    <footer className="p-8 text-center border-t bg-white animate-in fade-in delay-1000 duration-1000">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        &copy; {new Date().getFullYear()} MEDTRACK SECURE SYSTEMS. ALL RIGHTS
        RESERVED.
      </p>
    </footer>
  </div>
);
}
