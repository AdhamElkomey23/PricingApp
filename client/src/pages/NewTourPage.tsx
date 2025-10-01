
import { useState } from "react";
import { Link } from "wouter";
import { ThemeProvider } from "next-themes";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import SmartItineraryAnalyzer from "@/components/SmartItineraryAnalyzer";
import DailyBreakdownCard from "@/components/DailyBreakdownCard";
import PricingConfigPanel from "@/components/PricingConfigPanel";
import PricingSummaryPanel from "@/components/PricingSummaryPanel";
import type { PricingConfig, PricingTotals, Service } from "@shared/schema";

interface AnalysisResult {
  parsedItinerary: any;
  priceMatches: any[];
  missingPrices: string[];
  recommendations: string[];
}

export default function NewTourPage() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [currentStep, setCurrentStep] = useState<'analyze' | 'review' | 'pricing'>('analyze');
  const [pricingConfig, setPricingConfig] = useState<PricingConfig>({
    currency: 'EUR',
    exchange_rate: 1.0,
    tax_rate: 0.12,
    markup_rate: 0.20,
    rounding_increment: 50,
    accommodation_mode: 'per_person',
    occupancy: 2,
    profile: 'Base'
  });
  const [pricingTotals, setPricingTotals] = useState<PricingTotals | null>(null);

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setAnalysisResult(result);
    setCurrentStep('review');
    calculatePricing(result.parsedItinerary, pricingConfig);
  };

  const calculatePricing = (itinerary: any, config: PricingConfig) => {
    let totalNet = 0;
    const dailyTotals = [];

    for (const day of itinerary.days) {
      let dayTotal = 0;

      // Calculate per-group costs
      for (const service of day.per_group) {
        if (service.included && service.unitPrice) {
          dayTotal += service.unitPrice * (service.quantity || 1);
        }
      }

      // Calculate per-person costs (multiply by number of people)
      for (const service of day.per_person) {
        if (service.included && service.unitPrice) {
          dayTotal += service.unitPrice * (service.quantity || 1) * itinerary.overview.num_people;
        }
      }

      totalNet += dayTotal;
      dailyTotals.push({
        day: day.day,
        net_total: dayTotal,
        sell_total: dayTotal * (1 + config.tax_rate) * (1 + config.markup_rate)
      });
    }

    const netPerPerson = totalNet / itinerary.overview.num_people;
    const taxAmount = netPerPerson * config.tax_rate;
    const markupAmount = (netPerPerson + taxAmount) * config.markup_rate;
    const sellPerPerson = netPerPerson + taxAmount + markupAmount;
    const sellPerGroup = sellPerPerson * itinerary.overview.num_people;

    const totals: PricingTotals = {
      net_per_person: netPerPerson,
      tax_amount: taxAmount,
      markup_amount: markupAmount,
      sell_per_person: sellPerPerson,
      sell_per_group: sellPerGroup,
      daily_totals: dailyTotals
    };

    setPricingTotals(totals);
  };

  const handleServiceUpdate = (dayNumber: number, serviceIndex: number, service: Service, isPerGroup: boolean) => {
    if (!analysisResult) return;
    
    const updatedItinerary = { ...analysisResult.parsedItinerary };
    const dayIndex = updatedItinerary.days.findIndex((d: any) => d.day === dayNumber);
    
    if (dayIndex !== -1) {
      updatedItinerary.days = [...updatedItinerary.days];
      updatedItinerary.days[dayIndex] = { ...updatedItinerary.days[dayIndex] };
      
      if (isPerGroup) {
        updatedItinerary.days[dayIndex].per_group = [...updatedItinerary.days[dayIndex].per_group];
        updatedItinerary.days[dayIndex].per_group[serviceIndex] = service;
      } else {
        updatedItinerary.days[dayIndex].per_person = [...updatedItinerary.days[dayIndex].per_person];
        updatedItinerary.days[dayIndex].per_person[serviceIndex] = service;
      }
      
      setAnalysisResult({
        ...analysisResult,
        parsedItinerary: updatedItinerary
      });
      
      calculatePricing(updatedItinerary, pricingConfig);
    }
  };

  const handlePricingConfigUpdate = (config: PricingConfig) => {
    setPricingConfig(config);
    if (analysisResult) {
      calculatePricing(analysisResult.parsedItinerary, config);
    }
  };

  const handleExportJSON = () => {
    if (!analysisResult || !pricingTotals) return;
    
    const quotation = {
      analysis: analysisResult,
      pricing_config: pricingConfig,
      pricing_totals: pricingTotals,
      created_at: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(quotation, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart-quotation-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    console.log('PDF export triggered');
    alert('PDF export functionality ready for implementation');
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold">Smart Tour Creator</h1>
              <p className="text-sm text-muted-foreground">AI-powered itinerary analysis and pricing</p>
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 py-6">
          {/* Step Navigation */}
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${currentStep === 'analyze' ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === 'analyze' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  1
                </div>
                <span>Analyze</span>
              </div>
              <div className="flex-1 h-px bg-border" />
              <div className={`flex items-center gap-2 ${currentStep === 'review' ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === 'review' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  2
                </div>
                <span>Review</span>
              </div>
              <div className="flex-1 h-px bg-border" />
              <div className={`flex items-center gap-2 ${currentStep === 'pricing' ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === 'pricing' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  3
                </div>
                <span>Pricing</span>
              </div>
            </div>
          </div>

          {/* Step Content */}
          {currentStep === 'analyze' && (
            <SmartItineraryAnalyzer onAnalysisComplete={handleAnalysisComplete} />
          )}

          {currentStep === 'review' && analysisResult && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Review Service Breakdown</h2>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setCurrentStep('analyze')}>
                    Back to Analysis
                  </Button>
                  <Button onClick={() => setCurrentStep('pricing')}>
                    Continue to Pricing
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                {analysisResult.parsedItinerary.days.map((day: any) => (
                  <DailyBreakdownCard
                    key={day.day}
                    day={day}
                    onUpdateService={handleServiceUpdate}
                    showPricing={false}
                  />
                ))}
              </div>
            </div>
          )}

          {currentStep === 'pricing' && analysisResult && pricingTotals && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-semibold">Finalize Pricing</h2>
                  <Button variant="outline" onClick={() => setCurrentStep('review')}>
                    Back to Review
                  </Button>
                </div>
                
                {analysisResult.parsedItinerary.days.map((day: any) => {
                  const dayTotal = pricingTotals.daily_totals.find(dt => dt.day === day.day);
                  return (
                    <DailyBreakdownCard
                      key={day.day}
                      day={day}
                      onUpdateService={handleServiceUpdate}
                      showPricing={true}
                      currency={pricingConfig.currency}
                      dayTotal={dayTotal?.sell_total || 0}
                    />
                  );
                })}
              </div>
              
              <div className="lg:col-span-1 space-y-4">
                <PricingConfigPanel
                  config={pricingConfig}
                  onUpdate={handlePricingConfigUpdate}
                />
              </div>
              
              <div className="lg:col-span-1">
                <PricingSummaryPanel
                  totals={pricingTotals}
                  config={pricingConfig}
                  onExportJSON={handleExportJSON}
                  onExportPDF={handleExportPDF}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </ThemeProvider>
  );
}
