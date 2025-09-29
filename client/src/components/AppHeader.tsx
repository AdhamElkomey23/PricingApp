import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Moon, Sun, FileText, Calculator, Download, CheckCircle } from "lucide-react";
import { useTheme } from "next-themes";

interface AppHeaderProps {
  currentStep: 'input' | 'breakdown' | 'pricing' | 'export';
}

export default function AppHeader({ currentStep }: AppHeaderProps) {
  const { theme, setTheme } = useTheme();
  
  const steps = [
    { id: 'input', label: 'Input', icon: FileText, description: 'Itinerary details' },
    { id: 'breakdown', label: 'Breakdown', icon: CheckCircle, description: 'Service analysis' },
    { id: 'pricing', label: 'Pricing', icon: Calculator, description: 'Cost calculation' },
    { id: 'export', label: 'Export', icon: Download, description: 'Final quotation' }
  ];
  
  const currentIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">
              Egypt Itinerary Operations
            </h1>
            <p className="text-sm text-muted-foreground">
              Professional travel planning and pricing quotations
            </p>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            data-testid="button-theme-toggle"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
        
        <Separator className="my-4" />
        
        {/* Progress Stepper */}
        <div className="flex items-center justify-center space-x-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentIndex;
            const isCompleted = index < currentIndex;
            const isUpcoming = index > currentIndex;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center space-y-2">
                  <div 
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                      isCompleted 
                        ? 'bg-primary border-primary text-primary-foreground' 
                        : isActive 
                        ? 'bg-primary/10 border-primary text-primary' 
                        : 'bg-muted border-muted-foreground/20 text-muted-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-center">
                    <div className={`text-sm font-medium ${
                      isActive ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {step.label}
                    </div>
                    <div className="text-xs text-muted-foreground hidden sm:block">
                      {step.description}
                    </div>
                  </div>
                </div>
                
                {index < steps.length - 1 && (
                  <div 
                    className={`w-16 h-0.5 mx-4 transition-all ${
                      index < currentIndex ? 'bg-primary' : 'bg-muted-foreground/20'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </header>
  );
}