
import { Link } from "wouter";
import { ThemeProvider } from "next-themes";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import EgyptItineraryApp from "@/components/EgyptItineraryApp";

export default function NewTourPage() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <div className="min-h-screen bg-background">
        {/* Header with back navigation */}
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="space-y-1">
                <h1 className="text-xl font-bold text-foreground">
                  Create New Tour
                </h1>
                <p className="text-sm text-muted-foreground">
                  Process itinerary text and generate pricing quotation
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main>
          <EgyptItineraryApp />
        </main>
      </div>
    </ThemeProvider>
  );
}
