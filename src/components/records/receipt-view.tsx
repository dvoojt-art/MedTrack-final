"use client";

import { useState, useEffect } from "react";
import type { IssuanceRecord } from "@/types/issuance";
import { CheckCircle2, Printer, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ReceiptViewProps {
  record: IssuanceRecord;
  onClose: () => void;
}

export function ReceiptView({ record, onClose }: ReceiptViewProps) {
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null);

  const issuedDate = new Date(record.createdAt);
  const isValidDate = !Number.isNaN(issuedDate.getTime());

  const formattedDate = new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(isValidDate ? issuedDate : new Date());

  const formattedTime = (
    isValidDate ? issuedDate : new Date()
  ).toLocaleTimeString();

  useEffect(() => {
    // Prevent hydration mismatch by generating client-side
    const num = Math.floor(100000 + Math.random() * 900000).toString();
    setReceiptNumber(num);
  }, []);

  return (
    <Card className="max-w-md mx-auto shadow-2xl border-primary/20 bg-white">
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold font-headline text-accent">
          Issuance Confirmed
        </CardTitle>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Digital Receipt #{receiptNumber || "------"}
        </p>
      </CardHeader>
      <CardContent className="space-y-4 font-body">
        <div className="bg-slate-50 p-4 rounded-lg grid grid-cols-2 gap-y-3 text-sm border border-slate-100">
          <span className="text-slate-500 font-bold uppercase text-[10px]">
            Date:
          </span>
          <span className="font-bold text-right text-slate-700">
            {formattedDate}
          </span>

          <span className="text-slate-500 font-bold uppercase text-[10px]">
            Patient:
          </span>
          <span className="font-bold text-right text-slate-700">
            {record.name}
          </span>
          <span className="text-slate-500 font-bold uppercase text-[10px]">
            Dept:
          </span>
          <span className="font-bold text-right text-slate-700">
            {record.department}
          </span>
        </div>

        <div className="space-y-3">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Distribution Details
          </h4>
          <div className="space-y-2">
            {record.medicineTaken.map((med, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-3 rounded-md bg-white border border-slate-100 shadow-sm"
              >
                <div>
                  <p className="font-bold text-slate-800 text-sm">
                    {med.medicine_name}
                  </p>
                  <p className="text-[10px] font-bold text-primary uppercase">
                    {med.dosage}
                  </p>
                </div>
                <div className="bg-slate-50 px-2 py-1 rounded text-xs font-black text-slate-700">
                  QTY: {med.quantity}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 text-sm">
          <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest mb-1">
            Chief Complaints
          </p>
          <p className="italic bg-slate-50 p-3 rounded-lg border-l-4 border-primary text-xs text-slate-600 font-medium">
            "{record.chiefComplaints}"
          </p>
        </div>
      </CardContent>
      <Separator className="bg-slate-100" />
      <CardFooter className="flex justify-between gap-2 pt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => typeof window !== "undefined" && window.print()}
          className="flex-1 gap-2 border-slate-200 text-slate-600 font-bold"
        >
          <Printer className="h-4 w-4" /> Print
        </Button>
        <Button
          size="sm"
          onClick={onClose}
          className="flex-1 bg-accent hover:bg-accent/90 text-primary font-black uppercase tracking-widest shadow-lg shadow-accent/20"
        >
          Done
        </Button>
      </CardFooter>
    </Card>
  );
}
