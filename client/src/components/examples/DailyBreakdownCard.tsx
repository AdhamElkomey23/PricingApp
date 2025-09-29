import { useState } from 'react';
import DailyBreakdownCard from '../DailyBreakdownCard';
import type { DailyBreakdown, Service } from '@shared/schema';

export default function DailyBreakdownCardExample() {
  const [sampleDay, setSampleDay] = useState<DailyBreakdown>({
    day: 1,
    label: "Arrival in Cairo",
    city_or_region: "Cairo (CAI)",
    activities_detected: ["Airport arrival", "Hotel check-in", "Evening leisure"],
    per_group: [
      {
        service: "Meet & Assist service at airport",
        reason: "Airport arrival detected in itinerary",
        quantity: 1,
        unitPrice: 150,
        included: true
      },
      {
        service: "Transfer to hotel from airport",
        reason: "Airport arrival detected in itinerary",
        quantity: 1,
        unitPrice: 200,
        included: true
      },
      {
        service: "Hotel Checkin Assist",
        reason: "Hotel check-in detected",
        quantity: 1,
        unitPrice: 75,
        included: false
      }
    ],
    per_person: [
      {
        service: "Accommodation at hotels, Dahabiya or Nile Cruise",
        reason: "Hotel stay detected",
        quantity: 1,
        nights: 1,
        board: "BB",
        unitPrice: 120,
        included: true
      }
    ],
    notes: "Evening at leisure - no additional services required"
  });

  const handleServiceUpdate = (dayNumber: number, serviceIndex: number, service: Service, isPerGroup: boolean) => {
    console.log('Service updated:', { dayNumber, serviceIndex, service, isPerGroup });
    setSampleDay(prev => {
      const updated = { ...prev };
      if (isPerGroup) {
        updated.per_group = [...updated.per_group];
        updated.per_group[serviceIndex] = service;
      } else {
        updated.per_person = [...updated.per_person];
        updated.per_person[serviceIndex] = service;
      }
      return updated;
    });
  };

  const dayTotal = 545; // Mock calculated total

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto">
        <DailyBreakdownCard
          day={sampleDay}
          onUpdateService={handleServiceUpdate}
          showPricing={true}
          currency="EGP"
          dayTotal={dayTotal}
        />
      </div>
    </div>
  );
}