import { useState } from 'react';
import { ThemeProvider } from 'next-themes';
import AppHeader from '../AppHeader';

export default function AppHeaderExample() {
  const [currentStep, setCurrentStep] = useState<'input' | 'breakdown' | 'pricing' | 'export'>('breakdown');

  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <div className="min-h-screen bg-background">
        <AppHeader currentStep={currentStep} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <h2 className="text-lg font-semibold">Step Navigation Demo</h2>
            <div className="flex justify-center gap-2">
              <button 
                onClick={() => setCurrentStep('input')}
                className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded"
              >
                Input
              </button>
              <button 
                onClick={() => setCurrentStep('breakdown')}
                className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded"
              >
                Breakdown
              </button>
              <button 
                onClick={() => setCurrentStep('pricing')}
                className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded"
              >
                Pricing
              </button>
              <button 
                onClick={() => setCurrentStep('export')}
                className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded"
              >
                Export
              </button>
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}