
import { useState } from "react";
import { Link } from "wouter";
import { ThemeProvider } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Search, Plus, Calendar, Users, Eye, Edit, Trash2 } from "lucide-react";

export default function ToursPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Mock tours data - this will be replaced with real API data
  const mockTours = [
    {
      id: "1",
      name: "Cairo to Aswan Explorer",
      client_name: "John Smith",
      status: "active",
      num_days: 7,
      num_people: 4,
      start_date: "2024-03-15",
      created_at: "2024-01-20"
    },
    {
      id: "2", 
      name: "Luxor Heritage Tour",
      client_name: "Sarah Johnson",
      status: "draft",
      num_days: 5,
      num_people: 2,
      start_date: "2024-04-10",
      created_at: "2024-01-22"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "draft": return "secondary";
      case "archived": return "outline";
      case "invoiced": return "destructive";
      default: return "secondary";
    }
  };

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
                    Tours Management
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    View and manage your Egypt tour quotations
                  </p>
                </div>
              </div>
              
              <Link href="/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Tour
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tours by name or client..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                    <SelectItem value="invoiced">Invoiced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tours List */}
          <div className="space-y-4">
            {mockTours.length === 0 ? (
              <Card>
                <CardContent className="pt-8 pb-8 text-center">
                  <div className="text-muted-foreground mb-4">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No tours found</p>
                    <p className="text-sm">Create your first tour to get started</p>
                  </div>
                  <Link href="/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Tour
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              mockTours.map((tour) => (
                <Card key={tour.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-lg">{tour.name}</CardTitle>
                        <CardDescription>
                          Client: {tour.client_name}
                        </CardDescription>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {tour.num_days} days
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {tour.num_people} people
                          </div>
                          <div>
                            Start: {new Date(tour.start_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusColor(tour.status)}>
                          {tour.status.charAt(0).toUpperCase() + tour.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Created: {new Date(tour.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}
