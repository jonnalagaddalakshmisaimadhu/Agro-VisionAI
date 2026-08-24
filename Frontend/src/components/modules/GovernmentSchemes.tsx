import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Search,
  Filter,
  Bell,
  MessageCircle,
  MapPin,
  IndianRupee,
  Users,
  Wheat,
  Tractor,
  FileText,
  ExternalLink,
  Sparkles,
  Globe,
  RefreshCw,
  Clock,
  CheckCircle,
  Building
} from "lucide-react";
import { governmentSchemesService, GovernmentScheme, RefreshStatus } from "@/services/governmentSchemesService";

const GovernmentSchemes = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedSector, setSelectedSector] = useState("");
  const [language, setLanguage] = useState("en");
  const [schemes, setSchemes] = useState<GovernmentScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatus | null>(null);
  const [states, setStates] = useState<string[]>([]);
  const [crops, setCrops] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [schemesData, statesData, categoriesData] = await Promise.all([
        governmentSchemesService.getSchemes(),
        governmentSchemesService.getStates(),
        governmentSchemesService.getCategories()
      ]);

      setSchemes(schemesData);
      setStates(statesData.states);
      setTypes(categoriesData.categories.map(c => c.name));
      setCrops(["All Crops", "Rice", "Wheat", "Cotton", "Sugarcane", "Organic Crops"]);

      // Load refresh status
      const status = await governmentSchemesService.getRefreshStatus();
      setRefreshStatus(status);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await governmentSchemesService.refreshSchemes();
      // Reload schemes after refresh
      const updatedSchemes = await governmentSchemesService.getSchemes();
      setSchemes(updatedSchemes);

      // Update refresh status
      const status = await governmentSchemesService.getRefreshStatus();
      setRefreshStatus(status);
    } catch (error) {
      console.error('Error refreshing schemes:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleMarkNewSchemesSeen = async () => {
    try {
      await governmentSchemesService.markNewSchemesSeen();
      // Reload schemes to update is_new status
      const updatedSchemes = await governmentSchemesService.getSchemes();
      setSchemes(updatedSchemes);
    } catch (error) {
      console.error('Error marking schemes as seen:', error);
    }
  };

  const filteredSchemes = schemes.filter(scheme => {
    const matchesSearch = scheme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scheme.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesState = !selectedState || selectedState === "All India" || scheme.applicable_states.includes(selectedState);
    const matchesCrop = !selectedCrop || selectedCrop === "All Crops" || scheme.applicable_crops.includes(selectedCrop);
    const matchesType = !selectedType || selectedType === "All Types" || scheme.category === selectedType;
    const matchesSector = !selectedSector || selectedSector === "All Sectors" || scheme.sector === selectedSector;

    return matchesSearch && matchesState && matchesCrop && matchesType && matchesSector;
  });

  const newSchemes = schemes.filter(scheme => scheme.is_new);
  const expiringSchemes = schemes.filter(scheme => {
    if (!scheme.expiry_date) return false;
    const expiryDate = new Date(scheme.expiry_date);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  });

  const formatLastRefresh = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Government Schemes & Subsidy Checker
          </h1>
          <p className="text-muted-foreground mt-2">
            Discover government schemes, subsidies, and financial support for farmers
          </p>
          {refreshStatus && (
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Last updated: {formatLastRefresh(refreshStatus.last_refresh)}</span>
              {refreshStatus.next_refresh && (
                <span>• Next refresh: {formatLastRefresh(refreshStatus.next_refresh)}</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>

          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-32">
              <Globe className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="hi">हिंदी</SelectItem>
              <SelectItem value="ta">தமிழ்</SelectItem>
              <SelectItem value="te">తెలుగు</SelectItem>
              <SelectItem value="bn">বাংলা</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm">
            <MessageCircle className="h-4 w-4 mr-2" />
            Help & Chat
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {(newSchemes.length > 0 || expiringSchemes.length > 0) && (
        <div className="space-y-3">
          {newSchemes.length > 0 && (
            <Alert className="border-primary bg-primary/5">
              <Bell className="h-4 w-4 text-primary" />
              <AlertDescription className="text-primary flex items-center justify-between">
                <div>
                  <strong>New Schemes Available:</strong> {newSchemes.length} new government schemes have been launched.
                  Check them out for additional benefits!
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkNewSchemesSeen}
                  className="ml-4"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Seen
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {expiringSchemes.length > 0 && (
            <Alert className="border-warning bg-warning/5">
              <Bell className="h-4 w-4 text-warning" />
              <AlertDescription className="text-warning">
                <strong>Expiring Soon:</strong> {expiringSchemes.length} schemes are expiring soon.
                Apply before the deadline!
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* AI Suggestion Box */}
      <Card className="border-0 shadow-card-shadow bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            Best Schemes for You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Based on your profile, we recommend these schemes for maximum benefits
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">PM-KISAN (₹6,000/year)</Badge>
            <Badge variant="secondary">Crop Insurance (50% premium)</Badge>
            <Badge variant="secondary">Soil Health Card (Free)</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card className="border-0 shadow-card-shadow">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-4 lg:col-span-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search schemes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger>
                <MapPin className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent>
                {states.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCrop} onValueChange={setSelectedCrop}>
              <SelectTrigger>
                <Wheat className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Crop Type" />
              </SelectTrigger>
              <SelectContent>
                {crops.map(crop => (
                  <SelectItem key={crop} value={crop}>{crop}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSector} onValueChange={setSelectedSector}>
              <SelectTrigger>
                <Building className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Sectors">All Sectors</SelectItem>
                <SelectItem value="Government">Government</SelectItem>
                <SelectItem value="Private">Private</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Scheme Type" />
              </SelectTrigger>
              <SelectContent>
                {types.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Schemes Grid */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="h-16 w-16 text-muted-foreground mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-medium text-muted-foreground">Loading schemes...</h3>
          <p className="text-muted-foreground">Please wait while we fetch the latest government schemes</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchemes.map((scheme) => (
            <Card key={scheme.id} className="border-0 shadow-card-shadow hover:shadow-hover-lift transition-all duration-300 relative overflow-hidden">
              {scheme.is_new && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-success text-success-foreground">New</Badge>
                </div>
              )}
              {(() => {
                if (!scheme.expiry_date) return null;
                const expiryDate = new Date(scheme.expiry_date);
                const now = new Date();
                const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
                  return (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-warning text-warning-foreground">Expiring</Badge>
                    </div>
                  );
                }
                return null;
              })()}

              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg leading-tight w-3/4">{scheme.name}</CardTitle>
                  <Badge variant={scheme.sector === "Government" ? "default" : "secondary"}>
                    {scheme.sector}
                  </Badge>
                </div>
                <Badge variant="outline" className="w-fit mt-2">{scheme.category}</Badge>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">{scheme.description}</p>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      Eligibility
                    </h4>
                    <p className="text-sm text-muted-foreground">{scheme.eligibility_criteria}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm flex items-center gap-2 mb-1">
                      <IndianRupee className="h-4 w-4 text-success" />
                      Benefits
                    </h4>
                    <p className="text-sm text-success font-medium">{scheme.benefits}</p>
                    <p className="text-xs text-muted-foreground">Subsidy: {scheme.subsidy_percentage}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm flex items-center gap-2 mb-1">
                      <Wheat className="h-4 w-4 text-muted-foreground" />
                      Applicable Crops
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {scheme.applicable_crops.slice(0, 2).map(crop => (
                        <Badge key={crop} variant="secondary" className="text-xs">{crop}</Badge>
                      ))}
                      {scheme.applicable_crops.length > 2 && (
                        <Badge variant="secondary" className="text-xs">+{scheme.applicable_crops.length - 2} more</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1"
                    size="sm"
                    onClick={() => governmentSchemesService.openApplySite(scheme.official_apply_url)}
                    disabled={!scheme.official_apply_url}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Apply Now
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => governmentSchemesService.openOfficialSite(scheme.website_url)}
                    disabled={!scheme.website_url}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredSchemes.length === 0 && (
        <div className="text-center py-12">
          <Tractor className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">No schemes found</h3>
          <p className="text-muted-foreground">Try adjusting your search criteria or filters</p>
        </div>
      )}
    </div>
  );
};

export default GovernmentSchemes;