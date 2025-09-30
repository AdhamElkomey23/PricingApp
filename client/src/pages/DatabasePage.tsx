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
  Trash2
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

interface CsvUpload {
  id: string;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch prices
  const { data: prices = [], isLoading: pricesLoading, refetch: refetchPrices } = useQuery<Price[]>({
    queryKey: ['/api/prices'],
  });

  // Fetch CSV uploads
  const { data: uploads = [], isLoading: uploadsLoading, refetch: refetchUploads } = useQuery<CsvUpload[]>({
    queryKey: ['/api/csv-uploads'],
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
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
      return await apiRequest(`/api/csv-uploads/${uploadId}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "Upload Deleted",
        description: "CSV upload has been deleted successfully.",
      });
      refetchUploads();
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

    try {
      const upload = await uploadMutation.mutateAsync(file);
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

  // Filter prices
  const filteredPrices = prices.filter(price => {
    const matchesSearch = price.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         price.route_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         price.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || price.category === categoryFilter;
    const matchesCurrency = !currencyFilter || price.currency === currencyFilter;
    return matchesSearch && matchesCategory && matchesCurrency;
  });

  // Get unique categories and currencies
  const categories = Array.from(new Set(prices.map(p => p.category).filter(Boolean)));
  const currencies = Array.from(new Set(prices.map(p => p.currency)));

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
              Service Name, Category, Route Name, Cost Basis, Unit, Base Cost, Notes, Vehicle Type, Passenger Capacity
            </code>
            <br/>
            <strong>Example Base Cost:</strong> "20 €" or "45 $" (currency will be auto-detected)
            <br/>
            <strong>Cost Basis:</strong> per_person, per_group, per_night, per_day, flat_rate
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList data-testid="tabs-navigation">
            <TabsTrigger value="upload" data-testid="tab-upload">CSV Upload</TabsTrigger>
            <TabsTrigger value="prices" data-testid="tab-prices">View Prices ({prices.length})</TabsTrigger>
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
                    <a
                      href="data:text/csv;charset=utf-8,Service Name,Category,Route Name,Cost Basis,Unit,Base Cost,Notes,Vehicle Type,Passenger Capacity%0ASedan Alexandria Airport Pickup,transport,Alexandria Airport Pickup,per_group,transfer,20 €,One-way airport pickup,Sedan,1-2 pax%0AHiace Cairo Day Tour 8 Hours,transport,Cairo Day Tour 8 Hours,per_group,tour,69 €,8-hour city tour,Hiace,3-7 pax"
                      download="pricing_template.csv"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                      data-testid="link-download-template"
                    >
                      <Download className="inline h-4 w-4 mr-1" />
                      Download Sample CSV Template
                    </a>
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
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    data-testid="select-category-filter"
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat || ''}>{cat || 'Uncategorized'}</option>
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
                          <TableHead>Category</TableHead>
                          <TableHead>Cost Basis</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPrices.map((price) => (
                          <TableRow key={price.id} data-testid={`row-price-${price.id}`}>
                            <TableCell className="font-medium" data-testid={`text-service-${price.id}`}>
                              {price.service_name}
                            </TableCell>
                            <TableCell data-testid={`text-category-${price.id}`}>
                              {price.category || '-'}
                            </TableCell>
                            <TableCell data-testid={`text-cost-basis-${price.id}`}>
                              <Badge variant="outline">{price.cost_basis}</Badge>
                            </TableCell>
                            <TableCell data-testid={`text-unit-${price.id}`}>
                              {price.unit || '-'}
                            </TableCell>
                            <TableCell className="font-semibold" data-testid={`text-price-${price.id}`}>
                              {price.currency} {price.unit_price.toFixed(2)}
                            </TableCell>
                            <TableCell data-testid={`text-vehicle-${price.id}`}>
                              {price.vehicle_type ? `${price.vehicle_type} (${price.passenger_capacity})` : '-'}
                            </TableCell>
                            <TableCell data-testid={`text-location-${price.id}`}>
                              {price.location || '-'}
                            </TableCell>
                            <TableCell className="max-w-xs truncate" data-testid={`text-notes-${price.id}`}>
                              {price.notes || '-'}
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
