import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calculator, Download, FileText, Share } from "lucide-react";
import type { PricingTotals, PricingConfig } from "@shared/schema";

interface PricingSummaryPanelProps {
  totals: PricingTotals;
  config: PricingConfig;
  onExportJSON: () => void;
  onExportPDF: () => void;
  onShareQuotation?: () => void;
}

export default function PricingSummaryPanel({ 
  totals, 
  config, 
  onExportJSON, 
  onExportPDF, 
  onShareQuotation 
}: PricingSummaryPanelProps) {
  const formatCurrency = (amount: number) => {
    const rounded = Math.round(amount / config.rounding_increment) * config.rounding_increment;
    return `${rounded.toFixed(2)} ${config.currency}`;
  };

  const taxPercentage = (config.tax_rate * 100).toFixed(1);
  const markupPercentage = (config.markup_rate * 100).toFixed(1);

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Pricing Summary
        </CardTitle>
        <CardDescription>
          Total costs and quotation breakdown
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Package Profile Badge */}
        <div className="flex justify-center">
          <Badge variant="outline" className="text-sm px-3 py-1">
            {config.profile} Package
          </Badge>
        </div>

        {/* Pricing Breakdown */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Net / Person</span>
            <span className="font-medium" data-testid="text-net-per-person">
              {formatCurrency(totals.net_per_person)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Tax ({taxPercentage}%)</span>
            <span className="font-medium" data-testid="text-tax-amount">
              {formatCurrency(totals.tax_amount)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Markup ({markupPercentage}%)</span>
            <span className="font-medium" data-testid="text-markup-amount">
              {formatCurrency(totals.markup_amount)}
            </span>
          </div>
          
          <Separator />
          
          <div className="flex justify-between items-center text-lg">
            <span className="font-semibold">Sell / Person</span>
            <span className="font-bold text-primary" data-testid="text-sell-per-person">
              {formatCurrency(totals.sell_per_person)}
            </span>
          </div>
          
          <div className="flex justify-between items-center text-xl">
            <span className="font-semibold">Total / Group</span>
            <span className="font-bold text-primary" data-testid="text-sell-per-group">
              {formatCurrency(totals.sell_per_group)}
            </span>
          </div>
        </div>

        {/* Daily Totals Preview */}
        {totals.daily_totals.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Daily Breakdown</h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {totals.daily_totals.map((dayTotal) => (
                  <div key={dayTotal.day} className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Day {dayTotal.day}</span>
                    <span className="font-medium">
                      {formatCurrency(dayTotal.sell_total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Export Actions */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Export Options</h4>
          
          <div className="space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={onExportJSON}
              data-testid="button-export-json"
            >
              <FileText className="h-4 w-4 mr-2" />
              Download JSON
            </Button>
            
            <Button 
              variant="default" 
              size="sm" 
              className="w-full justify-start"
              onClick={onExportPDF}
              data-testid="button-export-pdf"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF Quotation
            </Button>
            
            {onShareQuotation && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={onShareQuotation}
                data-testid="button-share-quotation"
              >
                <Share className="h-4 w-4 mr-2" />
                Share Quotation
              </Button>
            )}
          </div>
        </div>

        {/* Currency Info */}
        <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
          <div className="flex justify-between">
            <span>Exchange Rate:</span>
            <span>{config.exchange_rate.toFixed(4)}</span>
          </div>
          <div className="flex justify-between">
            <span>Rounding:</span>
            <span>Nearest {config.rounding_increment} {config.currency}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}