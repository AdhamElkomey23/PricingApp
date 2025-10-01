
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Brain, 
  FileText, 
  Users, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp,
  Database,
  Lightbulb
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

interface AnalysisResult {
  parsedItinerary: any;
  priceMatches: any[];
  missingPrices: string[];
  recommendations: string[];
}

interface AnalyzerProps {
  onAnalysisComplete: (result: AnalysisResult) => void;
}

export default function SmartItineraryAnalyzer({ onAnalysisComplete }: AnalyzerProps) {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
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
        onAnalysisComplete(data.data);
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

  const renderAnalysisResults = () => {
    if (!analysisResult) return null;

    const { priceMatches, missingPrices, recommendations, parsedItinerary } = analysisResult;
    const servicesWithPrices = priceMatches.filter(m => m.priceFound).length;
    const totalServices = priceMatches.length;
    const completionRate = totalServices > 0 ? (servicesWithPrices / totalServices) * 100 : 0;

    return (
      <div className="space-y-6 mt-6">
        {/* Analysis Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Analysis Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{parsedItinerary.overview.num_days}</div>
                <div className="text-sm text-muted-foreground">Days</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{totalServices}</div>
                <div className="text-sm text-muted-foreground">Services Found</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{servicesWithPrices}</div>
                <div className="text-sm text-muted-foreground">Prices Found</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">{missingPrices.length}</div>
                <div className="text-sm text-muted-foreground">Missing Prices</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Pricing Completion</span>
                <span className="text-sm text-muted-foreground">{completionRate.toFixed(0)}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {parsedItinerary.overview.cities_detected.map((city: string) => (
                <Badge key={city} variant="secondary">{city}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Missing Prices Alert */}
        {missingPrices.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Missing Price Data ({missingPrices.length} items):</strong>
              <ul className="mt-2 space-y-1 text-sm">
                {missingPrices.slice(0, 5).map((missing, index) => (
                  <li key={index}>• {missing}</li>
                ))}
                {missingPrices.length > 5 && (
                  <li className="text-muted-foreground">... and {missingPrices.length - 5} more</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                AI Recommendations
              </CardTitle>
              <CardDescription>
                Suggestions to improve pricing accuracy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-sm">{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Service Confidence Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-500" />
              Service Matching Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {priceMatches.slice(0, 10).map((match, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{match.service.service}</div>
                    <div className="text-xs text-muted-foreground">{match.service.location}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {match.priceFound ? (
                      <Badge variant="default" className="bg-green-500">
                        {match.dbMatch?.unit_price?.toFixed(2)} {match.dbMatch?.currency}
                      </Badge>
                    ) : (
                      <Badge variant="destructive">No Price</Badge>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {match.confidence}% match
                    </div>
                  </div>
                </div>
              ))}
              {priceMatches.length > 10 && (
                <div className="text-center text-sm text-muted-foreground">
                  ... and {priceMatches.length - 10} more services
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Smart Itinerary Analyzer
          </CardTitle>
          <CardDescription>
            AI-powered itinerary analysis with automatic price matching from your database
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
                Full Tour Itinerary
              </Label>
              <p className="text-sm text-muted-foreground">
                Paste your complete itinerary. The AI will automatically identify transportation, guides, entrance fees, accommodation, and other services.
              </p>
              <Textarea
                id="itineraryText"
                placeholder={`Day 1 - Arrival in Cairo
Flight arrival at Cairo International Airport at 14:30. Meet and assist service upon arrival. Transfer to hotel in downtown Cairo. Evening at leisure.

Day 2 - Cairo City Tour  
Breakfast at hotel. Full-day tour of Cairo including the Pyramids of Giza and Sphinx. Lunch at local restaurant. Visit Egyptian Museum. Professional tour guide included. Return to hotel.

Day 3 - Travel to Luxor
Morning checkout and transfer to Cairo Airport. Domestic flight to Luxor. Meet and assist in Luxor. Transfer to hotel. Check-in and evening at leisure.

...continue with your full itinerary`}
                className="min-h-[300px] resize-none"
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
              >
                {analysisMutation.isPending ? (
                  <>
                    <Brain className="h-4 w-4 mr-2 animate-pulse" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
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

      {renderAnalysisResults()}
    </div>
  );
}
