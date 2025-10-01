
import { useState } from "react";
import { Link } from "wouter";
import { ThemeProvider } from "next-themes";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import NewItineraryAnalyzer from "@/components/NewItineraryAnalyzer";
import type { PricingConfig, PricingTotals, Service } from "@shared/schema";

interface AnalysisResult {
  summary: any;
  services_by_day: any[];
  pricing: any;
  missing_prices: any[];
  recommendations: string[];
}

export default function NewTourPage() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setAnalysisResult(result);
  };

  const handleExportJSON = () => {
    if (!analysisResult) return;
    
    const quotation = {
      analysis: analysisResult,
      created_at: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(quotation, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quotation-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="button-back-home">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold">Create New Tour Quotation</h1>
              <p className="text-sm text-muted-foreground">Automated itinerary analysis and pricing</p>
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 py-6">
          <NewItineraryAnalyzer onComplete={handleAnalysisComplete} />
        </main>
      </div>
    </ThemeProvider>
  );
}
