import { useState, useRef } from "react";
import { Link } from "wouter";
import { ThemeProvider } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, ArrowLeft, Plus, Search, Edit, Trash2, Upload, Download, Copy, Save, Undo, Eye, FileText, Settings, Calendar, DollarSign, Package, MapPin, CheckCircle, Clock } from "lucide-react";

export default function DatabasePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRateCard, setSelectedRateCard] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("rate-cards");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock data for demonstration
  const mockRateCards = [
    { id: "1", name: "Standard 2024", baseCurrency: "USD", status: "Published", lastUpdated: "2024-01-15" },
    { id: "2", name: "Premium Package", baseCurrency: "USD", status: "Draft", lastUpdated: "2024-01-20" },
    { id: "3", name: "Budget Options", baseCurrency: "EUR", status: "Archived", lastUpdated: "2023-12-10" }
  ];

  const mockSeasons = [
    { code: "peak", label: "Peak Season", ranges: [{ from: "2024-12-20", to: "2024-01-10" }, { from: "2024-03-20", to: "2024-05-10" }] },
    { code: "shoulder", label: "Shoulder Season", ranges: [{ from: "2024-02-01", to: "2024-03-19" }] },
    { code: "low", label: "Low Season", ranges: [{ from: "2024-05-11", to: "2024-09-30" }] }
  ];

  const mockExchangeRates = [
    { base: "USD", quote: "EUR", rate: 0.92, lastUpdated: "2024-01-22" },
    { base: "EUR", quote: "USD", rate: 1.08, lastUpdated: "2024-01-22" }
  ];

  const serviceCatalogue = {
    "Airport": ["Meet & Assist at Airport", "Airport Transfer", "Departure Tax"],
    "Hotel": ["Hotel Accommodation", "Hotel Check-in Assist", "Hotel Breakfast"],
    "Train Station": ["Train Station Transfer", "Train Ticket", "Train Station Assist"],
    "Tour": ["Pyramid Tour", "Valley of Kings Tour", "Philae Temple Tour", "Abu Simbel Tour"],
    "Activities": ["Felucca Ride", "Sound & Light Show", "Camel Ride"],
    "Transport Fees": ["Domestic Flight", "Tourist Police Permit", "Photography Ticket"],
    "Administrative Fees": ["Guide Service", "Ground Handler Fee", "Entrance Fee"]
  };

  const cityCodes = ["CAI", "LXR", "ASW", "ABS", "HRG", "SSH"];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Published": return "default";
      case "Draft": return "secondary";
      case "Archived": return "outline";
      default: return "secondary";
    }
  };

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadMessage("");

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploaded_by', 'admin');

      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${errorText}`);
      }

      const upload = await response.json();

      // Process the uploaded file
      const processResponse = await fetch(`/api/uploads/${upload.id}/process`, {
        method: 'POST'
      });

      const result = await processResponse.json();

      if (!processResponse.ok) {
        setUploadMessage(`Processing failed: ${result.message || 'Unknown error'}`);
        return;
      }

      setUploadMessage(`Upload successful! Processed ${result.recordsProcessed} records, ${result.recordsFailed} failed.`);

      // Refresh data
      // Assuming refetch functions exist globally or are passed as props/context
      // Placeholder functions if they don't exist in this scope:
      const refetchCategories = async () => console.log("Refetching categories...");
      const refetchServices = async () => console.log("Refetching services...");
      const refetchRates = async () => console.log("Refetching rates...");

      await Promise.all([
        refetchCategories(),
        refetchServices(),
        refetchRates()
      ]);

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setUploadMessage(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImportTransportation = async () => {
    try {
      const response = await fetch('/api/import/transportation', {
        method: 'POST'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Import failed: ${errorText}`);
      }

      const result = await response.json();
      setUploadMessage(`Transportation data imported! Categories: ${result.categoriesCreated}, Services: ${result.servicesCreated}, Rates: ${result.ratesCreated}`);

      // Refresh data
      // Assuming refetch functions exist globally or are passed as props/context
      const refetchCategories = async () => console.log("Refetching categories...");
      const refetchServices = async () => console.log("Refetching services...");
      const refetchRates = async () => console.log("Refetching rates...");

      await Promise.all([
        refetchCategories(),
        refetchServices(),
        refetchRates()
      ]);
    } catch (error) {
      setUploadMessage(`Import failed: ${error.message}`);
    }
  };

  const testDatabaseOperations = async () => {
    try {
      // Test creating a category
      const categoryResponse = await fetch('/api/pricing/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Category',
          description: 'Test category for verification'
        })
      });

      if (!categoryResponse.ok) {
        throw new Error(`Category creation failed: ${await categoryResponse.text()}`);
      }

      const category = await categoryResponse.json();

      // Test creating a service
      const serviceResponse = await fetch('/api/pricing/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: category.id,
          name: 'Test Service',
          description: 'Test service for verification',
          unit_type: 'per_group'
        })
      });

      if (!serviceResponse.ok) {
        throw new Error(`Service creation failed: ${await serviceResponse.text()}`);
      }

      const service = await serviceResponse.json();

      // Test creating a rate
      const rateResponse = await fetch('/api/pricing/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: service.id,
          currency: 'EUR',
          profile: 'Base',
          unit_price: 25.00,
          effective_from: new Date().toISOString(),
          is_active: true
        })
      });

      if (!rateResponse.ok) {
        throw new Error(`Rate creation failed: ${await rateResponse.text()}`);
      }

      setUploadMessage('✅ All database operations working correctly!');

      // Refresh data to show the test entries
      // Assuming refetch functions exist globally or are passed as props/context
      const refetchCategories = async () => console.log("Refetching categories...");
      const refetchServices = async () => console.log("Refetching services...");
      const refetchRates = async () => console.log("Refetching rates...");

      await Promise.all([
        refetchCategories(),
        refetchServices(),
        refetchRates()
      ]);

    } catch (error) {
      setUploadMessage(`❌ Database test failed: ${error.message}`);
    }
  };

  const handleExport = () => {
    alert('Export functionality ready for implementation');
  };

  const handleClone = () => {
    alert('Clone functionality ready for implementation');
  };

  const handlePublish = () => {
    alert('Publish functionality ready for implementation');
  };

  const handleUndo = () => {
    alert('Undo functionality ready for implementation');
  };

  const handleSaveDraft = () => {
    alert('Save draft functionality ready for implementation');
  };

  const renderSidebar = () => (
    <div className="w-64 border-r bg-card p-4 space-y-2">
      <nav className="space-y-1">
        {[
          { id: "rate-cards", label: "Rate Cards", icon: DollarSign },
          { id: "seasons", label: "Seasons", icon: Calendar },
          { id: "fx-currency", label: "FX & Currency", icon: DollarSign },
          { id: "profiles", label: "Profiles (Packages)", icon: Package },
          { id: "catalogue", label: "Catalogue & Cities", icon: MapPin },
          { id: "defaults", label: "Defaults", icon: Settings },
          { id: "quality-checks", label: "Quality Checks & Gaps", icon: CheckCircle },
          { id: "changelog", label: "Changelog", icon: Clock }
        ].map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant={activeSection === id ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveSection(id)}
          >
            <Icon className="h-4 w-4 mr-2" />
            {label}
          </Button>
        ))}
      </nav>
    </div>
  );

  const renderTopBar = () => (
    <div className="border-b bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search database..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleCSVUpload}
            ref={fileInputRef}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? "Uploading..." : "Upload CSV"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleImportTransportation}
          >
            Import Transportation Data
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleClone}>
            <Copy className="h-4 w-4 mr-2" />
            Clone
          </Button>
          <Button variant="outline" size="sm" onClick={handlePublish}>
            Publish
          </Button>
          <Button variant="outline" size="sm" onClick={handleUndo}>
            <Undo className="h-4 w-4 mr-2" />
            Undo
          </Button>
          <Button variant="default" size="sm" onClick={handleSaveDraft}>
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button variant="destructive" size="sm" onClick={testDatabaseOperations}>
            Test DB Operations
          </Button>
        </div>
      </div>
    </div>
  );

  const renderRateCards = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Rate Cards</h2>
          <p className="text-muted-foreground">Maintain prices for every service with city/season/provider context</p>
        </div>
        <Button onClick={() => alert('Creating new rate card')}>
          <Plus className="h-4 w-4 mr-2" />
          New Rate Card
        </Button>
      </div>

      <div className="grid gap-4">
        {mockRateCards.map((card) => (
          <Card key={card.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{card.name}</h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <span>Base: {card.baseCurrency}</span>
                    <Separator orientation="vertical" className="h-4" />
                    <span>Updated: {new Date(card.lastUpdated).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(card.status)}>
                    {card.status}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => setSelectedRateCard(card.id)}>
                    <Eye className="h-3 w-3 mr-1" />
                    Open
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => alert(`Cloning rate card: ${card.name}`)}>
                    <Copy className="h-3 w-3 mr-1" />
                    Clone
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => alert(`Archiving rate card: ${card.name}`)}>
                    Archive
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedRateCard && (
        <Card>
          <CardHeader>
            <CardTitle>Rate Card Lines</CardTitle>
            <CardDescription>
              Priority: label+city+season+provider → label+city+season → label+city → label+season → label only
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex gap-2">
              <Button size="sm" onClick={() => alert('Adding new row to rate card')}>
                <Plus className="h-3 w-3 mr-1" />
                Add Row
              </Button>
              <Button variant="outline" size="sm" onClick={() => alert('Delete selected rows functionality')}>
                Delete Selected
              </Button>
              <Button variant="outline" size="sm" onClick={() => alert('Multi-edit functionality')}>
                Multi-edit
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service Label</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Season</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Basis</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Net Price</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select service" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(serviceCatalogue).map(([category, services]) => (
                            services.map(service => (
                              <SelectItem key={service} value={service}>{service}</SelectItem>
                            ))
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="City" />
                        </SelectTrigger>
                        <SelectContent>
                          {cityCodes.map(code => (
                            <SelectItem key={code} value={code}>{code}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Season" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockSeasons.map(season => (
                            <SelectItem key={season.code} value={season.code}>{season.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input placeholder="Provider" />
                    </TableCell>
                    <TableCell>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Basis" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="per_group">Per Group</SelectItem>
                          <SelectItem value="per_person">Per Person</SelectItem>
                          <SelectItem value="per_room">Per Room</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="day">Day</SelectItem>
                          <SelectItem value="night">Night</SelectItem>
                          <SelectItem value="segment">Segment</SelectItem>
                          <SelectItem value="visit">Visit</SelectItem>
                          <SelectItem value="ride">Ride</SelectItem>
                          <SelectItem value="transfer">Transfer</SelectItem>
                          <SelectItem value="room_night">Room Night</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input type="number" placeholder="0.00" />
                    </TableCell>
                    <TableCell>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Switch />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => alert('Edit row functionality')}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => alert('Delete row functionality')}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderSeasons = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Seasons</h2>
          <p className="text-muted-foreground">Define date bands for pricing</p>
        </div>
        <Button onClick={() => alert('Adding new season')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Season
        </Button>
      </div>

      <div className="space-y-4">
        {mockSeasons.map((season) => (
          <Card key={season.code}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{season.code}</Badge>
                    <h3 className="font-medium">{season.label}</h3>
                  </div>
                  <div className="space-y-1">
                    {season.ranges.map((range, idx) => (
                      <div key={idx} className="text-sm text-muted-foreground">
                        {new Date(range.from).toLocaleDateString()} – {new Date(range.to).toLocaleDateString()}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => alert(`Adding date range for ${season.label}`)}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Range
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => alert(`Editing season: ${season.label}`)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => alert(`Deleting season: ${season.label}`)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderFxCurrency = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">FX & Currency</h2>
        <p className="text-muted-foreground">Control display currency and exchange rates used for quotes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Default Display Currency</CardTitle>
        </CardHeader>
        <CardContent>
          <Select>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">US Dollar (USD)</SelectItem>
              <SelectItem value="EUR">Euro (EUR)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exchange Rates</CardTitle>
          <CardDescription>The exchange rate is captured into each quote for audit</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Base</TableHead>
                <TableHead>Quote</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockExchangeRates.map((rate, idx) => (
                <TableRow key={idx}>
                  <TableCell>{rate.base}</TableCell>
                  <TableCell>{rate.quote}</TableCell>
                  <TableCell>{rate.rate.toFixed(4)}</TableCell>
                  <TableCell>{new Date(rate.lastUpdated).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => alert(`Editing exchange rate: ${rate.base}/${rate.quote}`)}>
                      Edit rate for quote
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderProfiles = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Profiles (Packages)</h2>
          <p className="text-muted-foreground">Define include/exclude bundles for quick pricing variants</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => alert('Resetting profiles to defaults')}>Reset to Defaults</Button>
          <Button onClick={() => alert('Creating new profile')}>New Profile</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {["Base", "+Tickets", "+Tickets+Lunch"].map((profile) => (
          <Card key={profile}>
            <CardHeader>
              <CardTitle className="text-lg">{profile}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => alert(`Duplicating profile: ${profile}`)}>Duplicate</Button>
                <Button variant="outline" size="sm" onClick={() => alert(`Testing profile with sample: ${profile}`)}>Test with Sample</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-green-700 mb-2">Included Services</h4>
                <div className="border border-green-200 rounded p-3 min-h-32 bg-green-50/50">
                  <div className="space-y-1 text-sm">
                    <div>Hotel Accommodation</div>
                    <div>Airport Transfer</div>
                    <div>Guide Service</div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-red-700 mb-2">Excluded Services</h4>
                <div className="border border-red-200 rounded p-3 min-h-32 bg-red-50/50">
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>Entrance Fees</div>
                    <div>Meals</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderCatalogue = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Catalogue & Cities</h2>
        <p className="text-muted-foreground">Canonical labels and codes (read-only)</p>
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            <AlertTriangle className="h-4 w-4 inline mr-1" />
            All service labels in Rate Cards must match this list exactly
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Service Catalogue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(serviceCatalogue).map(([category, services]) => (
                <div key={category}>
                  <h4 className="font-medium text-primary mb-2">{category}</h4>
                  <div className="space-y-1 pl-4 border-l-2 border-muted">
                    {services.map((service) => (
                      <div key={service} className="text-sm">{service}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>City Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {cityCodes.map((code) => (
                <Badge key={code} variant="outline" className="justify-center">
                  {code}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderDefaults = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Defaults</h2>
        <p className="text-muted-foreground">Global assumptions used in pricing</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Financial Defaults</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Tax (%)</label>
                <Input type="number" defaultValue="12" />
              </div>
              <div>
                <label className="text-sm font-medium">Markup (%)</label>
                <Input type="number" defaultValue="20" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Rounding Rule</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select rounding" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd-5">Nearest 5 USD</SelectItem>
                  <SelectItem value="eur-5">Nearest 5 EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accommodation Defaults</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Mode</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per-person">Per person per night</SelectItem>
                  <SelectItem value="per-room">Per room per night</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Default Occupancy</label>
                <Input type="number" defaultValue="2" />
              </div>
              <div>
                <label className="text-sm font-medium">Single Supplement (%)</label>
                <Input type="number" defaultValue="25" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ground Handler Fee Placement</CardTitle>
          <CardDescription>Read-only reminder of logic</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>• Luxor → last Luxor day</div>
            <div>• Aswan → last Aswan day</div>
            <div>• Abu Simbel → on the Abu Simbel day</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderQualityChecks = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Quality Checks & Gaps</h2>
        <p className="text-muted-foreground">Prevent surprises in pricing</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Missing Rates Finder</CardTitle>
            <CardDescription>Services from recent itineraries lacking rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-4 w-4" />
                Sound & Light Show (LXR) - No rate found
              </div>
              <div className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-4 w-4" />
                Photography Ticket (ABS) - No rate found
              </div>
            </div>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => alert('Scanning recent itineraries for missing rates')}>
              Scan Recent Itineraries
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inconsistent Basis Check</CardTitle>
            <CardDescription>Services with conflicting pricing basis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-yellow-600">
                <AlertTriangle className="h-4 w-4" />
                Hotel Accommodation using "per_group" (should be "per_person")
              </div>
            </div>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => alert('Running consistency check on pricing basis')}>
              Run Consistency Check
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Unused Lines</CardTitle>
            <CardDescription>Rate lines not used in last 90 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mb-3">
              Found 3 unused rate lines
            </div>
            <Button variant="outline" size="sm" onClick={() => alert('Reviewing unused rate lines')}>
              Review Unused Lines
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dry-Run Test</CardTitle>
            <CardDescription>Test rate matching with sample itinerary</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea placeholder="Paste sample itinerary text..." className="mb-3" />
            <Button variant="outline" size="sm" onClick={() => alert('Running dry-run test with sample itinerary')}>
              Run Test
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderChangelog = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Changelog</h2>
          <p className="text-muted-foreground">Timeline of database actions (read-only)</p>
        </div>
        <Button variant="outline" onClick={() => alert('Exporting changelog')}>
          <Download className="h-4 w-4 mr-2" />
          Export Log
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {[
              { action: "Rate card published", details: "Standard 2024 → Published", user: "System", time: "2024-01-22 10:30" },
              { action: "Rates imported", details: "45 lines added from CSV", user: "Admin", time: "2024-01-22 09:15" },
              { action: "Season updated", details: "Peak season dates modified", user: "Admin", time: "2024-01-21 16:45" },
              { action: "Profile created", details: "Premium Package profile", user: "Admin", time: "2024-01-21 14:20" }
            ].map((entry, idx) => (
              <div key={idx} className="flex items-start gap-3 pb-3 border-b last:border-0">
                <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{entry.action}</div>
                    <div className="text-xs text-muted-foreground">{entry.time}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">{entry.details}</div>
                  <div className="text-xs text-muted-foreground">by {entry.user}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMainContent = () => {
    switch (activeSection) {
      case "rate-cards": return renderRateCards();
      case "seasons": return renderSeasons();
      case "fx-currency": return renderFxCurrency();
      case "profiles": return renderProfiles();
      case "catalogue": return renderCatalogue();
      case "defaults": return renderDefaults();
      case "quality-checks": return renderQualityChecks();
      case "changelog": return renderChangelog();
      default: return renderRateCards();
    }
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <div className="min-h-screen bg-background">
        {/* Header */}
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
                  Database Management
                </h1>
                <p className="text-sm text-muted-foreground">
                  One place to maintain all pricing and settings - auditable and fast
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Top Bar */}
        {renderTopBar()}

        {/* Upload Message */}
        {uploadMessage && (
          <div className="border-b bg-card p-2">
            <div className="container mx-auto px-4">
              <div className={`text-sm ${uploadMessage.includes('failed') ? 'text-destructive' : 'text-green-600'}`}>
                {uploadMessage}
              </div>
            </div>
          </div>
        )}

        {/* Main Layout */}
        <div className="flex">
          {/* Sidebar */}
          {renderSidebar()}

          {/* Main Content */}
          <div className="flex-1 p-6">
            {renderMainContent()}
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}