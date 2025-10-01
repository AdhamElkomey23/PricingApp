import { useState, useRef } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  Upload, 
  Download, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText,
  Trash2,
  Edit
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Price {
  id: string;
  service_name: string;
  category: string | null;
  route_name: string | null;
  cost_basis: string;
  unit: string | null;
  unit_price: number;
  currency: string;
  notes: string | null;
  vehicle_type: string | null;
  passenger_capacity: string | null;
  location: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface EntranceFee {
  id: string;
  city: string;
  site_name: string;
  net_pp: number;
  price: string;
  unit_price: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CsvUpload {
  id: string;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  city: string;
  status: "pending" | "processing" | "completed" | "failed";
  uploaded_by: string | null;
  processed_at: string | null;
  error_log: string | null;
  records_processed: number;
  records_failed: number;
  created_at: string;
}

export default function DatabasePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [currencyFilter, setCurrencyFilter] = useState<string>("");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [uploadType, setUploadType] = useState<string>("prices");
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [editingEntranceFee, setEditingEntranceFee] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Price>>({});
  const [editEntranceFeeForm, setEditEntranceFeeForm] = useState<Partial<EntranceFee>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch prices
  const { data: prices = [], isLoading: pricesLoading, refetch: refetchPrices } = useQuery<Price[]>({
    queryKey: ['/api/prices'],
  });

  // Fetch entrance fees
  const { data: entranceFees = [], isLoading: entranceFeesLoading, refetch: refetchEntranceFees } = useQuery<EntranceFee[]>({
    queryKey: ['/api/entrance-fees'],
  });

  // Fetch CSV uploads
  const { data: uploads = [], isLoading: uploadsLoading, refetch: refetchUploads } = useQuery<CsvUpload[]>({
    queryKey: ['/api/csv-uploads'],
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ file, city }: { file: File; city: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('city', city);
      
      const response = await fetch('/api/csv-uploads', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      refetchUploads();
      setSelectedCity("");
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  });

  // Process CSV mutation
  const processMutation = useMutation({
    mutationFn: async (uploadId: string) => {
      const response = await fetch(`/api/csv-uploads/${uploadId}/process`, {
        method: 'POST'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Processing failed');
      }
      return await response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Processing Complete",
        description: `Successfully processed ${data.recordsProcessed} records. ${data.recordsFailed} failed.`,
      });
      refetchUploads();
      refetchPrices();
    },
    onError: (error: any) => {
      toast({
        title: "Processing Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete upload mutation
  const deleteUploadMutation = useMutation({
    mutationFn: async (uploadId: string) => {
      const response = await fetch(`/api/csv-uploads/${uploadId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Delete failed');
      }

      return response.ok;
    },
    onSuccess: () => {
      toast({
        title: "Upload Deleted",
        description: "CSV upload has been deleted successfully.",
      });
      refetchUploads();
    }
  });

  // Delete price mutation
  const deletePriceMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const response = await fetch(`/api/prices/${priceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Delete failed');
      }

      return response.ok;
    },
    onSuccess: () => {
      toast({
        title: "Price Deleted",
        description: "Price record has been deleted successfully.",
      });
      refetchPrices();
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update price mutation
  const updatePriceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Price> }) => {
      const response = await fetch(`/api/prices/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Update failed');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Price Updated",
        description: "Price record has been updated successfully.",
      });
      setEditingPrice(null);
      setEditForm({});
      refetchPrices();
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCity.trim()) {
      toast({
        title: "Upload Type Required",
        description: "Please select an upload type before uploading",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('city', selectedCity);
      formData.append('uploadType', uploadType);
      
      const response = await fetch('/api/csv-uploads', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      await response.json();
      refetchUploads();
      setSelectedCity("");
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast({
        title: "File Uploaded",
        description: "Your CSV file has been uploaded. Click 'Process' to import the data.",
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case "failed": return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case "processing": return <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status === "completed" ? "default" : 
                    status === "failed" ? "destructive" : 
                    status === "processing" ? "secondary" : "outline";
    return <Badge variant={variant} data-testid={`badge-status-${status}`}>{status}</Badge>;
  };

  const handleEditPrice = (price: Price) => {
    setEditingPrice(price.id);
    setEditForm({
      service_name: price.service_name,
      route_name: price.route_name,
      cost_basis: price.cost_basis,
      unit: price.unit,
      unit_price: price.unit_price,
      currency: price.currency,
      notes: price.notes,
      vehicle_type: price.vehicle_type,
      passenger_capacity: price.passenger_capacity,
      location: price.location,
    });
  };

  const handleSavePrice = () => {
    if (editingPrice && editForm) {
      updatePriceMutation.mutate({ id: editingPrice, data: editForm });
    }
  };

  const handleCancelEdit = () => {
    setEditingPrice(null);
    setEditForm({});
  };

  // Filter prices
  const filteredPrices = prices.filter(price => {
    const matchesSearch = price.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         price.route_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         price.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCurrency = !currencyFilter || price.currency === currencyFilter;
    const matchesLocation = !locationFilter || price.location === locationFilter;
    return matchesSearch && matchesCurrency && matchesLocation;
  });

  // Get unique currencies and locations
  const currencies = Array.from(new Set(prices.map(p => p.currency)));
  const locations = Array.from(new Set(prices.map(p => p.location).filter(Boolean)));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-3xl font-bold mt-4 text-gray-900 dark:text-gray-100">Pricing Database</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Upload CSV files to automatically add pricing data to your database
            </p>
          </div>
        </div>

        {/* CSV Upload Instructions */}
        <Alert data-testid="alert-instructions">
          <FileText className="h-4 w-4" />
          <AlertDescription>
            <strong>CSV Format:</strong> Your CSV file should include these columns: 
            <code className="mx-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
              Service Name, Category, Route Name, Cost Basis, Unit, Base Cost, Notes, Vehicle Type, Passenger Capacity, Location
            </code>
            <br/>
            <strong>Example Base Cost:</strong> "20 €" or "45 $" (currency will be auto-detected)
            <br/>
            <strong>Cost Basis:</strong> per_person, per_group, per_night, per_day, flat_rate
            <br/>
            <strong>Location:</strong> Required for multi-city uploads (e.g., "Alexandria", "Cairo", "Luxor")
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList data-testid="tabs-navigation">
            <TabsTrigger value="upload" data-testid="tab-upload">CSV Upload</TabsTrigger>
            <TabsTrigger value="prices" data-testid="tab-prices">Transportation/Services ({prices.length})</TabsTrigger>
            <TabsTrigger value="entrance-fees" data-testid="tab-entrance-fees">Entrance Fees ({entranceFees.length})</TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-4">
            <Card data-testid="card-upload">
              <CardHeader>
                <CardTitle>Upload CSV File</CardTitle>
                <CardDescription>
                  Upload a CSV file containing pricing data. The file will be validated and imported automatically.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Data Type Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Data Type
                    </label>
                    <select
                      className="w-full border rounded-md px-3 py-2 bg-background text-foreground"
                      value={uploadType}
                      onChange={(e) => setUploadType(e.target.value)}
                      data-testid="select-upload-type"
                    >
                      <option value="prices">Transportation/Services Pricing</option>
                      <option value="entrance-fees">Entrance Fees</option>
                    </select>
                  </div>

                  {/* City Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {uploadType === 'entrance-fees' ? 'City/Region' : 'Upload Type'}
                    </label>
                    <select
                      className="w-full border rounded-md px-3 py-2 bg-background text-foreground"
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      data-testid="select-city"
                    >
                      <option value="">
                        {uploadType === 'entrance-fees' ? 'Select city/region...' : 'Select upload type...'}
                      </option>
                      {uploadType === 'entrance-fees' ? (
                        <>
                          <option value="multi-city">All Cities (uses city column from CSV)</option>
                          <option value="Cairo">Cairo</option>
                          <option value="Alexandria">Alexandria</option>
                          <option value="Luxor">Luxor</option>
                          <option value="Aswan">Aswan</option>
                          <option value="Fayoum">Fayoum</option>
                          <option value="AL MINYA">Al Minya</option>
                          <option value="SIWA">Siwa</option>
                          <option value="MATROUH">Matrouh</option>
                          <option value="Qena">Qena</option>
                          <option value="SHG">Sohag</option>
                          <option value="HUR">Hurghada</option>
                          <option value="SSH">Sharm El Sheikh</option>
                        </>
                      ) : (
                        <>
                          <option value="multi-city">Multi-City (uses Location column from CSV)</option>
                          <option value="Alexandria">Single City: Alexandria</option>
                          <option value="Cairo">Single City: Cairo</option>
                          <option value="Luxor">Single City: Luxor</option>
                          <option value="Aswan">Single City: Aswan</option>
                          <option value="Hurghada">Single City: Hurghada</option>
                          <option value="Sharm El-Sheikh">Single City: Sharm El-Sheikh</option>
                          <option value="Marsa Matrouh">Single City: Marsa Matrouh</option>
                          <option value="Bahariya Oasis">Single City: Bahariya Oasis</option>
                          <option value="Siwa Oasis">Single City: Siwa Oasis</option>
                        </>
                      )}
                    </select>
                    {selectedCity === "multi-city" && (
                      <div className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 p-2 rounded">
                        <strong>Multi-City Mode:</strong> Your CSV should include a "Location" column with city names. Each record will be assigned to its respective city.
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      disabled={uploadMutation.isPending}
                      data-testid="input-csv-file"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadMutation.isPending}
                      data-testid="button-select-file"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadMutation.isPending ? "Uploading..." : "Select File"}
                    </Button>
                  </div>

                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {uploadType === 'entrance-fees' ? (
                      <a
                        href="data:text/csv;charset=utf-8,city,site name,net_pp,price%0ACairo,Saladin Citadel,550,€10.00%0ACairo,Baron Palace,220,€4.00%0AAlexandria,Qaitbay Citadel,200,€3.64"
                        download="entrance_fees_template.csv"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                        data-testid="link-download-template"
                      >
                        <Download className="inline h-4 w-4 mr-1" />
                        Download Entrance Fees CSV Template
                      </a>
                    ) : (
                      <a
                        href="data:text/csv;charset=utf-8,Service Name,Category,Route Name,Cost Basis,Unit,Base Cost,Notes,Vehicle Type,Passenger Capacity,Location%0ASedan Alexandria Airport Pickup,transport,Alexandria Airport Pickup,per_group,transfer,20 €,One-way airport pickup,Sedan,1-2 pax,Alexandria%0AHiace Cairo Day Tour 8 Hours,transport,Cairo Day Tour 8 Hours,per_group,tour,69 €,8-hour city tour,Hiace,3-7 pax,Cairo"
                        download="pricing_template.csv"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                        data-testid="link-download-template"
                      >
                        <Download className="inline h-4 w-4 mr-1" />
                        Download Pricing CSV Template
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upload History */}
            <Card data-testid="card-upload-history">
              <CardHeader>
                <CardTitle>Upload History</CardTitle>
                <CardDescription>Recent CSV file uploads and their processing status</CardDescription>
              </CardHeader>
              <CardContent>
                {uploadsLoading ? (
                  <div className="text-center py-4" data-testid="loading-uploads">Loading uploads...</div>
                ) : uploads.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400" data-testid="text-no-uploads">
                    No uploads yet. Upload a CSV file to get started.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File Name</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Processed</TableHead>
                        <TableHead>Failed</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uploads.map((upload) => (
                        <TableRow key={upload.id} data-testid={`row-upload-${upload.id}`}>
                          <TableCell className="font-medium" data-testid={`text-filename-${upload.id}`}>
                            {upload.original_filename}
                          </TableCell>
                          <TableCell data-testid={`text-city-${upload.id}`}>
                            <Badge variant="outline">{upload.city}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(upload.status)}
                              {getStatusBadge(upload.status)}
                            </div>
                          </TableCell>
                          <TableCell data-testid={`text-processed-${upload.id}`}>
                            {upload.records_processed || 0}
                          </TableCell>
                          <TableCell data-testid={`text-failed-${upload.id}`}>
                            {upload.records_failed || 0}
                          </TableCell>
                          <TableCell data-testid={`text-created-${upload.id}`}>
                            {new Date(upload.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {upload.status === "pending" && (
                                <Button
                                  size="sm"
                                  onClick={() => processMutation.mutate(upload.id)}
                                  disabled={processMutation.isPending}
                                  data-testid={`button-process-${upload.id}`}
                                >
                                  Process
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteUploadMutation.mutate(upload.id)}
                                disabled={deleteUploadMutation.isPending}
                                data-testid={`button-delete-upload-${upload.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Prices Tab */}
          <TabsContent value="prices" className="space-y-4">
            <Card data-testid="card-prices">
              <CardHeader>
                <CardTitle>Price List</CardTitle>
                <CardDescription>All pricing data in your database</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by service name or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      data-testid="input-search-prices"
                    />
                  </div>
                  <select
                    className="border rounded-md px-3 py-2 bg-background text-foreground"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    data-testid="select-location-filter"
                  >
                    <option value="">All Cities</option>
                    {locations.map(loc => (
                      <option key={loc} value={loc || ''}>{loc || 'Unknown'}</option>
                    ))}
                  </select>
                  
                  <select
                    className="border rounded-md px-3 py-2 bg-background text-foreground"
                    value={currencyFilter}
                    onChange={(e) => setCurrencyFilter(e.target.value)}
                    data-testid="select-currency-filter"
                  >
                    <option value="">All Currencies</option>
                    {currencies.map(cur => (
                      <option key={cur} value={cur}>{cur}</option>
                    ))}
                  </select>
                </div>

                {/* Prices Table */}
                {pricesLoading ? (
                  <div className="text-center py-4" data-testid="loading-prices">Loading prices...</div>
                ) : filteredPrices.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400" data-testid="text-no-prices">
                    {prices.length === 0 
                      ? "No prices in database. Upload a CSV file to add pricing data."
                      : "No prices match your filters."}
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Service Name</TableHead>
                          <TableHead>Cost Basis</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPrices.map((price) => (
                          <TableRow key={price.id} data-testid={`row-price-${price.id}`}>
                            <TableCell className="font-medium" data-testid={`text-service-${price.id}`}>
                              {editingPrice === price.id ? (
                                <Input
                                  value={editForm.service_name || ''}
                                  onChange={(e) => setEditForm({ ...editForm, service_name: e.target.value })}
                                  className="w-full"
                                />
                              ) : (
                                price.service_name
                              )}
                            </TableCell>
                            <TableCell data-testid={`text-cost-basis-${price.id}`}>
                              {editingPrice === price.id ? (
                                <select
                                  value={editForm.cost_basis || ''}
                                  onChange={(e) => setEditForm({ ...editForm, cost_basis: e.target.value })}
                                  className="border rounded px-2 py-1 text-sm bg-background"
                                >
                                  <option value="per_person">per_person</option>
                                  <option value="per_group">per_group</option>
                                  <option value="per_night">per_night</option>
                                  <option value="per_day">per_day</option>
                                  <option value="flat_rate">flat_rate</option>
                                </select>
                              ) : (
                                <Badge variant="outline">{price.cost_basis}</Badge>
                              )}
                            </TableCell>
                            <TableCell data-testid={`text-unit-${price.id}`}>
                              {editingPrice === price.id ? (
                                <Input
                                  value={editForm.unit || ''}
                                  onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                                  className="w-full"
                                />
                              ) : (
                                price.unit || '-'
                              )}
                            </TableCell>
                            <TableCell className="font-semibold" data-testid={`text-price-${price.id}`}>
                              {editingPrice === price.id ? (
                                <div className="flex gap-1">
                                  <select
                                    value={editForm.currency || 'EUR'}
                                    onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                                    className="border rounded px-1 py-1 text-sm bg-background w-16"
                                  >
                                    <option value="EUR">EUR</option>
                                    <option value="USD">USD</option>
                                    <option value="EGP">EGP</option>
                                  </select>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={editForm.unit_price || ''}
                                    onChange={(e) => setEditForm({ ...editForm, unit_price: parseFloat(e.target.value) })}
                                    className="w-20"
                                  />
                                </div>
                              ) : (
                                `${price.currency} ${price.unit_price.toFixed(2)}`
                              )}
                            </TableCell>
                            <TableCell data-testid={`text-vehicle-${price.id}`}>
                              {editingPrice === price.id ? (
                                <div className="space-y-1">
                                  <Input
                                    value={editForm.vehicle_type || ''}
                                    onChange={(e) => setEditForm({ ...editForm, vehicle_type: e.target.value })}
                                    placeholder="Vehicle Type"
                                    className="w-full text-xs"
                                  />
                                  <Input
                                    value={editForm.passenger_capacity || ''}
                                    onChange={(e) => setEditForm({ ...editForm, passenger_capacity: e.target.value })}
                                    placeholder="Capacity"
                                    className="w-full text-xs"
                                  />
                                </div>
                              ) : (
                                price.vehicle_type ? `${price.vehicle_type} (${price.passenger_capacity})` : '-'
                              )}
                            </TableCell>
                            <TableCell data-testid={`text-location-${price.id}`}>
                              {editingPrice === price.id ? (
                                <select
                                  value={editForm.location || ''}
                                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                  className="border rounded px-2 py-1 text-sm bg-background"
                                >
                                  <option value="">Select City</option>
                                  <option value="Alexandria">Alexandria</option>
                                  <option value="Cairo">Cairo</option>
                                  <option value="Luxor">Luxor</option>
                                  <option value="Aswan">Aswan</option>
                                  <option value="Hurghada">Hurghada</option>
                                  <option value="Sharm El-Sheikh">Sharm El-Sheikh</option>
                                  <option value="Marsa Matrouh">Marsa Matrouh</option>
                                  <option value="Bahariya Oasis">Bahariya Oasis</option>
                                  <option value="Siwa Oasis">Siwa Oasis</option>
                                </select>
                              ) : (
                                price.location || '-'
                              )}
                            </TableCell>
                            <TableCell className="max-w-xs" data-testid={`text-notes-${price.id}`}>
                              {editingPrice === price.id ? (
                                <Input
                                  value={editForm.notes || ''}
                                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                  className="w-full"
                                />
                              ) : (
                                <div className="truncate">{price.notes || '-'}</div>
                              )}
                            </TableCell>
                            <TableCell>
                              {editingPrice === price.id ? (
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    onClick={handleSavePrice}
                                    disabled={updatePriceMutation.isPending}
                                    data-testid={`button-save-${price.id}`}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleCancelEdit}
                                    data-testid={`button-cancel-${price.id}`}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditPrice(price)}
                                    data-testid={`button-edit-${price.id}`}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deletePriceMutation.mutate(price.id)}
                                    disabled={deletePriceMutation.isPending}
                                    data-testid={`button-delete-${price.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Entrance Fees Tab */}
          <TabsContent value="entrance-fees" className="space-y-4">
            <Card data-testid="card-entrance-fees">
              <CardHeader>
                <CardTitle>Entrance Fees Database</CardTitle>
                <CardDescription>All entrance fees for museums, monuments, and archaeological sites</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by site name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      data-testid="input-search-entrance-fees"
                    />
                  </div>
                  <select
                    className="border rounded-md px-3 py-2 bg-background text-foreground"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    data-testid="select-city-filter"
                  >
                    <option value="">All Cities</option>
                    {Array.from(new Set(entranceFees.map(ef => ef.city).filter(Boolean))).map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                {/* Entrance Fees Table */}
                {entranceFeesLoading ? (
                  <div className="text-center py-4" data-testid="loading-entrance-fees">Loading entrance fees...</div>
                ) : entranceFees.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400" data-testid="text-no-entrance-fees">
                    No entrance fees in database. Upload a CSV file to add entrance fees data.
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>City</TableHead>
                          <TableHead>Site Name</TableHead>
                          <TableHead>Net per Person (EGP)</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {entranceFees
                          .filter(ef => 
                            ef.site_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                            (!locationFilter || ef.city === locationFilter)
                          )
                          .map((entranceFee) => (
                          <TableRow key={entranceFee.id} data-testid={`row-entrance-fee-${entranceFee.id}`}>
                            <TableCell data-testid={`text-city-${entranceFee.id}`}>
                              <Badge variant="outline">{entranceFee.city}</Badge>
                            </TableCell>
                            <TableCell className="font-medium" data-testid={`text-site-${entranceFee.id}`}>
                              {entranceFee.site_name}
                            </TableCell>
                            <TableCell data-testid={`text-net-${entranceFee.id}`}>
                              {entranceFee.net_pp} EGP
                            </TableCell>
                            <TableCell className="font-semibold" data-testid={`text-price-${entranceFee.id}`}>
                              {entranceFee.price}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  // Delete entrance fee mutation would go here
                                  toast({
                                    title: "Feature Coming Soon",
                                    description: "Edit functionality will be added in the next update.",
                                  });
                                }}
                                data-testid={`button-delete-entrance-fee-${entranceFee.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
