import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Sparkles, 
  FileText, 
  Users, 
  Calendar, 
  CheckCircle, 
  AlertTriangle,
  DollarSign,
  MapPin,
  Info
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

const analysisSchema = z.object({
  itineraryText: z.string().min(50, "Itinerary must be at least 50 characters"),
  numPeople: z.number().min(1).max(100),
  numDays: z.number().min(1).max(30),
});

type AnalysisInput = z.infer<typeof analysisSchema>;

interface AnalyzerProps {
  onComplete: (result: any) => void;
}

// Category labels for display
const categoryLabels: Record<string, { label: string; icon: string; color: string }> = {
  transportation: { label: "Transportation", icon: "🚗", color: "bg-blue-100 text-blue-800" },
  guide_personnel: { label: "Guides & Personnel", icon: "👨‍🏫", color: "bg-purple-100 text-purple-800" },
  entrance_fees: { label: "Entrance Fees", icon: "🎫", color: "bg-green-100 text-green-800" },
  accommodation: { label: "Accommodation", icon: "🏨", color: "bg-orange-100 text-orange-800" },
  meals: { label: "Meals", icon: "🍽️", color: "bg-yellow-100 text-yellow-800" },
  optional_extras: { label: "Optional Extras", icon: "⭐", color: "bg-pink-100 text-pink-800" },
  other: { label: "Other", icon: "📋", color: "bg-gray-100 text-gray-800" }
};

