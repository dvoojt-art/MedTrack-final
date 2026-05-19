
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, RefreshCw, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";
import { getRestockRecommendations, type RestockRecommendationOutput } from "@/ai/flows/automated-inventory-insight-flow";
import { INITIAL_RECORDS } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";

export default function InsightsPage() {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<RestockRecommendationOutput | null>(null);
  const { toast } = useToast();

  const generateInsights = async () => {
    setLoading(true);
    try {
      const result = await getRestockRecommendations({ records: INITIAL_RECORDS });
      setInsights(result);
      toast({
        title: "Analysis Complete",
        description: "AI tool has finished analyzing chief complaints trends.",
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Could not generate insights at this time.",
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
          disabled={loading}
          className="gap-2 bg-primary"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Lightbulb className="h-4 w-4" />
          )}
          {loading ? "Analyzing Trends..." : "Generate AI Insights"}
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
              Our AI tool will analyze patient symptoms and medicine usage to predict upcoming inventory needs.
            </p>
            <Button variant="outline" onClick={generateInsights} className="mt-6">
              Start Analysis Now
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
          <Card className="border-none shadow-md bg-primary text-primary-foreground overflow-hidden">
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

          <h2 className="text-xl font-bold font-headline text-primary mt-8">Priority Restock List</h2>
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
                        "border-accent text-accent"
                      }
                    >
                      {rec.priority} Priority
                    </Badge>
                  </div>
                  <CardTitle className="text-xl text-primary font-headline">{rec.medicineName}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground">
                    {rec.reason}
                  </p>
                  {rec.suggestedQuantity && (
                    <div className="mt-4 p-2 bg-slate-50 rounded flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Suggested Restock:</span>
                      <span className="font-bold text-primary">{rec.suggestedQuantity} units</span>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="link" className="p-0 text-accent hover:text-accent/80 group-hover:translate-x-1 transition-transform">
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
