import { useState } from "react";
import { ThemeProvider } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download, FileText, MapPin, Users, Calendar, DollarSign, Save } from "lucide-react";
import { Link, useLocation } from "wouter";
import NewItineraryAnalyzer from "@/components/NewItineraryAnalyzer";

interface AnalysisResult {
  summary: any;
  services_by_day: any[];
  pricing: any;
  missing_prices: any[];
  recommendations: string[];
}

export default function NewTourPage() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [tourName, setTourName] = useState("");
  const [clientName, setClientName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setAnalysisResult(result);
  };

  const handleSaveTour = async () => {
    if (!analysisResult || !tourName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a tour name and complete the analysis first.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const quotationData = {
        tourName: tourName.trim(),
        clientName: clientName.trim() || null,
        numDays: analysisResult.summary?.total_days || 1,
        numPeople: analysisResult.summary?.num_people || 1,
        startDate: startDate || null,
        itineraryText: null, // We could save the original itinerary text if needed
        analysisResult: JSON.stringify(analysisResult),
        totalCost: analysisResult.pricing?.total_cost || 0,
        currency: analysisResult.pricing?.currency || "EUR",
        status: "draft" as const,
      };

      const response = await fetch('/api/quotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quotationData),
      });

      if (!response.ok) {
        throw new Error('Failed to save tour');
      }

      const savedTour = await response.json();

      toast({
        title: "Tour Saved",
        description: "Your tour has been saved successfully!",
      });

      // Redirect to tours page
      setLocation('/tours');
    } catch (error) {
      console.error('Error saving tour:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save the tour. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
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

          {/* Results Section */}
          {analysisResult && (
            <Card className="mt-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Analysis Complete
                    </CardTitle>
                    <CardDescription>
                      Your Egypt tour has been analyzed and priced
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleExportJSON} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export JSON
                    </Button>
                    <Button onClick={handleSaveTour} disabled={isSaving}>
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? "Saving..." : "Save Tour"}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Tour Details Form */}
              <CardContent className="border-t pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="space-y-2">
                    <Label htmlFor="tourName">
                      Tour Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="tourName"
                      placeholder="e.g., Cairo to Aswan Explorer"
                      value={tourName}
                      onChange={(e) => setTourName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Client Name</Label>
                    <Input
                      id="clientName"
                      placeholder="e.g., John Smith"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </ThemeProvider>
  );
}