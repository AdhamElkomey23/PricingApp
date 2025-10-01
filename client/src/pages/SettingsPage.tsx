
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Key, 
  Database, 
  Palette, 
  Shield, 
  Bell, 
  Download, 
  Upload,
  Eye,
  EyeOff,
  Settings,
  Globe,
  DollarSign,
  Brain,
  Save,
  RotateCcw,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const settingsSchema = z.object({
  openaiApiKey: z.string().optional(),
  openaiModel: z.string().default("gpt-4o"),
  temperature: z.number().min(0).max(2).default(0.3),
  maxTokens: z.number().min(100).max(4000).default(2000),
  defaultCurrency: z.string().default("EUR"),
  defaultMarkupPercentage: z.number().min(0).max(100).default(20),
  autoBackupFrequency: z.string().default("daily"),
  defaultTourPeople: z.number().min(1).max(100).default(2),
  defaultTourDays: z.number().min(1).max(30).default(7),
  theme: z.string().default("light"),
  language: z.string().default("en"),
  csvDelimiter: z.string().default(","),
  dateFormat: z.string().default("MM/dd/yyyy"),
  numberFormat: z.string().default("1,000.00"),
  emailAlerts: z.boolean().default(true),
  lowPricingWarnings: z.boolean().default(true),
  analysisNotifications: z.boolean().default(true),
  sessionTimeout: z.number().min(30).max(480).default(120),
  autoLogout: z.boolean().default(true),
  aiResponseLength: z.string().default("balanced"),
  conversationHistoryLimit: z.number().min(5).max(50).default(20),
  autoSuggestions: z.boolean().default(true),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      openaiApiKey: "",
      openaiModel: "gpt-4o",
      temperature: 0.3,
      maxTokens: 2000,
      defaultCurrency: "EUR",
      defaultMarkupPercentage: 20,
      autoBackupFrequency: "daily",
      defaultTourPeople: 2,
      defaultTourDays: 7,
      theme: "light",
      language: "en",
      csvDelimiter: ",",
      dateFormat: "MM/dd/yyyy",
      numberFormat: "1,000.00",
      emailAlerts: true,
      lowPricingWarnings: true,
      analysisNotifications: true,
      sessionTimeout: 120,
      autoLogout: true,
      aiResponseLength: "balanced",
      conversationHistoryLimit: 20,
      autoSuggestions: true,
    },
  });

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("app-settings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        Object.keys(parsed).forEach((key) => {
          setValue(key as keyof SettingsFormData, parsed[key]);
        });
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    }
  }, [setValue]);

  // Watch for changes
  useEffect(() => {
    setHasChanges(isDirty);
  }, [isDirty]);

  const onSubmit = async (data: SettingsFormData) => {
    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem("app-settings", JSON.stringify(data));
      
      // In a real app, you'd also save to a backend API
      // await fetch('/api/settings', { method: 'POST', body: JSON.stringify(data) });
      
      toast({
        title: "Settings saved",
        description: "Your settings have been successfully saved.",
      });
      
      setHasChanges(false);
      reset(data); // Reset form state to mark as clean
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    const defaultValues = {
      openaiApiKey: "",
      openaiModel: "gpt-4o",
      temperature: 0.3,
      maxTokens: 2000,
      defaultCurrency: "EUR",
      defaultMarkupPercentage: 20,
      autoBackupFrequency: "daily",
      defaultTourPeople: 2,
      defaultTourDays: 7,
      theme: "light",
      language: "en",
      csvDelimiter: ",",
      dateFormat: "MM/dd/yyyy",
      numberFormat: "1,000.00",
      emailAlerts: true,
      lowPricingWarnings: true,
      analysisNotifications: true,
      sessionTimeout: 120,
      autoLogout: true,
      aiResponseLength: "balanced",
      conversationHistoryLimit: 20,
      autoSuggestions: true,
    };
    
    reset(defaultValues);
    setHasChanges(true);
    
    toast({
      title: "Settings reset",
      description: "All settings have been reset to default values.",
    });
  };

  const handleExportSettings = () => {
    const currentSettings = watch();
    const blob = new Blob([JSON.stringify(currentSettings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `app-settings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target?.result as string);
        Object.keys(settings).forEach((key) => {
          if (key in watch()) {
            setValue(key as keyof SettingsFormData, settings[key]);
          }
        });
        setHasChanges(true);
        toast({
          title: "Settings imported",
          description: "Settings have been imported successfully.",
        });
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Invalid settings file. Please check the file format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" data-testid="link-home">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Settings className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Settings</h1>
              <p className="text-xs text-muted-foreground">Configure your application preferences</p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {hasChanges && (
              <Badge variant="outline" className="text-xs">
                Unsaved changes
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* API Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Configuration
              </CardTitle>
              <CardDescription>
                Configure your OpenAI API settings for AI-powered features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="openaiApiKey">OpenAI API Key</Label>
                <div className="relative">
                  <Input
                    id="openaiApiKey"
                    type={showApiKey ? "text" : "password"}
                    placeholder="sk-..."
                    {...register("openaiApiKey")}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.openaiApiKey && (
                  <p className="text-sm text-destructive">{errors.openaiApiKey.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="openaiModel">AI Model</Label>
                  <Select onValueChange={(value) => setValue("openaiModel", value)} defaultValue="gpt-4o">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o">GPT-4o (Recommended)</SelectItem>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-5">GPT-5 (Latest)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature ({watch("temperature")})</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    {...register("temperature", { valueAsNumber: true })}
                  />
                  <p className="text-xs text-muted-foreground">0 = deterministic, 2 = creative</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxTokens">Max Tokens</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    min="100"
                    max="4000"
                    {...register("maxTokens", { valueAsNumber: true })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Database Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Settings
              </CardTitle>
              <CardDescription>
                Default values for pricing and tour data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultCurrency">Default Currency</Label>
                  <Select onValueChange={(value) => setValue("defaultCurrency", value)} defaultValue="EUR">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EGP">EGP (ج.م)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultMarkupPercentage">Default Markup (%)</Label>
                  <Input
                    id="defaultMarkupPercentage"
                    type="number"
                    min="0"
                    max="100"
                    {...register("defaultMarkupPercentage", { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="autoBackupFrequency">Auto Backup</Label>
                  <Select onValueChange={(value) => setValue("autoBackupFrequency", value)} defaultValue="daily">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Application Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Application Preferences
              </CardTitle>
              <CardDescription>
                Customize your app experience and default values
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultTourPeople">Default People</Label>
                  <Input
                    id="defaultTourPeople"
                    type="number"
                    min="1"
                    max="100"
                    {...register("defaultTourPeople", { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultTourDays">Default Days</Label>
                  <Input
                    id="defaultTourDays"
                    type="number"
                    min="1"
                    max="30"
                    {...register("defaultTourDays", { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select onValueChange={(value) => setValue("theme", value)} defaultValue="light">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="auto">Auto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select onValueChange={(value) => setValue("language", value)} defaultValue="en">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Import/Export Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Import/Export Settings
              </CardTitle>
              <CardDescription>
                Configure data formats and manage settings backup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="csvDelimiter">CSV Delimiter</Label>
                  <Select onValueChange={(value) => setValue("csvDelimiter", value)} defaultValue=",">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=",">Comma (,)</SelectItem>
                      <SelectItem value=";">Semicolon (;)</SelectItem>
                      <SelectItem value="\t">Tab</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select onValueChange={(value) => setValue("dateFormat", value)} defaultValue="MM/dd/yyyy">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/dd/yyyy">MM/dd/yyyy</SelectItem>
                      <SelectItem value="dd/MM/yyyy">dd/MM/yyyy</SelectItem>
                      <SelectItem value="yyyy-MM-dd">yyyy-MM-dd</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numberFormat">Number Format</Label>
                  <Select onValueChange={(value) => setValue("numberFormat", value)} defaultValue="1,000.00">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1,000.00">1,000.00</SelectItem>
                      <SelectItem value="1.000,00">1.000,00</SelectItem>
                      <SelectItem value="1 000.00">1 000.00</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="flex flex-wrap gap-4">
                <Button type="button" variant="outline" onClick={handleExportSettings}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Settings
                </Button>
                
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportSettings}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button type="button" variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Configure alerts and notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailAlerts">Email Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications for important events
                    </p>
                  </div>
                  <Switch
                    id="emailAlerts"
                    checked={watch("emailAlerts")}
                    onCheckedChange={(checked) => setValue("emailAlerts", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="lowPricingWarnings">Low Pricing Warnings</Label>
                    <p className="text-sm text-muted-foreground">
                      Alert when pricing data seems unusually low
                    </p>
                  </div>
                  <Switch
                    id="lowPricingWarnings"
                    checked={watch("lowPricingWarnings")}
                    onCheckedChange={(checked) => setValue("lowPricingWarnings", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="analysisNotifications">Analysis Completion Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify when AI analysis is complete
                    </p>
                  </div>
                  <Switch
                    id="analysisNotifications"
                    checked={watch("analysisNotifications")}
                    onCheckedChange={(checked) => setValue("analysisNotifications", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure session and security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min="30"
                    max="480"
                    {...register("sessionTimeout", { valueAsNumber: true })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoLogout">Auto-logout after inactivity</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically log out when session expires
                    </p>
                  </div>
                  <Switch
                    id="autoLogout"
                    checked={watch("autoLogout")}
                    onCheckedChange={(checked) => setValue("autoLogout", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Assistant Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Assistant Settings
              </CardTitle>
              <CardDescription>
                Customize AI behavior and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="aiResponseLength">Response Length Preference</Label>
                  <Select onValueChange={(value) => setValue("aiResponseLength", value)} defaultValue="balanced">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="concise">Concise</SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conversationHistoryLimit">Conversation History Limit</Label>
                  <Input
                    id="conversationHistoryLimit"
                    type="number"
                    min="5"
                    max="50"
                    {...register("conversationHistoryLimit", { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoSuggestions">Auto-suggestions Enabled</Label>
                  <p className="text-sm text-muted-foreground">
                    Show smart suggestions while typing
                  </p>
                </div>
                <Switch
                  id="autoSuggestions"
                  checked={watch("autoSuggestions")}
                  onCheckedChange={(checked) => setValue("autoSuggestions", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetToDefaults}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Defaults
            </Button>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={!hasChanges || isSaving}
                className="flex items-center gap-2"
              >
                {isSaving ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSaving ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </div>

          {/* Status Alert */}
          {hasChanges && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You have unsaved changes. Make sure to save your settings before leaving this page.
              </AlertDescription>
            </Alert>
          )}
        </form>
      </div>
    </div>
  );
}
