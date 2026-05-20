
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, RefreshCw, AlertTriangle, CheckCircle, ArrowRight, ClipboardList } from "lucide-react";
import { getRestockRecommendations, type RestockRecommendationOutput } from "@/ai/flows/automated-inventory-insight-flow";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useCollection } from "@/firebase";
import { collection } from "firebase/firestore";

export default function InsightsPage() {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<RestockRecommendationOutput | null>(null);
  const { toast } = useToast();
  const db = useFirestore();

  const issuancesQuery = useMemo(() => {
    if (!db) return null;
    return collection(db, "issuances");
  }, [db]);

  const { data: records, loading: recordsLoading } = useCollection(issuancesQuery);

  const generateInsights = async () => {
    console.log('[Genkit] Initiating AI Inventory Analysis...');
    
    if (!records || records.length === 0) {
      console.warn('[Genkit] Insight generation failed: No historical records found in database.');
      toast({
        title: "Insufficient Data",
        description: "There are no medicine issuance records available to analyze yet.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const formattedRecords = records.map(r => ({
        date: r.date,
        time: r.time,
        name: r.name,
        age: r.age,
        gender: r.gender,
        department: r.department,
        chiefComplaints: r.chiefComplaints,
        medicineTaken: r.medicineTaken || [],
      }));

      console.log(`[Genkit] Sending ${formattedRecords.length} records to AI flow.`);
      
      const result = await getRestockRecommendations({ records: formattedRecords });
      
      console.log('[Genkit] AI analysis successful. Received recommendations:', result.recommendations.length);
      setInsights(result);
      
      toast({
        title: "Analysis Complete",
        description: "AI tool has finished analyzing your clinical data trends.",
      });
    } catch (error) {
      console.error('[Genkit] Insight generation error:', error);
      toast({
        title: "Analysis Failed",
        description: "Could not generate insights at this time. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight text-primary">AI Inventory Insights</h1>
          <p className="text-muted-foreground mt-1">Proactive restock recommendations based on symptom trends.</p>
        </div>
        <Button 
          onClick={generateInsights} 
          disabled={loading || recordsLoading}
          className="gap-2 bg-primary"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Lightbulb className="h-4 w-4" />
          )}
          {loading ? "Analyzing Live Data..." : "Generate AI Insights"}
        </Button>
      </div>

      {!insights && !loading && (
        <Card className="border-dashed border-2 bg-transparent">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lightbulb className="h-10 w-10 text-primary animate-pulse" />
            </div>
            <h3 className="text-xl font-bold font-headline">Ready for Analysis</h3>
            <p className="text-muted-foreground max-w-sm mt-2">
              Our AI tool will analyze live patient symptoms and medicine usage from your database to predict inventory needs.
            </p>
            <Button variant="outline" onClick={generateInsights} className="mt-6" disabled={recordsLoading}>
              {recordsLoading ? "Loading Records..." : "Start Analysis Now"}
            </Button>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse h-[200px] border-none shadow-sm" />
          ))}
        </div>
      )}

      {insights && !loading && (
        <div className="space-y-6">
          <Card className="border-none shadow-md bg-accent text-primary overflow-hidden">
            <CardHeader className="relative z-10">
              <CardTitle className="font-headline flex items-center gap-2">
                <CheckCircle className="h-5 w-5" /> Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <p className="text-lg font-medium leading-relaxed">
                {insights.summary}
              </p>
            </CardContent>
            <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
              <Lightbulb size={200} />
            </div>
          </Card>

          <h2 className="text-xl font-bold font-headline text-accent mt-8">Priority Restock List</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {insights.recommendations.map((rec, idx) => (
              <Card key={idx} className="border-none shadow-sm hover:shadow-md transition-shadow group flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge 
                      variant="outline" 
                      className={
                        rec.priority === "High" ? "border-destructive text-destructive" :
                        rec.priority === "Medium" ? "border-amber-500 text-amber-500" :
                        "border-primary text-primary"
                      }
                    >
                      {rec.priority} Priority
                    </Badge>
                  </div>
                  <CardTitle className="text-xl text-accent font-headline">{rec.medicineName}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground">
                    {rec.reason}
                  </p>
                  {rec.suggestedQuantity && (
                    <div className="mt-4 p-2 bg-slate-50 rounded flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Suggested Restock:</span>
                      <span className="font-bold text-accent">{rec.suggestedQuantity} units</span>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="link" className="p-0 text-primary hover:text-primary/80 group-hover:translate-x-1 transition-transform">
                    Create Purchase Order <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
