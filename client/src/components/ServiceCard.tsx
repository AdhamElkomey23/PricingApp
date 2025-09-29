import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Edit2, Check, X, DollarSign } from "lucide-react";
import type { Service } from "@shared/schema";

interface ServiceCardProps {
  service: Service;
  isPerGroup?: boolean;
  onUpdate: (service: Service) => void;
  showPricing?: boolean;
  currency?: string;
}

export default function ServiceCard({ 
  service, 
  isPerGroup = false, 
  onUpdate, 
  showPricing = false,
  currency = "EGP"
}: ServiceCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    unitPrice: service.unitPrice || 0,
    quantity: service.quantity || 1,
    override: service.override || ""
  });

  const handleToggleIncluded = (included: boolean) => {
    onUpdate({ ...service, included });
  };

  const handleSaveEdit = () => {
    onUpdate({
      ...service,
      unitPrice: editValues.unitPrice,
      quantity: editValues.quantity,
      override: editValues.override
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditValues({
      unitPrice: service.unitPrice || 0,
      quantity: service.quantity || 1,
      override: service.override || ""
    });
    setIsEditing(false);
  };

  const subtotal = (service.unitPrice || 0) * (service.quantity || 1);

  return (
    <Card className={`transition-all duration-200 ${
      service.included 
        ? "border-border bg-card" 
        : "border-muted bg-muted/20 opacity-60"
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-card-foreground truncate">
                {service.service}
              </h4>
              <Badge 
                variant={isPerGroup ? "default" : "secondary"} 
                className="text-xs shrink-0"
              >
                {isPerGroup ? "Per Group" : "Per Person"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {service.reason}
            </p>
            {service.override && (
              <p className="text-xs text-primary bg-primary/10 px-2 py-1 rounded mt-2">
                Override: {service.override}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center space-x-2">
              <Switch
                checked={service.included}
                onCheckedChange={handleToggleIncluded}
                data-testid={`switch-service-${service.service.replace(/\s+/g, '-').toLowerCase()}`}
              />
              <Label className="text-xs text-muted-foreground">
                Include
              </Label>
            </div>
          </div>
        </div>
      </CardHeader>
      
      {showPricing && (
        <CardContent className="pt-0">
          <div className="border-t border-border pt-3">
            {isEditing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Unit Price</Label>
                    <Input
                      type="number"
                      value={editValues.unitPrice}
                      onChange={(e) => setEditValues(prev => ({
                        ...prev,
                        unitPrice: parseFloat(e.target.value) || 0
                      }))}
                      className="h-8"
                      data-testid="input-unit-price"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Quantity</Label>
                    <Input
                      type="number"
                      value={editValues.quantity}
                      onChange={(e) => setEditValues(prev => ({
                        ...prev,
                        quantity: parseInt(e.target.value) || 1
                      }))}
                      className="h-8"
                      data-testid="input-quantity"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Override Note</Label>
                  <Input
                    value={editValues.override}
                    onChange={(e) => setEditValues(prev => ({
                      ...prev,
                      override: e.target.value
                    }))}
                    placeholder="Optional override note"
                    className="h-8"
                    data-testid="input-override"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                    data-testid="button-cancel-edit"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    data-testid="button-save-edit"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-3 w-3" />
                    <span className="font-medium">
                      {service.unitPrice?.toFixed(2) || "0.00"} {currency}
                    </span>
                    {(service.quantity || 1) > 1 && (
                      <span className="text-muted-foreground">
                        × {service.quantity}
                      </span>
                    )}
                  </div>
                  {subtotal > 0 && (
                    <div className="text-sm font-medium text-primary">
                      Total: {subtotal.toFixed(2)} {currency}
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  data-testid="button-edit-service"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}