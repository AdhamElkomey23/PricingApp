import { Link } from "wouter";
import { ThemeProvider } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, MapPin, Plus, Moon, Sun, Sparkles, Settings } from "lucide-react";
import { useTheme } from "next-themes";

export default function HomePage() {
  const { theme, setTheme } = useTheme();

  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-foreground">
                  Egypt Itinerary Operations
                </h1>
                <p className="text-sm text-muted-foreground">
                  Professional travel planning and pricing management system
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
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Welcome to Your Dashboard</h2>
              <p className="text-muted-foreground">
                Choose a section to get started with your Egypt travel operations
              </p>
            </div>

            {/* Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* New Tour Card */}
              <Link href="/new">
                <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-0 hover:border-primary hover:border-2">
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                      <Plus className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">New Tour</CardTitle>
                    <CardDescription>
                      Create and price a new Egypt itinerary
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Badge variant="default" className="mb-3">
                      Create New
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Process itinerary text, generate service breakdowns, and calculate pricing quotations
                    </p>
                  </CardContent>
                </Card>
              </Link>

              {/* Tours Management Card */}
              <Link href="/tours">
                <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-0 hover:border-primary hover:border-2">
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-4 p-3 bg-blue-500/10 rounded-full w-fit">
                      <MapPin className="h-8 w-8 text-blue-500" />
                    </div>
                    <CardTitle className="text-xl">Tours</CardTitle>
                    <CardDescription>
                      View and manage existing tours
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Badge variant="secondary" className="mb-3">
                      Management
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Access saved tours, view quotations, and manage tour versions
                    </p>
                  </CardContent>
                </Card>
              </Link>

              {/* Database Management Card */}
              <Link href="/database">
                <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-0 hover:border-primary hover:border-2">
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-4 p-3 bg-green-500/10 rounded-full w-fit">
                      <Database className="h-8 w-8 text-green-500" />
                    </div>
                    <CardTitle className="text-xl">Database</CardTitle>
                    <CardDescription>
                      Manage services and pricing data
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Badge variant="outline" className="mb-3">
                      Data Management
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Add services, update pricing rates, and manage service categories
                    </p>
                  </CardContent>
                </Card>
              </Link>

              {/* AI Chatbot Card */}
              <Link href="/chatbot">
                <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-0 hover:border-primary hover:border-2">
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-4 p-3 bg-purple-500/10 rounded-full w-fit">
                      <Sparkles className="h-8 w-8 text-purple-500" />
                    </div>
                    <CardTitle className="text-xl">AI Assistant</CardTitle>
                    <CardDescription>
                      Chat with AI database helper
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Badge variant="default" className="mb-3 bg-purple-500">
                      AI Powered
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Ask questions, search prices, update data using natural language
                    </p>
                  </CardContent>
                </Card>
              </Link>

              {/* Settings Card */}
              <Link href="/settings">
                <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-0 hover:border-primary hover:border-2">
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-4 p-3 bg-gray-500/10 rounded-full w-fit">
                      <Settings className="h-8 w-8 text-gray-500" />
                    </div>
                    <CardTitle className="text-xl">Settings</CardTitle>
                    <CardDescription>
                      Manage API keys and application preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Badge variant="secondary" className="mb-3">
                      Configuration
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Set up your API keys, customize appearance, and manage user settings
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Quick Stats or Recent Activity */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">0</div>
                    <p className="text-sm text-muted-foreground">Active Tours</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">0</div>
                    <p className="text-sm text-muted-foreground">Service Categories</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">0</div>
                    <p className="text-sm text-muted-foreground">Pricing Rates</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}