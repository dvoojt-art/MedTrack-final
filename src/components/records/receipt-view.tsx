
"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Printer, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ReceiptViewProps {
  record: {
    date: string;
    time: string;
    name: string;
    email: string;
    department: string;
    chiefComplaints: string;
    medicineTaken: Array<{
      name: string;
      quantity: number;
      dosage: string;
    }>;
  };
  onClose: () => void;
}

export function ReceiptView({ record, onClose }: ReceiptViewProps) {
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null);

  useEffect(() => {
    // Generate receipt number on the client to prevent hydration mismatch
    const num = Math.floor(100000 + Math.random() * 900000).toString();
    setReceiptNumber(num);
  }, []);

  return (
    <Card className="max-w-md mx-auto shadow-2xl border-primary/20">
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 bg-accent/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-accent" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold font-headline text-accent">Issuance Confirmed</CardTitle>
        <p className="text-sm text-muted-foreground">
          Digital Receipt #{receiptNumber || "------"}
        </p>
      </CardHeader>
      <CardContent className="space-y-4 font-body">
        <div className="bg-slate-50 p-3 rounded-md grid grid-cols-2 gap-y-2 text-sm border border-slate-100">
          <span className="text-muted-foreground">Date:</span>
          <span className="font-medium text-right text-slate-700">{record.date}</span>
          <span className="text-muted-foreground">Time:</span>
          <span className="font-medium text-right text-slate-700">{record.time}</span>
          <span className="text-muted-foreground">Patient:</span>
          <span className="font-medium text-right text-slate-700">{record.name}</span>
          <span className="text-muted-foreground">Dept:</span>
          <span className="font-medium text-right text-slate-700">{record.department}</span>
          <span className="text-muted-foreground">Email:</span>
          <span className="font-medium text-right text-xs truncate ml-2 text-slate-500" title={record.email}>{record.email}</span>
        </div>
        
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Medicine Details</h4>
          <div className="space-y-2">
            {record.medicineTaken.map((med, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
                <div>
                  <p className="font-bold text-accent">{med.name}</p>
                  <p className="text-xs text-muted-foreground">Dosage: {med.dosage}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-slate-700">Qty: {med.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 text-sm">
          <p className="text-slate-400 text-xs uppercase font-bold mb-1">Chief Complaints</p>
          <p className="italic bg-slate-50 p-2 rounded-sm border-l-2 border-primary text-xs text-slate-600">"{record.chiefComplaints}"</p>
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="flex justify-between pt-6">
        <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2 border-slate-200 text-slate-600">
          <Printer className="h-4 w-4" /> Print
        </Button>
        <Button variant="outline" size="sm" className="gap-2 border-slate-200 text-slate-600">
          <Share2 className="h-4 w-4" /> Share
        </Button>
        <Button 
          size="sm" 
          onClick={onClose} 
          className="bg-accent hover:bg-accent/90 text-primary font-bold shadow-md px-6"
        >
          DONE
        </Button>
      </CardFooter>
    </Card>
  );
}
