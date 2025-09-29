import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, DollarSign, Package, Calculator } from "lucide-react";
import type { PricingConfig, Currency, PricingProfile } from "@shared/schema";

interface PricingConfigPanelProps {
  config: PricingConfig;
  onUpdate: (config: PricingConfig) => void;
}

export default function PricingConfigPanel({ config, onUpdate }: PricingConfigPanelProps) {
  const handleFieldUpdate = (field: keyof PricingConfig, value: any) => {
    onUpdate({ ...config, [field]: value });
  };

  const profileDescriptions: Record<PricingProfile, string> = {
    "Base": "Car, guide, parking, fees (no entrance tickets, no lunch)",
    "+Tickets": "Base package plus entrance fees to attractions", 
    "+Tickets+Lunch": "Full package with tickets and meals at local restaurants"
  };

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Pricing Configuration
        </CardTitle>
        <CardDescription>
          Configure pricing parameters and package options
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Package Profile Selection */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Package Profile
          </Label>
          <Select 
            value={config.profile} 
            onValueChange={(value: PricingProfile) => handleFieldUpdate('profile', value)}
          >
            <SelectTrigger data-testid="select-pricing-profile">
              <SelectValue placeholder="Select profile" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Base">Base Package</SelectItem>
              <SelectItem value="+Tickets">+ Tickets Package</SelectItem>
              <SelectItem value="+Tickets+Lunch">+ Tickets + Lunch</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {profileDescriptions[config.profile]}
          </p>
        </div>

        <Separator />

        {/* Currency and Exchange */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Currency
            </Label>
            <Select 
              value={config.currency} 
              onValueChange={(value: Currency) => handleFieldUpdate('currency', value)}
            >
              <SelectTrigger data-testid="select-currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Exchange Rate</Label>
            <Input
              type="number"
              step="0.01"
              value={config.exchange_rate}
              onChange={(e) => handleFieldUpdate('exchange_rate', parseFloat(e.target.value) || 1)}
              data-testid="input-exchange-rate"
            />
          </div>
        </div>

        {/* Tax and Markup */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tax Rate (%)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={config.tax_rate * 100}
              onChange={(e) => handleFieldUpdate('tax_rate', (parseFloat(e.target.value) || 0) / 100)}
              data-testid="input-tax-rate"
            />
          </div>

          <div className="space-y-2">
            <Label>Markup Rate (%)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={config.markup_rate * 100}
              onChange={(e) => handleFieldUpdate('markup_rate', (parseFloat(e.target.value) || 0) / 100)}
              data-testid="input-markup-rate"
            />
          </div>
        </div>

        {/* Accommodation Settings */}
        <div className="space-y-3">
          <Label>Accommodation Mode</Label>
          <Select 
            value={config.accommodation_mode} 
            onValueChange={(value: 'per_person' | 'per_room') => handleFieldUpdate('accommodation_mode', value)}
          >
            <SelectTrigger data-testid="select-accommodation-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="per_person">Per Person per Night</SelectItem>
              <SelectItem value="per_room">Per Room per Night</SelectItem>
            </SelectContent>
          </Select>

          {config.accommodation_mode === 'per_room' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Occupancy</Label>
                <Input
                  type="number"
                  min="1"
                  max="6"
                  value={config.occupancy}
                  onChange={(e) => handleFieldUpdate('occupancy', parseInt(e.target.value) || 2)}
                  data-testid="input-occupancy"
                />
              </div>

              <div className="space-y-2">
                <Label>Single Supplement</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={config.single_supplement || ''}
                  onChange={(e) => handleFieldUpdate('single_supplement', parseFloat(e.target.value) || undefined)}
                  placeholder="Optional"
                  data-testid="input-single-supplement"
                />
              </div>
            </div>
          )}
        </div>

        {/* Rounding */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Rounding Increment
          </Label>
          <Select 
            value={config.rounding_increment.toString()} 
            onValueChange={(value) => handleFieldUpdate('rounding_increment', parseInt(value))}
          >
            <SelectTrigger data-testid="select-rounding">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">No rounding</SelectItem>
              <SelectItem value="5">Round to nearest 5</SelectItem>
              <SelectItem value="10">Round to nearest 10</SelectItem>
              <SelectItem value="25">Round to nearest 25</SelectItem>
              <SelectItem value="50">Round to nearest 50</SelectItem>
              <SelectItem value="100">Round to nearest 100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Quick Actions */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Quick Presets</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onUpdate({
                ...config,
                tax_rate: 0.12,
                markup_rate: 0.20,
                currency: 'EGP',
                rounding_increment: 50
              })}
              data-testid="button-egypt-preset"
            >
              Egypt Standard
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onUpdate({
                ...config,
                tax_rate: 0.10,
                markup_rate: 0.25,
                currency: 'USD',
                rounding_increment: 5
              })}
              data-testid="button-international-preset"
            >
              International
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}