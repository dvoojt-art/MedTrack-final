"use client";

import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import type { IssuanceDbRow, MedicineItem } from "@/types/issuance";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Lightbulb,
  RefreshCw,
  CheckCircle,
  ArrowRight,
  ClipboardList,
  Sparkles,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

import {
  getRestockRecommendations,
  type RestockRecommendationOutput,
} from "@/ai/flows/automated-inventory-insight-flow";

import { useToast } from "@/hooks/use-toast";

export default function InsightsPage() {
  const [loading, setLoading] = useState(false);

  const [insights, setInsights] = useState<RestockRecommendationOutput | null>(
    null,
  );

  const [records, setRecords] = useState<IssuanceDbRow[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    loadIssuanceRecords();
    loadSavedInsights();
  }, []);

  const loadSavedInsights = () => {
    try {
      const saved = localStorage.getItem("ai_inventory_insights");

      if (saved) {
        setInsights(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Failed to load saved AI insights:", error);
    }
  };

  const loadIssuanceRecords = async () => {
    try {
      const { data, error } = await supabase
        .from<IssuanceDbRow>("issuances")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setRecords(data || []);
    } catch (error) {
      console.error("Failed to load issuance records:", error);

      toast({
        title: "Load Failed",
        description: "Unable to fetch issuance records.",
        variant: "destructive",
      });
    }
  };

  const generateInsights = async () => {
    if (records.length === 0) {
      toast({
        title: "No Records Found",
        description:
          "AI analysis requires issuance records before generating recommendations.",
        variant: "destructive",
      });

      return;
    }

    setLoading(true);

    try {
      const formattedRecords = records.map((record) => ({
        date: record.date || "",

        time: record.time || "",

        name: record.name || "Unknown",

        age: Number(record.age) || 0,

        gender: record.gender || "Unknown",

        department: record.department || "General",

        chiefComplaints: record.chief_complaints || "No complaint provided",

        medicineTaken: Array.isArray(record.medicine_taken)
          ? record.medicine_taken.map((med: MedicineItem) => ({
              name: med.medicine_name || med.name || "Unknown Medicine",

              quantity: Number(med.quantity) || 1,

              dosage: med.dosage || "N/A",
            }))
          : [],
      }));

      const result = await getRestockRecommendations({
        records: formattedRecords,
      });

      setInsights(result);

      localStorage.setItem("ai_inventory_insights", JSON.stringify(result));

      toast({
        title: "AI Analysis Complete",
        description: "Inventory recommendations generated successfully.",
      });
    } catch (error) {
      console.error("[AI Insight Error]", error);

      const isQuotaError = 
        (error instanceof Error && error.message.includes("429")) ||
        (typeof error === "object" && error !== null && "code" in error && (error as {code: number}).code === 429);

      toast({
        title: "Analysis Unavailable",
        description: isQuotaError 
          ? "AI service quota exceeded. Fallback analysis will be generated from your issuance records. Upgrade to paid tier to restore AI features."
          : "Unable to generate recommendations at this time. Fallback analysis will be used.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearInsights = () => {
    setInsights(null);

    localStorage.removeItem("ai_inventory_insights");

    toast({
      title: "Insights Cleared",
      description: "Saved AI recommendations have been removed.",
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="mb-8 animate-in fade-in slide-in-from-left-8 duration-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>

            <h1 className="text-3xl font-bold tracking-tight">
              AI Inventory Insights
            </h1>
          </div>

          <p className="text-muted-foreground">
            Smart restock recommendations powered by medicine issuance trends.
          </p>
        </div>

        <div className="flex gap-2">
          {insights && (
            <Button
              variant="outline"
              onClick={clearInsights}
              className="rounded-2xl"
            >
              Clear Insights
            </Button>
          )}

          <Button
            onClick={generateInsights}
            disabled={loading}
            className="gap-2 rounded-2xl shadow-lg"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Lightbulb className="h-4 w-4" />
                Generate Insights
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Empty Records */}
      {records.length === 0 && !loading && (
        <Card className="border-dashed border-2 bg-background">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <ClipboardList className="h-10 w-10 text-muted-foreground" />
            </div>

            <h3 className="text-xl font-bold">No Issuance Records Available</h3>

            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              AI recommendations require medicine issuance history. Add issuance
              records first to begin inventory analysis.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Default State */}
      {!insights && records.length > 0 && !loading && (
        <Card className="overflow-hidden border-none shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
              <Lightbulb className="h-12 w-12 text-primary animate-pulse" />
            </div>

            <h3 className="text-2xl font-bold">Ready for AI Analysis</h3>

            <p className="mt-3 max-w-lg text-muted-foreground">
              The AI system will analyze medicine usage, patient symptoms, and
              dispensing trends to predict future inventory demand and recommend
              restocking priorities.
            </p>

            <Button
              onClick={generateInsights}
              className="mt-8 rounded-2xl px-8 shadow-lg"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Start AI Analysis
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <Card
              key={item}
              className="h-55 animate-pulse border-none shadow-sm"
            />
          ))}
        </div>
      )}

      {/* AI Results */}
      {insights && !loading && (
        <div className="space-y-8">
          {/* Summary */}
          <Card className="relative overflow-hidden border-none bg-primary text-primary-foreground shadow-xl">
            <div className="absolute -right-7.5 -bottom-7.5 opacity-10">
              <TrendingUp size={220} />
            </div>

            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <CheckCircle className="h-6 w-6" />
                Executive Summary
              </CardTitle>

              <CardDescription className="text-primary-foreground/80">
                AI-generated inventory overview
              </CardDescription>
            </CardHeader>

            <CardContent className="relative z-10">
              <p className="text-lg leading-relaxed">{insights.summary}</p>
            </CardContent>
          </Card>

          {/* Recommendations Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Restock Recommendations</h2>

              <p className="text-muted-foreground">
                Suggested medicines based on dispensing patterns.
              </p>
            </div>

            <Badge className="rounded-full px-4 py-1 text-sm">
              {insights.recommendations.length} Recommendations
            </Badge>
          </div>

          {/* Recommendations */}
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {insights.recommendations.map((rec, idx) => (
              <Card
                key={idx}
                className="group flex flex-col rounded-3xl border-none shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <CardHeader>
                  <div className="mb-3 flex items-center justify-between">
                    <Badge
                      className={
                        rec.priority === "High"
                          ? "bg-red-500/10 text-red-600 border-red-500/20"
                          : rec.priority === "Medium"
                            ? "bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
                            : "bg-green-500/10 text-green-700 border-green-500/20"
                      }
                    >
                      {rec.priority} Priority
                    </Badge>

                    {rec.priority === "High" && (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    )}
                  </div>

                  <CardTitle className="text-xl">{rec.medicineName}</CardTitle>
                </CardHeader>

                <CardContent className="grow">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {rec.reason}
                  </p>

                  {rec.suggestedQuantity && (
                    <div className="mt-5 rounded-2xl bg-muted p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Suggested Restock
                        </span>

                        <span className="text-lg font-bold text-primary">
                          {rec.suggestedQuantity} units
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter>
                  <Button
                    variant="ghost"
                    className="group/button w-full justify-between rounded-2xl"
                  >
                    Create Purchase Order
                    <ArrowRight className="h-4 w-4 transition-transform group-hover/button:translate-x-1" />
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
