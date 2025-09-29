import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, MapPin, Calendar, Info } from "lucide-react";
import ServiceCard from "./ServiceCard";
import type { DailyBreakdown, Service } from "@shared/schema";

interface DailyBreakdownCardProps {
  day: DailyBreakdown;
  onUpdateService: (dayNumber: number, serviceIndex: number, service: Service, isPerGroup: boolean) => void;
  showPricing?: boolean;
  currency?: string;
  dayTotal?: number;
}

export default function DailyBreakdownCard({ 
  day, 
  onUpdateService, 
  showPricing = false, 
  currency = "EGP",
  dayTotal = 0
}: DailyBreakdownCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const totalServices = day.per_group.length + day.per_person.length;
  const includedServices = day.per_group.filter(s => s.included).length + 
                          day.per_person.filter(s => s.included).length;

  const handleServiceUpdate = (serviceIndex: number, service: Service, isPerGroup: boolean) => {
    onUpdateService(day.day, serviceIndex, service, isPerGroup);
  };

  return (
    <Card className="w-full">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover-elevate transition-colors">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">
                    {day.label}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    Day {day.day}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {day.city_or_region}
                  </div>
                  <div className="flex items-center gap-1">
                    <span>{includedServices} of {totalServices} services included</span>
                  </div>
                  {showPricing && dayTotal > 0 && (
                    <div className="font-medium text-primary">
                      Total: {dayTotal.toFixed(2)} {currency}
                    </div>
                  )}
                </div>
                
                {day.activities_detected.length > 0 && (
                  <CardDescription className="flex flex-wrap gap-1">
                    {day.activities_detected.map((activity, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {activity}
                      </Badge>
                    ))}
                  </CardDescription>
                )}
              </div>
              
              <Button variant="ghost" size="sm" data-testid={`button-expand-day-${day.day}`}>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            {day.notes && (
              <div className="mb-4 p-3 bg-muted/50 rounded-md border-l-4 border-primary">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">{day.notes}</p>
                </div>
              </div>
            )}
            
            <div className="space-y-6">
              {day.per_group.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Per Group Services
                  </h4>
                  <div className="space-y-2">
                    {day.per_group.map((service, index) => (
                      <ServiceCard
                        key={`group-${index}`}
                        service={service}
                        isPerGroup={true}
                        onUpdate={(updatedService) => handleServiceUpdate(index, updatedService, true)}
                        showPricing={showPricing}
                        currency={currency}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {day.per_person.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Per Person Services
                  </h4>
                  <div className="space-y-2">
                    {day.per_person.map((service, index) => (
                      <ServiceCard
                        key={`person-${index}`}
                        service={service}
                        isPerGroup={false}
                        onUpdate={(updatedService) => handleServiceUpdate(index, updatedService, false)}
                        showPricing={showPricing}
                        currency={currency}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {totalServices === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No services detected for this day</p>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}