export default function NewItineraryAnalyzer({ onComplete }: AnalyzerProps) {
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<AnalysisInput>({
    resolver: zodResolver(analysisSchema),
    defaultValues: {
      numDays: 7,
      numPeople: 2,
      itineraryText: "",
    },
  });

  const analysisMutation = useMutation({
    mutationFn: async (data: AnalysisInput) => {
      const response = await apiRequest("POST", "/api/analyze-itinerary", data);
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setAnalysisResult(data.data);
      } else {
        throw new Error(data.message || 'Analysis failed');
      }
    },
  });

  const watchedText = watch("itineraryText");
  const textLength = watchedText?.length || 0;

  const handleAnalyze = (data: AnalysisInput) => {
    analysisMutation.mutate(data);
  };

  const handleContinue = () => {
    if (analysisResult) {
      onComplete(analysisResult);
    }
  };

  const completionRate = analysisResult 
    ? (analysisResult.summary.services_with_prices / analysisResult.summary.total_services) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card data-testid="card-itinerary-input">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Itinerary Analysis
          </CardTitle>
          <CardDescription>
            Paste your complete itinerary below. The system will automatically identify all services and match them with prices from your database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleAnalyze)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numDays" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Number of Days
                </Label>
                <Input
                  id="numDays"
                  type="number"
                  min="1"
                  max="30"
                  data-testid="input-num-days"
                  {...register("numDays", { valueAsNumber: true })}
                  className={errors.numDays ? "border-destructive" : ""}
                />
                {errors.numDays && (
                  <p className="text-sm text-destructive">{errors.numDays.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="numPeople" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Number of People
                </Label>
                <Input
                  id="numPeople"
                  type="number"
                  min="1"
                  max="100"
                  data-testid="input-num-people"
                  {...register("numPeople", { valueAsNumber: true })}
                  className={errors.numPeople ? "border-destructive" : ""}
                />
                {errors.numPeople && (
                  <p className="text-sm text-destructive">{errors.numPeople.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="itineraryText" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Complete Tour Itinerary
              </Label>
              <Textarea
                id="itineraryText"
                data-testid="textarea-itinerary"
                placeholder={`Example itinerary:

Day 1 - Arrival in Cairo
Flight arrival at Cairo Airport at 14:30. Meet and assist upon arrival. Private transfer to hotel in Cairo. Check-in at hotel. Evening at leisure.

Day 2 - Cairo City Tour
Breakfast at hotel. Full-day tour of Cairo with English-speaking guide. Visit the Pyramids of Giza and Sphinx. Entry tickets included. Lunch at local restaurant. Visit the Egyptian Museum with entrance ticket. Return to hotel.

Day 3 - Travel to Luxor
Breakfast and hotel checkout. Transfer to Cairo Airport. Domestic flight to Luxor. Meet and assist in Luxor. Transfer to hotel. Check-in and evening free.

...continue with your complete itinerary`}
                className="min-h-[300px] resize-none font-mono text-sm"
                {...register("itineraryText")}
              />
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>{textLength} characters</span>
                {errors.itineraryText && (
                  <span className="text-destructive">{errors.itineraryText.message}</span>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                size="lg"
                disabled={analysisMutation.isPending}
                className="px-8"
                data-testid="button-analyze"
              >
                {analysisMutation.isPending ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyze Itinerary
                  </>
                )}
              </Button>
            </div>
          </form>

          {analysisMutation.isError && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {analysisMutation.error?.message || 'Analysis failed. Please try again.'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysisResult && (
        <>
          {/* Summary Card */}
          <Card data-testid="card-analysis-summary">
            <CardHeader>
              <CardTitle>Analysis Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary" data-testid="text-total-days">
                    {analysisResult.summary.total_days}
                  </div>
                  <div className="text-sm text-muted-foreground">Days</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary" data-testid="text-total-people">
                    {analysisResult.summary.total_people}
                  </div>
                  <div className="text-sm text-muted-foreground">People</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600" data-testid="text-total-services">
                    {analysisResult.summary.total_services}
                  </div>
                  <div className="text-sm text-muted-foreground">Services</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600" data-testid="text-services-priced">
                    {analysisResult.summary.services_with_prices}
                  </div>
                  <div className="text-sm text-muted-foreground">Priced</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600" data-testid="text-services-missing">
                    {analysisResult.summary.services_without_prices}
                  </div>
                  <div className="text-sm text-muted-foreground">Missing</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Pricing Completion</span>
                  <span className="text-sm text-muted-foreground">{completionRate.toFixed(0)}%</span>
                </div>
                <Progress value={completionRate} className="h-2" data-testid="progress-completion" />
              </div>

              <Separator className="my-4" />

              <div className="flex items-center gap-2 flex-wrap">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Locations:</span>
                {analysisResult.summary.cities.map((city: string) => (
                  <Badge key={city} variant="secondary">{city}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Missing Prices Alert */}
          {analysisResult.missing_prices.length > 0 && (
            <Alert variant="destructive" data-testid="alert-missing-prices">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Missing Price Data</AlertTitle>
              <AlertDescription>
                <p className="mb-3">The following services don't have prices in your database. Add them to get accurate quotations:</p>
                <div className="space-y-2">
                  {analysisResult.missing_prices.map((missing: any, index: number) => (
                    <div key={index} className="bg-background/50 p-3 rounded border border-destructive/20">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{categoryLabels[missing.category]?.icon || "📋"}</span>
                        <div className="flex-1">
                          <p className="font-medium">{missing.description}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            <Info className="h-3 w-3 inline mr-1" />
                            {missing.hint}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Services by Day */}
          <Card data-testid="card-services-breakdown">
            <CardHeader>
              <CardTitle>Services Breakdown</CardTitle>
              <CardDescription>Detailed list of all services organized by day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {analysisResult.services_by_day.map((day: any) => (
                  <div key={day.day} className="border rounded-lg p-4" data-testid={`day-${day.day}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{day.label}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {day.location}
                        </p>
                      </div>
                      <Badge variant="outline">{day.services.length} services</Badge>
                    </div>

                    <div className="space-y-2">
                      {day.services.map((match: any, idx: number) => {
                        const category = categoryLabels[match.service.category] || categoryLabels.other;
                        return (
                          <div 
                            key={idx} 
                            className="flex items-start gap-3 p-3 bg-muted/30 rounded"
                            data-testid={`service-${day.day}-${idx}`}
                          >
                            <span className="text-xl">{category.icon}</span>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{match.service.description}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge className={category.color} variant="secondary">
                                      {category.label}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {match.service.quantity} × {match.service.cost_basis.replace('_', ' ')}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  {match.matched ? (
                                    <div>
                                      <p className="font-bold text-green-600" data-testid={`price-${day.day}-${idx}`}>
                                        {match.price?.toFixed(2)} {match.currency}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {match.confidence}% match
                                      </p>
                                    </div>
                                  ) : (
                                    <Badge variant="destructive">No Price</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pricing Summary */}
          <Card data-testid="card-pricing-summary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-primary/5 rounded-lg border">
                    <p className="text-sm text-muted-foreground mb-1">Per Person</p>
                    <p className="text-3xl font-bold" data-testid="text-per-person-total">
                      {analysisResult.pricing.per_person_total.toFixed(2)} {analysisResult.pricing.currency}
                    </p>
                  </div>
                  <div className="p-4 bg-primary/10 rounded-lg border">
                    <p className="text-sm text-muted-foreground mb-1">Total Group</p>
                    <p className="text-3xl font-bold" data-testid="text-per-group-total">
                      {analysisResult.pricing.per_group_total.toFixed(2)} {analysisResult.pricing.currency}
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-3">Breakdown by Category</h4>
                  <div className="space-y-2">
                    {analysisResult.pricing.breakdown_by_category.map((cat: any) => {
                      const category = categoryLabels[cat.category] || categoryLabels.other;
                      return (
                        <div key={cat.category} className="flex justify-between items-center p-2 rounded hover:bg-muted/50">
                          <div className="flex items-center gap-2">
                            <span>{category.icon}</span>
                            <span className="text-sm">{category.label}</span>
                            <Badge variant="outline" className="text-xs">{cat.count}</Badge>
                          </div>
                          <span className="font-medium">
                            {cat.total.toFixed(2)} {analysisResult.pricing.currency}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {analysisResult.recommendations.length > 0 && (
            <Card data-testid="card-recommendations">
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysisResult.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={() => setAnalysisResult(null)} data-testid="button-analyze-new">
              Analyze New Itinerary
            </Button>
            <Button size="lg" onClick={handleContinue} data-testid="button-continue">
              Continue to Final Quotation
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
