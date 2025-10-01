
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ThemeProvider } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, Plus, Calendar, Users, Eye, Edit, Trash2, Loader2 } from "lucide-react";

interface Tour {
  id: string;
  tourName: string;
  clientName: string | null;
  status: string;
  numDays: number;
  numPeople: number;
  startDate: string | null;
  createdAt: string;
  totalCost: number | null;
  currency: string;
}

export default function ToursPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTours();
  }, []);

  const fetchTours = async () => {
    try {
      const response = await fetch('/api/quotations');
      if (!response.ok) {
        throw new Error('Failed to fetch tours');
      }
      const data = await response.json();
      setTours(data);
    } catch (error) {
      console.error('Error fetching tours:', error);
      toast({
        title: "Error",
        description: "Failed to load tours",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTour = async (tourId: string) => {
    if (!confirm('Are you sure you want to delete this tour?')) {
      return;
    }

    try {
      const response = await fetch(`/api/quotations/${tourId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete tour');
      }

      setTours(tours.filter(tour => tour.id !== tourId));
      toast({
        title: "Success",
        description: "Tour deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting tour:', error);
      toast({
        title: "Error",
        description: "Failed to delete tour",
        variant: "destructive",
      });
    }
  };

  // Filter tours based on search and status
  const filteredTours = tours.filter(tour => {
    const matchesSearch = !searchTerm || 
      tour.tourName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tour.clientName && tour.clientName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || tour.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
            {loading ? (
              <Card>
                <CardContent className="pt-8 pb-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Loading tours...</p>
                </CardContent>
              </Card>
            ) : filteredTours.length === 0 ? (
              <Card>
                <CardContent className="pt-8 pb-8 text-center">
                  <div className="text-muted-foreground mb-4">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No tours found</p>
                    <p className="text-sm">
                      {tours.length === 0 
                        ? "Create your first tour to get started"
                        : "Try adjusting your search or filter criteria"
                      }
                    </p>
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
              filteredTours.map((tour) => (
                <Card key={tour.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-lg">{tour.tourName}</CardTitle>
                        <CardDescription>
                          Client: {tour.clientName || "No client specified"}
                        </CardDescription>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {tour.numDays} days
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {tour.numPeople} people
                          </div>
                          {tour.startDate && (
                            <div>
                              Start: {new Date(tour.startDate).toLocaleDateString()}
                            </div>
                          )}
                          {tour.totalCost && (
                            <div className="font-medium">
                              {tour.totalCost.toFixed(2)} {tour.currency}
                            </div>
                          )}
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
                        Created: {new Date(tour.createdAt).toLocaleDateString()}
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
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteTour(tour.id)}
                        >
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
