
import { useState } from "react";
import { Link } from "wouter";
import { ThemeProvider } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Search, Edit, Trash2, Upload, Download } from "lucide-react";

export default function DatabasePage() {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data - this will be replaced with real API data
  const mockCategories = [
    { id: "1", name: "Airport Services", description: "Meet & assist, transfers", is_active: true },
    { id: "2", name: "Hotel Services", description: "Accommodation, check-in/out", is_active: true },
    { id: "3", name: "Tour Services", description: "Guided tours, entrance fees", is_active: true }
  ];

  const mockServices = [
    { id: "1", name: "Meet & Assist at Airport", category: "Airport Services", unit_type: "per_group", is_active: true },
    { id: "2", name: "Hotel Accommodation", category: "Hotel Services", unit_type: "per_person", is_active: true },
    { id: "3", name: "Pyramid Tour", category: "Tour Services", unit_type: "per_person", is_active: true }
  ];

  const mockRates = [
    { id: "1", service: "Meet & Assist at Airport", currency: "EGP", profile: "Base", unit_price: 150 },
    { id: "2", service: "Hotel Accommodation", currency: "EGP", profile: "Base", unit_price: 120 },
    { id: "3", service: "Pyramid Tour", currency: "EGP", profile: "+Tickets", unit_price: 85 }
  ];

  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Home
                  </Button>
                </Link>
                <div className="space-y-1">
                  <h1 className="text-xl font-bold text-foreground">
                    Database Management
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Manage services, categories, and pricing rates
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Excel
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <Tabs defaultValue="categories" className="space-y-6">
            <TabsList>
              <TabsTrigger value="categories">Service Categories</TabsTrigger>
              <TabsTrigger value="services">Service Items</TabsTrigger>
              <TabsTrigger value="rates">Pricing Rates</TabsTrigger>
            </TabsList>

            {/* Service Categories Tab */}
            <TabsContent value="categories" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Service Categories</CardTitle>
                      <CardDescription>
                        Organize services into logical categories
                      </CardDescription>
                    </div>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Category
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockCategories.map((category) => (
                      <Card key={category.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{category.name}</h4>
                              <p className="text-sm text-muted-foreground">{category.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={category.is_active ? "default" : "secondary"}>
                                {category.is_active ? "Active" : "Inactive"}
                              </Badge>
                              <Button variant="outline" size="sm">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Service Items Tab */}
            <TabsContent value="services" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Service Items</CardTitle>
                      <CardDescription>
                        Individual services that can be added to tours
                      </CardDescription>
                    </div>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Service
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search services..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    {mockServices.map((service) => (
                      <Card key={service.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{service.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {service.category}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {service.unit_type}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={service.is_active ? "default" : "secondary"}>
                                {service.is_active ? "Active" : "Inactive"}
                              </Badge>
                              <Button variant="outline" size="sm">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pricing Rates Tab */}
            <TabsContent value="rates" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Pricing Rates</CardTitle>
                      <CardDescription>
                        Set prices for services across different profiles and currencies
                      </CardDescription>
                    </div>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Rate
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockRates.map((rate) => (
                      <Card key={rate.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{rate.service}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {rate.profile}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {rate.currency}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <div className="font-medium">
                                  {rate.unit_price.toFixed(2)} {rate.currency}
                                </div>
                              </div>
                              <Button variant="outline" size="sm">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ThemeProvider>
  );
}
