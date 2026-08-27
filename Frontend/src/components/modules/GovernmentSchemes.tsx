import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Search,
  Filter,
  MapPin,
  IndianRupee,
  Users,
  Wheat,
  Tractor,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Volume2,
  VolumeX,
  CheckCircle,
  ShieldCheck,
  RotateCcw
} from "lucide-react";
import { governmentSchemesService, GovernmentScheme, RefreshStatus } from "@/services/governmentSchemesService";

const GovernmentSchemes = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("Andhra Pradesh");
  const [selectedCrop, setSelectedCrop] = useState("All Crops");
  const [selectedCategory, setSelectedCategory] = useState("All Types");
  const [landAcres, setLandAcres] = useState("2.5");
  const [farmerType, setFarmerType] = useState("Small Farmer");
  const [language, setLanguage] = useState<"en" | "te" | "hi">("en");

  const [schemes, setSchemes] = useState<GovernmentScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatus | null>(null);
  const [states, setStates] = useState<string[]>([]);
  const [crops, setCrops] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // Calculation Result state
  const [eligibilityResult, setEligibilityResult] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);

  // Active voice readout state
  const [speakingSchemeId, setSpeakingSchemeId] = useState<number | null>(null);

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
      setStates(statesData.states || ["All India", "Andhra Pradesh", "Telangana", "Karnataka", "Maharashtra", "Tamil Nadu", "Punjab", "Uttar Pradesh"]);
      setCategories(categoriesData.categories ? categoriesData.categories.map(c => c.name) : ["Direct Benefit Transfer", "Insurance", "Credit/Loan", "Equipment", "Soil Management", "Sustainable Agriculture", "Digital Agriculture"]);
      setCrops(["All Crops", "Paddy", "Rice", "Wheat", "Cotton", "Maize", "Sugarcane", "Chilli", "Groundnut", "Vegetables", "Fruits"]);

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
      const updatedSchemes = await governmentSchemesService.getSchemes();
      setSchemes(updatedSchemes);
      const status = await governmentSchemesService.getRefreshStatus();
      setRefreshStatus(status);
    } catch (error) {
      console.error('Error refreshing schemes:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCheckEligibility = async () => {
    try {
      setCalculating(true);
      const res = await fetch("/api/schemes/check-eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: selectedState,
          landholding_acres: parseFloat(landAcres) || 2.0,
          farmer_type: farmerType,
          crop: selectedCrop === "All Crops" ? "Paddy" : selectedCrop
        })
      });
      if (res.ok) {
        const data = await res.json();
        setEligibilityResult(data);
      }
    } catch (e) {
      console.error("Eligibility check failed:", e);
    } finally {
      setCalculating(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedState("All India");
    setSelectedCrop("All Crops");
    setSelectedCategory("All Types");
    setLandAcres("2.5");
    setFarmerType("Small Farmer");
    setEligibilityResult(null);
  };

  const handleSpeakScheme = async (scheme: GovernmentScheme) => {
    try {
      if (speakingSchemeId === scheme.id) {
        if ("speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
        setSpeakingSchemeId(null);
        return;
      }

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }

      const res = await fetch(`/api/schemes/${scheme.id}/voice-summary?lang=${language}`);
      let textToSpeak = `${scheme.name}. Benefits: ${scheme.benefits}. Eligibility: ${scheme.eligibility_criteria}`;
      if (res.ok) {
        const d = await res.json();
        if (d.voice_script) textToSpeak = d.voice_script;
      }

      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        if (language === "te") utterance.lang = "te-IN";
        else if (language === "hi") utterance.lang = "hi-IN";
        else utterance.lang = "en-IN";

        utterance.onend = () => setSpeakingSchemeId(null);
        utterance.onerror = () => setSpeakingSchemeId(null);

        setSpeakingSchemeId(scheme.id);
        window.speechSynthesis.speak(utterance);
      } else {
        alert(textToSpeak);
      }
    } catch (e) {
      console.error("Speech error:", e);
      setSpeakingSchemeId(null);
    }
  };

  // Real-time scheme filtering based on active selections
  const filteredSchemes = schemes.filter(scheme => {
    const matchesSearch = scheme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scheme.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesState = !selectedState || selectedState === "All India" || scheme.applicable_states.includes(selectedState);
    const matchesCrop = !selectedCrop || selectedCrop === "All Crops" || scheme.applicable_crops.includes(selectedCrop);
    const matchesCategory = !selectedCategory || selectedCategory === "All Types" || scheme.category === selectedCategory;

    return matchesSearch && matchesState && matchesCrop && matchesCategory;
  });

  const newSchemes = schemes.filter(scheme => scheme.is_new);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Government & Private Schemes</h1>
          <p className="text-muted-foreground">
            Direct Cash Grants (DBT), Crop Insurance, Micro-Irrigation, and Machinery Subsidies
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Vernacular Language Selector */}
          <Select value={language} onValueChange={(val: any) => setLanguage(val)}>
            <SelectTrigger className="w-[140px] bg-background shadow-sm">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="te">తెలుగు (Telugu)</SelectItem>
              <SelectItem value="hi">हिंदी (Hindi)</SelectItem>
            </SelectContent>
          </Select>

          {/* Sync Government Portals */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-primary" : ""}`} />
            {refreshing ? "Syncing..." : "Sync Portals"}
          </Button>
        </div>
      </div>

      {/* 🚀 Single Unified Finder & Eligibility Panel */}
      <Card className="border-2 border-primary/20 shadow-md bg-card">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-primary text-lg">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Scheme Finder & Subsidy Calculator
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Showing <strong>{filteredSchemes.length}</strong> matching schemes</span>
              <Button variant="ghost" size="sm" onClick={handleResetFilters} className="h-8 text-xs text-muted-foreground hover:text-foreground">
                <RotateCcw className="h-3 w-3 mr-1" /> Reset
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          {/* Main Filter Row: Search + State + Crop + Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Search Keyword</label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="e.g. Kisan, Insurance, Drip..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-background"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">State / Territory</label>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="mt-1 bg-background">
                  <MapPin className="h-3.5 w-3.5 mr-1 text-primary" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All India">All India</SelectItem>
                  {states.filter(s => s !== "All India").map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Crop Cultivated</label>
              <Select value={selectedCrop} onValueChange={setSelectedCrop}>
                <SelectTrigger className="mt-1 bg-background">
                  <Wheat className="h-3.5 w-3.5 mr-1 text-primary" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {crops.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Scheme Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="mt-1 bg-background">
                  <Filter className="h-3.5 w-3.5 mr-1 text-primary" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Types">All Categories</SelectItem>
                  {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sub Row: Land Size + Farmer Type + Subsidy Calculate Button */}
          <div className="p-3.5 rounded-lg bg-muted/40 border border-border/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full md:w-2/3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Landholding (in Acres):</label>
                <Input
                  type="number"
                  step="0.5"
                  min="0.1"
                  className="mt-1 bg-background h-9"
                  value={landAcres}
                  onChange={e => setLandAcres(e.target.value)}
                  placeholder="e.g. 2.5"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Farmer Type:</label>
                <Select value={farmerType} onValueChange={setFarmerType}>
                  <SelectTrigger className="mt-1 bg-background h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Small Farmer">Small Farmer (≤ 5 Acres)</SelectItem>
                    <SelectItem value="Marginal Farmer">Marginal Farmer (≤ 2.5 Acres)</SelectItem>
                    <SelectItem value="Tenant Farmer">Tenant Farmer</SelectItem>
                    <SelectItem value="Large Farmer">Large Farmer (Above 5 Acres)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              className="w-full md:w-auto h-9 font-semibold shrink-0 gap-2 shadow-sm"
              onClick={handleCheckEligibility}
              disabled={calculating}
            >
              <Sparkles className="h-4 w-4" />
              {calculating ? "Evaluating..." : "Calculate My Subsidies"}
            </Button>
          </div>

          {/* Instant Subsidy Estimate Card */}
          {eligibilityResult && (
            <div className="p-4 rounded-xl bg-card border-2 border-success/40 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b pb-3">
                <div>
                  <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    You Qualify for {eligibilityResult.eligible_scheme_count} Government Schemes!
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Based on {eligibilityResult.applicant.landholding_acres} acres in {eligibilityResult.applicant.state} for {eligibilityResult.applicant.crop}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground uppercase font-medium">Estimated Total Grant Value</span>
                  <div className="text-2xl font-black text-success">
                    ₹{eligibilityResult.total_estimated_benefit_inr.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                {eligibilityResult.matched_schemes.map((ms: any) => (
                  <div key={ms.id} className="p-3 bg-muted/40 rounded-lg flex items-center justify-between gap-2 border">
                    <div>
                      <p className="font-semibold text-sm">{ms.name}</p>
                      <p className="text-xs text-success font-medium">{ms.benefits}</p>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <a href={ms.official_apply_url} target="_blank" rel="noreferrer">
                        Apply <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Newly Released Schemes Alert */}
      {newSchemes.length > 0 && (
        <Alert className="border-success/50 bg-success/5">
          <Sparkles className="h-4 w-4 text-success" />
          <AlertTitle className="text-success font-bold">Newly Announced on Market</AlertTitle>
          <AlertDescription className="text-muted-foreground flex flex-wrap items-center gap-2 mt-1">
            <span>{newSchemes[0].name} has been published by the Ministry of Agriculture.</span>
            <Badge className="bg-success text-success-foreground font-semibold">✨ New Release</Badge>
          </AlertDescription>
        </Alert>
      )}

      {/* Schemes Grid */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin text-primary" />
          <h3 className="text-lg font-medium text-muted-foreground">Loading schemes catalog...</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchemes.map((scheme) => (
            <Card key={scheme.id} className="border-0 shadow-card-shadow hover:shadow-hover-lift transition-all duration-300 relative overflow-hidden flex flex-col justify-between">
              {scheme.is_new && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-success text-success-foreground">✨ New</Badge>
                </div>
              )}

              <div>
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
                  <p className="text-muted-foreground text-sm line-clamp-3">{scheme.description}</p>

                  <div className="space-y-3 pt-2">
                    <div>
                      <h4 className="font-medium text-sm flex items-center gap-2 mb-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        Eligibility
                      </h4>
                      <p className="text-xs text-muted-foreground">{scheme.eligibility_criteria}</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm flex items-center gap-2 mb-1">
                        <IndianRupee className="h-4 w-4 text-success" />
                        Financial Benefit & Subsidy
                      </h4>
                      <p className="text-sm text-success font-bold">{scheme.benefits}</p>
                      <p className="text-xs text-muted-foreground">Subsidy: {scheme.subsidy_percentage}</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm flex items-center gap-2 mb-1">
                        <Wheat className="h-4 w-4 text-muted-foreground" />
                        Applicable States & Crops
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {scheme.applicable_states.slice(0, 2).map(st => (
                          <Badge key={st} variant="secondary" className="text-xs">{st}</Badge>
                        ))}
                        {scheme.applicable_crops.slice(0, 2).map(cr => (
                          <Badge key={cr} variant="outline" className="text-xs">{cr}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </div>

              {/* Action Buttons */}
              <div className="p-6 pt-0 flex items-center gap-2">
                <Button
                  className="flex-1 font-semibold"
                  size="sm"
                  asChild
                >
                  <a href={scheme.official_apply_url || scheme.website_url} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Apply Official
                  </a>
                </Button>

                <Button
                  variant={speakingSchemeId === scheme.id ? "destructive" : "outline"}
                  size="sm"
                  title={speakingSchemeId === scheme.id ? "Stop Audio" : "Listen in Telugu/Hindi/English"}
                  onClick={() => handleSpeakScheme(scheme)}
                  className={`flex items-center gap-1 ${speakingSchemeId === scheme.id ? "bg-destructive text-destructive-foreground animate-pulse" : "text-primary"}`}
                >
                  {speakingSchemeId === scheme.id ? (
                    <>
                      <VolumeX className="h-4 w-4" />
                      <span className="text-xs">Stop</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-4 w-4" />
                      <span className="text-xs hidden sm:inline">Listen</span>
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {filteredSchemes.length === 0 && !loading && (
        <div className="text-center py-12">
          <Tractor className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">No schemes match your filters</h3>
          <p className="text-muted-foreground text-sm">Try choosing "All India" or clearing your crop filter</p>
        </div>
      )}
    </div>
  );
};

export default GovernmentSchemes;