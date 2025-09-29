import PricingSummaryPanel from '../PricingSummaryPanel';
import type { PricingTotals, PricingConfig } from '@shared/schema';

export default function PricingSummaryPanelExample() {
  const mockTotals: PricingTotals = {
    net_per_person: 1250.75,
    tax_amount: 150.09,
    markup_amount: 280.17,
    sell_per_person: 1681.01,
    sell_per_group: 3362.02,
    daily_totals: [
      { day: 1, net_total: 545.00, sell_total: 725.20 },
      { day: 2, net_total: 620.30, sell_total: 826.00 },
      { day: 3, net_total: 485.20, sell_total: 646.12 },
      { day: 4, net_total: 350.00, sell_total: 466.50 },
      { day: 5, net_total: 501.50, sell_total: 668.00 }
    ]
  };

  const mockConfig: PricingConfig = {
    currency: 'EGP',
    exchange_rate: 1.0,
    tax_rate: 0.12,
    markup_rate: 0.20,
    rounding_increment: 50,
    accommodation_mode: 'per_person',
    occupancy: 2,
    profile: '+Tickets+Lunch'
  };

  const handleExportJSON = () => {
    console.log('Exporting JSON quotation');
  };

  const handleExportPDF = () => {
    console.log('Exporting PDF quotation');
  };

  const handleShareQuotation = () => {
    console.log('Sharing quotation');
  };

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-sm mx-auto">
        <PricingSummaryPanel
          totals={mockTotals}
          config={mockConfig}
          onExportJSON={handleExportJSON}
          onExportPDF={handleExportPDF}
          onShareQuotation={handleShareQuotation}
        />
      </div>
    </div>
  );
}