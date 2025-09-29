import { useState } from 'react';
import PricingConfigPanel from '../PricingConfigPanel';
import type { PricingConfig } from '@shared/schema';

export default function PricingConfigPanelExample() {
  const [config, setConfig] = useState<PricingConfig>({
    currency: 'EGP',
    exchange_rate: 1.0,
    tax_rate: 0.12,
    markup_rate: 0.20,
    rounding_increment: 50,
    accommodation_mode: 'per_person',
    occupancy: 2,
    single_supplement: undefined,
    profile: 'Base'
  });

  const handleConfigUpdate = (newConfig: PricingConfig) => {
    console.log('Pricing config updated:', newConfig);
    setConfig(newConfig);
  };

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-md mx-auto">
        <PricingConfigPanel 
          config={config} 
          onUpdate={handleConfigUpdate}
        />
      </div>
    </div>
  );
}