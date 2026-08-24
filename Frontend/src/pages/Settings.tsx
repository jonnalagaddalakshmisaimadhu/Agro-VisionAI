import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Globe,
  Palette,
  Database,
  Download,
  Trash2,
  Eye,
  EyeOff,
  Save,
  RefreshCw
} from "lucide-react";

const SettingsPage = () => {
  const { updateUser } = useAuth();
  const { toast } = useToast();
  
  // General Settings
  const [language, setLanguage] = useState("en");
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState("system");
  const [region, setRegion] = useState("IN");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  
  // Privacy Settings
  const [privacyShare, setPrivacyShare] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState("public");
  const [dataRetention, setDataRetention] = useState("1year");
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  
  // Notification Settings
  const [notifWeather, setNotifWeather] = useState(true);
  const [notifMarket, setNotifMarket] = useState(true);
  const [notifDisease, setNotifDisease] = useState(true);
  const [notifGeneral, setNotifGeneral] = useState(true);
  const [notifEmail, setNotifEmail] = useState(false);
  const [notifSMS, setNotifSMS] = useState(false);
  const [notifPush, setNotifPush] = useState(true);
  
  // Account Settings
  const [firstName, setFirstName] = useState("John");
  const [lastName, setLastName] = useState("Doe");
  const [email, setEmail] = useState("john.doe@example.com");
  const [phone, setPhone] = useState("+91 86396 68662");
  const [farmSize, setFarmSize] = useState("");
  const [cropTypes, setCropTypes] = useState("");
  const [location, setLocation] = useState("Pune, Maharashtra");
  
  // Display Settings
  const [compactMode, setCompactMode] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState("5");
  const [showTips, setShowTips] = useState(true);
  
  // Data Management
  const [exportFormat, setExportFormat] = useState("csv");
  const [backupFrequency, setBackupFrequency] = useState("weekly");
  
  const handleSaveSettings = () => {
    updateUser({});
    toast({ 
      title: "Settings Saved", 
      description: "Your preferences have been updated successfully." 
    });
  };
  
  const handleExportData = () => {
    toast({ 
      title: "Data Export Started", 
      description: `Your data will be exported in ${exportFormat.toUpperCase()} format.` 
    });
  };
  
  const handleDeleteAccount = () => {
    toast({ 
      title: "Account Deletion", 
      description: "Account deletion request has been submitted. You will receive an email confirmation.",
      variant: "destructive"
    });
  };
  
  const handleResetSettings = () => {
    toast({ 
      title: "Settings Reset", 
      description: "All settings have been reset to default values." 
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gradient-to-r from-primary to-success rounded-lg">
          <SettingsIcon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and application settings</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center space-x-2">
            <Globe className="h-4 w-4" />
            <span>General</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Account</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Privacy</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>Data</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>General Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium">Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">हिंदी</SelectItem>
                      <SelectItem value="te">తెలుగు</SelectItem>
                      <SelectItem value="ta">தமிழ்</SelectItem>
                      <SelectItem value="bn">বাংলা</SelectItem>
                      <SelectItem value="mr">मराठी</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Theme</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger>
                      <SelectValue placeholder="Theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">Auto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Region</Label>
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger>
                      <SelectValue placeholder="Region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IN">India</SelectItem>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger>
                      <SelectValue placeholder="Timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">America/New_York</SelectItem>
                      <SelectItem value="Europe/London">Europe/London</SelectItem>
                      <SelectItem value="Australia/Sydney">Australia/Sydney</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="text-sm font-medium">Display Settings</Label>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-md border">
                    <Switch checked={compactMode} onCheckedChange={setCompactMode} />
                    <div>
                      <p className="text-sm font-medium">Compact Mode</p>
                      <p className="text-xs text-muted-foreground">Use smaller spacing and condensed layout</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-md border">
                    <Switch checked={showTips} onCheckedChange={setShowTips} />
                    <div>
                      <p className="text-sm font-medium">Show Tips</p>
                      <p className="text-xs text-muted-foreground">Display helpful tips and guides</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-medium">Auto Refresh</Label>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-md border">
                    <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                    <div>
                      <p className="text-sm font-medium">Enable Auto Refresh</p>
                      <p className="text-xs text-muted-foreground">Automatically refresh data</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Refresh Interval (minutes)</Label>
                    <Select value={refreshInterval} onValueChange={setRefreshInterval}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select interval" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 minute</SelectItem>
                        <SelectItem value="5">5 minutes</SelectItem>
                        <SelectItem value="10">10 minutes</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Settings Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Account Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium">First Name</Label>
                  <Input 
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Name</Label>
                  <Input 
                    value={lastName} 
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter last name"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <Input 
                    type="email"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone Number</Label>
                  <Input 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Farm Size (acres)</Label>
                  <Input 
                    value={farmSize} 
                    onChange={(e) => setFarmSize(e.target.value)}
                    placeholder="Enter farm size"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Location</Label>
                  <Input 
                    value={location} 
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter location"
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Crop Types</Label>
                <Input 
                  value={cropTypes} 
                  onChange={(e) => setCropTypes(e.target.value)}
                  placeholder="Enter crop types (comma separated)"
                />
              </div>

              <Separator />

              <div className="flex space-x-4">
                <Button onClick={handleSaveSettings} className="bg-primary hover:bg-primary/90">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={handleResetSettings}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset to Default
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notification Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-sm font-medium">Notification Methods</Label>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-md border">
                    <Switch checked={notifPush} onCheckedChange={setNotifPush} />
                    <div>
                      <p className="text-sm font-medium">Push Notifications</p>
                      <p className="text-xs text-muted-foreground">Browser notifications</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-md border">
                    <Switch checked={notifEmail} onCheckedChange={setNotifEmail} />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-xs text-muted-foreground">Email notifications</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-md border">
                    <Switch checked={notifSMS} onCheckedChange={setNotifSMS} />
                    <div>
                      <p className="text-sm font-medium">SMS</p>
                      <p className="text-xs text-muted-foreground">Text messages</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="text-sm font-medium">Notification Types</Label>
                <div className="space-y-3 p-3 rounded-md border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Weather Alerts</p>
                      <p className="text-xs text-muted-foreground">Get notified about weather changes</p>
                    </div>
                    <Switch checked={notifWeather} onCheckedChange={setNotifWeather} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Market Price Updates</p>
                      <p className="text-xs text-muted-foreground">Stay updated with market prices</p>
                    </div>
                    <Switch checked={notifMarket} onCheckedChange={setNotifMarket} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Disease Alerts</p>
                      <p className="text-xs text-muted-foreground">Important crop disease notifications</p>
                    </div>
                    <Switch checked={notifDisease} onCheckedChange={setNotifDisease} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">General Updates</p>
                      <p className="text-xs text-muted-foreground">App updates and announcements</p>
                    </div>
                    <Switch checked={notifGeneral} onCheckedChange={setNotifGeneral} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Privacy & Security</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-sm font-medium">Data Sharing</Label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-md border">
                    <Switch checked={privacyShare} onCheckedChange={setPrivacyShare} />
                    <div>
                      <p className="text-sm font-medium">Allow Data Sharing</p>
                      <p className="text-xs text-muted-foreground">Help improve recommendations and alerts</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-md border">
                    <Switch checked={analyticsEnabled} onCheckedChange={setAnalyticsEnabled} />
                    <div>
                      <p className="text-sm font-medium">Analytics & Usage Data</p>
                      <p className="text-xs text-muted-foreground">Help us improve the application</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="text-sm font-medium">Profile Visibility</Label>
                <Select value={profileVisibility} onValueChange={setProfileVisibility}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="friends">Friends Only</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-medium">Data Retention</Label>
                <Select value={dataRetention} onValueChange={setDataRetention}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select retention period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6months">6 Months</SelectItem>
                    <SelectItem value="1year">1 Year</SelectItem>
                    <SelectItem value="2years">2 Years</SelectItem>
                    <SelectItem value="forever">Forever</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="text-sm font-medium">Account Actions</Label>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Management Tab */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Data Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-sm font-medium">Export Data</Label>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Export Format</Label>
                    <Select value={exportFormat} onValueChange={setExportFormat}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleExportData} className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="text-sm font-medium">Backup Settings</Label>
                <div>
                  <Label className="text-sm font-medium">Backup Frequency</Label>
                  <Select value={backupFrequency} onValueChange={setBackupFrequency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="manual">Manual Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="text-sm font-medium">Storage Usage</Label>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Used Storage</span>
                    <span>2.3 GB / 5 GB</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '46%' }}></div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <Button onClick={handleSaveSettings} className="bg-primary hover:bg-primary/90">
                  <Save className="h-4 w-4 mr-2" />
                  Save All Settings
                </Button>
                <Button variant="outline" onClick={handleResetSettings}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;



