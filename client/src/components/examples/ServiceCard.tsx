import { useState } from 'react';
import ServiceCard from '../ServiceCard';
import type { Service } from '@shared/schema';

export default function ServiceCardExample() {
  const [perGroupService, setPerGroupService] = useState<Service>({
    service: "Meet & Assist service at airport",
    reason: "Airport arrival detected in itinerary",
    quantity: 1,
    unitPrice: 150,
    included: true
  });

  const [perPersonService, setPerPersonService] = useState<Service>({
    service: "Entrance Fees to attractions",
    reason: "Pyramids and museum visits detected",
    quantity: 1,
    unitPrice: 250,
    included: true,
    override: "Premium package rate applied"
  });

  return (
    <div className="p-8 bg-background min-h-screen space-y-6">
      <div className="max-w-2xl">
        <h3 className="text-lg font-semibold mb-4">Per Group Service</h3>
        <ServiceCard
          service={perGroupService}
          isPerGroup={true}
          onUpdate={setPerGroupService}
          showPricing={true}
          currency="EGP"
        />
      </div>
      
      <div className="max-w-2xl">
        <h3 className="text-lg font-semibold mb-4">Per Person Service</h3>
        <ServiceCard
          service={perPersonService}
          isPerGroup={false}
          onUpdate={setPerPersonService}
          showPricing={true}
          currency="USD"
        />
      </div>
    </div>
  );
}