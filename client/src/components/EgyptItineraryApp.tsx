import { useState } from "react";
import { ThemeProvider } from "next-themes";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, AlertTriangle, CheckCircle } from "lucide-react";
import AppHeader from "./AppHeader";
import ItineraryInputForm from "./ItineraryInputForm";
import DailyBreakdownCard from "./DailyBreakdownCard";
import PricingConfigPanel from "./PricingConfigPanel";
import PricingSummaryPanel from "./PricingSummaryPanel";
import type { 
  ItineraryInput, 
  ParsedItinerary, 
  PricingConfig, 
  PricingTotals, 
  DailyBreakdown, 
  Service 
} from "@shared/schema";

type AppStep = 'input' | 'breakdown' | 'pricing' | 'export';

export default function EgyptItineraryApp() {
  const [currentStep, setCurrentStep] = useState<AppStep>('input');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Application state
  const [itineraryInput, setItineraryInput] = useState<ItineraryInput | null>(null);
  const [parsedItinerary, setParsedItinerary] = useState<ParsedItinerary | null>(null);
  const [pricingConfig, setPricingConfig] = useState<PricingConfig>({
    currency: 'EGP',
    exchange_rate: 1.0,
    tax_rate: 0.12,
    markup_rate: 0.20,
    rounding_increment: 50,
    accommodation_mode: 'per_person',
    occupancy: 2,
    profile: 'Base'
  });
  const [pricingTotals, setPricingTotals] = useState<PricingTotals | null>(null);

  // Mock data for demonstration //todo: remove mock functionality
  const generateMockParsedItinerary = (input: ItineraryInput): ParsedItinerary => {
    const mockDays: DailyBreakdown[] = [];
    
    for (let i = 1; i <= input.num_days; i++) {
      mockDays.push({
        day: i,
        label: i === 1 ? "Arrival in Cairo" : i === input.num_days ? "Departure" : `Day ${i} Activities`,
        city_or_region: i <= 2 ? "Cairo (CAI)" : i <= 4 ? "Luxor (LXR)" : "Aswan (ASW)",
        activities_detected: i === 1 ? ["Airport arrival", "Hotel check-in"] : ["Site visits", "Local tours"],
        per_group: [
          {
            service: i === 1 ? "Meet & Assist service at airport" : "Day Tour Transfer",
            reason: i === 1 ? "Airport arrival detected" : "Inter-city movement detected",
            quantity: 1,
            unitPrice: i === 1 ? 150 : 200 + (i * 25),
            included: true
          },
          {
            service: i === 1 ? "Transfer to hotel from airport" : "Parking Fees",
            reason: i === 1 ? "Airport arrival detected" : "Site visits detected",
            quantity: 1,
            unitPrice: i === 1 ? 200 : 50,
            included: true
          }
        ],
        per_person: [
          {
            service: "Accommodation at hotels, Dahabiya or Nile Cruise",
            reason: "Hotel stay detected",
            quantity: 1,
            nights: 1,
            board: "BB",
            unitPrice: 120 + (i * 20),
            included: true
          },
          {
            service: "Entrance Fees to attractions",
            reason: "Site visits detected",
            quantity: 1,
            unitPrice: 250,
            included: pricingConfig.profile !== 'Base'
          }
        ],
        notes: i === 1 ? "Evening at leisure" : undefined
      });
    }

    return {
      overview: {
        num_days: input.num_days,
        num_people: input.num_people,
        cities_detected: ["Cairo", "Luxor", "Aswan"],
        ground_handler_fees: {
          "Luxor": "Applied on last Luxor day",
          "Aswan": "Applied on last Aswan day"
        }
      },
      days: mockDays,
      final_day_adjustments: [
        "Ground Handler Handling Fee (Luxor) added to Day 4",
        "Ground Handler Handling Fee (Aswan) added to Day 7"
      ],
      assumptions: [
        "Hotel board assumed as BB (Bed & Breakfast)",
        "Balloon rides charged per person",
        "Motor boats are group hires"
      ],
      missing_info: [
        "Specific hotel categories not specified",
        "Flight times not provided for domestic connections"
      ]
    };
  };

  const calculateMockTotals = (parsed: ParsedItinerary, config: PricingConfig): PricingTotals => {
    let totalNet = 0;
    const dailyTotals = [];

    for (const day of parsed.days) {
      let dayNet = 0;
      
      // Calculate per-group services (divided by number of people)
      for (const service of day.per_group) {
        if (service.included && service.unitPrice) {
          dayNet += (service.unitPrice * (service.quantity || 1)) / parsed.overview.num_people;
        }
      }
      
      // Calculate per-person services
      for (const service of day.per_person) {
        if (service.included && service.unitPrice) {
          dayNet += service.unitPrice * (service.quantity || 1);
        }
      }
      
      totalNet += dayNet;
      dailyTotals.push({
        day: day.day,
        net_total: dayNet,
        sell_total: dayNet * (1 + config.tax_rate + config.markup_rate)
      });
    }

    const taxAmount = totalNet * config.tax_rate;
    const markupAmount = totalNet * config.markup_rate;
    const sellPerPerson = totalNet + taxAmount + markupAmount;
    const sellPerGroup = sellPerPerson * parsed.overview.num_people;

    return {
      net_per_person: totalNet,
      tax_amount: taxAmount,
      markup_amount: markupAmount,
      sell_per_person: sellPerPerson,
      sell_per_group: sellPerGroup,
      daily_totals: dailyTotals
    };
  };

  const handleProcessItinerary = async (input: ItineraryInput) => {
    setIsProcessing(true);
    setItineraryInput(input);
    
    // Simulate API processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const parsed = generateMockParsedItinerary(input);
    setParsedItinerary(parsed);
    
    const totals = calculateMockTotals(parsed, pricingConfig);
    setPricingTotals(totals);
    
    setIsProcessing(false);
    setCurrentStep('breakdown');
  };

  const handleServiceUpdate = (dayNumber: number, serviceIndex: number, service: Service, isPerGroup: boolean) => {
    if (!parsedItinerary) return;
    
    const updatedItinerary = { ...parsedItinerary };
    const dayIndex = updatedItinerary.days.findIndex(d => d.day === dayNumber);
    
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
      
      setParsedItinerary(updatedItinerary);
      
      // Recalculate totals
      const newTotals = calculateMockTotals(updatedItinerary, pricingConfig);
      setPricingTotals(newTotals);
    }
  };

  const handlePricingConfigUpdate = (config: PricingConfig) => {
    setPricingConfig(config);
    
    if (parsedItinerary) {
      const newTotals = calculateMockTotals(parsedItinerary, config);
      setPricingTotals(newTotals);
    }
  };

  const handleExportJSON = () => {
    if (!parsedItinerary || !pricingTotals || !itineraryInput) return;
    
    const quotation = {
      input: itineraryInput,
      parsed_itinerary: parsedItinerary,
      pricing_config: pricingConfig,
      pricing_totals: pricingTotals,
      created_at: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(quotation, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `egypt-quotation-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    console.log('PDF export triggered - would generate professional quotation PDF');
    alert('PDF export functionality ready for implementation');
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 'input':
        return parsedItinerary !== null;
      case 'breakdown':
        return pricingTotals !== null;
      case 'pricing':
        return pricingTotals !== null;
      default:
        return false;
    }
  };

  const stepNavigation = [
    { id: 'input', label: 'Input' },
    { id: 'breakdown', label: 'Breakdown' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'export', label: 'Export' }
  ];
  
  const currentStepIndex = stepNavigation.findIndex(s => s.id === currentStep);

  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <div className="min-h-screen bg-background">
        <AppHeader currentStep={currentStep} />
        
        <main className="container mx-auto px-4 py-8">
          {/* Step Content */}
          {currentStep === 'input' && (
            <div className="max-w-4xl mx-auto">
              <ItineraryInputForm 
                onSubmit={handleProcessItinerary} 
                isLoading={isProcessing}
              />
              
              {isProcessing && (
                <div className="mt-6">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Processing itinerary text and detecting services. This may take a moment...
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          )}
          
          {currentStep === 'breakdown' && parsedItinerary && (
            <div className="space-y-6">
              {/* Overview */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Itinerary Overview</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{parsedItinerary.overview.num_days}</div>
                    <div className="text-sm text-muted-foreground">Days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{parsedItinerary.overview.num_people}</div>
                    <div className="text-sm text-muted-foreground">People</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{parsedItinerary.overview.cities_detected.length}</div>
                    <div className="text-sm text-muted-foreground">Cities</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {parsedItinerary.days.reduce((acc, day) => acc + day.per_group.length + day.per_person.length, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Services</div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {parsedItinerary.overview.cities_detected.map(city => (
                    <Badge key={city} variant="secondary">{city}</Badge>
                  ))}
                </div>
              </div>
              
              {/* Daily Breakdowns */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Daily Service Breakdown</h2>
                {parsedItinerary.days.map(day => (
                  <DailyBreakdownCard
                    key={day.day}
                    day={day}
                    onUpdateService={handleServiceUpdate}
                    showPricing={false}
                  />
                ))}
              </div>
              
              {/* Assumptions and Missing Info */}
              {(parsedItinerary.assumptions.length > 0 || parsedItinerary.missing_info.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {parsedItinerary.assumptions.length > 0 && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Assumptions Made:</strong>
                        <ul className="mt-2 space-y-1">
                          {parsedItinerary.assumptions.map((assumption, index) => (
                            <li key={index} className="text-sm">• {assumption}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {parsedItinerary.missing_info.length > 0 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Missing Information:</strong>
                        <ul className="mt-2 space-y-1">
                          {parsedItinerary.missing_info.map((missing, index) => (
                            <li key={index} className="text-sm">• {missing}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          )}
          
          {currentStep === 'pricing' && parsedItinerary && pricingTotals && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Daily Breakdowns with Pricing */}
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-xl font-semibold">Service Pricing</h2>
                {parsedItinerary.days.map(day => {
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
              
              {/* Pricing Configuration */}
              <div className="lg:col-span-1">
                <PricingConfigPanel
                  config={pricingConfig}
                  onUpdate={handlePricingConfigUpdate}
                />
              </div>
              
              {/* Pricing Summary */}
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
          
          {currentStep === 'export' && pricingTotals && (
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <div className="space-y-4">
                <CheckCircle className="h-16 w-16 text-primary mx-auto" />
                <h2 className="text-2xl font-semibold">Quotation Ready</h2>
                <p className="text-muted-foreground">
                  Your Egypt itinerary has been processed and priced. Download your quotation in the format you prefer.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                <Button size="lg" onClick={handleExportJSON} data-testid="button-final-export-json">
                  Download JSON
                </Button>
                <Button size="lg" variant="outline" onClick={handleExportPDF} data-testid="button-final-export-pdf">
                  Download PDF
                </Button>
              </div>
              
              {pricingTotals && (
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Final Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary">
                        {Math.round(pricingTotals.sell_per_person / pricingConfig.rounding_increment) * pricingConfig.rounding_increment} {pricingConfig.currency}
                      </div>
                      <div className="text-sm text-muted-foreground">Per Person</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">
                        {Math.round(pricingTotals.sell_per_group / pricingConfig.rounding_increment) * pricingConfig.rounding_increment} {pricingConfig.currency}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Group</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Navigation Footer */}
          {currentStep !== 'input' && (
            <div className="fixed bottom-6 right-6 flex gap-2">
              {currentStepIndex > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(stepNavigation[currentStepIndex - 1].id as AppStep)}
                  data-testid="button-previous-step"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}
              
              {currentStepIndex < stepNavigation.length - 1 && canProceedToNext() && (
                <Button
                  onClick={() => setCurrentStep(stepNavigation[currentStepIndex + 1].id as AppStep)}
                  data-testid="button-next-step"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          )}
        </main>
      </div>
    </ThemeProvider>
  );
}