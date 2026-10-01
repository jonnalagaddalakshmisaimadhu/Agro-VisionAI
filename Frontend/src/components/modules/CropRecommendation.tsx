import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useWeather } from "@/components/dashboard/WeatherContext";
import { Loader2 } from "lucide-react";
import { getCropRecommendations } from "@/services/geminiService";
import { getSoilTypeForLocation, getSoilNutrientsForLocation, SoilNutrients } from "@/services/soilService";
import { CropRecommendation as CropRecommendationType } from "@/types/cropPrediction";
import {
  Sprout,
  MapPin,
  Droplets,
  Thermometer,
  DollarSign,
  TrendingUp,
  Calendar,
  Target,
  BarChart3,
  AlertTriangle,
  Brain,
  History,
  Clock,
  Trash2,
} from "lucide-react";
import LocationMaps from "./LocationMaps";

export interface CropRecHistoryItem {
  id: string;
  timestamp: string;
  location: string;
  season: string;
  soilType: string;
  farmSize: string;
  cropNames: string[];
  recommendations: CropRecommendationType[];
}

const CROP_REC_HISTORY_KEY = "farmiq_crop_recommendations_history";

const CropRecommendation = () => {
  const { weatherData, loading: weatherLoading, error: weatherError, fetchWeatherByCity, useCurrentLocation, locationName, location } = useWeather();
  const [cityInput, setCityInput] = useState("");

  const [formData, setFormData] = useState({
    location: "Delhi",
    soilType: "loamy",
    farmSize: "5",
    budget: "100000",
    season: "kharif",
    previousCrop: "Rice",
    category: "All"
  });

  const [recommendations, setRecommendations] = useState<CropRecommendationType[]>([]);
  const [soilNutrients, setSoilNutrients] = useState<SoilNutrients | null>(null);
  const [iotData, setIotData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persistent Recommendation History
  const [recHistory, setRecHistory] = useState<CropRecHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(CROP_REC_HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveToHistory = (recs: CropRecommendationType[], currentForm: typeof formData) => {
    if (!recs || recs.length === 0) return;
    const item: CropRecHistoryItem = {
      id: `rec-${Date.now()}`,
      timestamp: new Date().toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }),
      location: currentForm.location,
      season: currentForm.season,
      soilType: currentForm.soilType,
      farmSize: currentForm.farmSize,
      cropNames: recs.map(r => r.cropName),
      recommendations: recs
    };
    const updated = [item, ...recHistory.filter(h => h.id !== item.id).slice(0, 19)];
    setRecHistory(updated);
    try {
      localStorage.setItem(CROP_REC_HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn("Could not save crop history to localStorage", e);
    }
  };

  const handleRestoreHistoryItem = (item: CropRecHistoryItem) => {
    setRecommendations(item.recommendations);
    setFormData(prev => ({
      ...prev,
      location: item.location,
      season: item.season,
      soilType: item.soilType,
      farmSize: item.farmSize
    }));
  };

  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recHistory.filter(h => h.id !== id);
    setRecHistory(updated);
    try {
      localStorage.setItem(CROP_REC_HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear your crop recommendation history?")) {
      setRecHistory([]);
      try {
        localStorage.removeItem(CROP_REC_HISTORY_KEY);
      } catch (e) {}
    }
  };

  useEffect(() => {
    setFormData(prev => {
      const month = new Date().getMonth() + 1; // 1-12
      let inferredSeason = "rabi"; // Winter by default
      if (month >= 6 && month <= 9) {
        inferredSeason = "kharif"; // Monsoon
      } else if (month === 4 || month === 5) {
        inferredSeason = "zaid"; // Summer
      }
      return {
        ...prev,
        location: locationName || prev.location,
        season: inferredSeason
      };
    });
  }, [locationName]);

  // When location (lat/lon) becomes available from WeatherContext, attempt soil lookup
  useEffect(() => {
    let mounted = true;
    const updateSoil = async () => {
      if (!location) return;
      try {
        const soil = await getSoilTypeForLocation(location.lat, location.lon);
        if (!mounted) return;
        setFormData(prev => ({ ...prev, soilType: soil }));

        // Update nutrients based on location and soil
        const nutrients = getSoilNutrientsForLocation(location.lat, location.lon, soil);
        setSoilNutrients(nutrients);
      } catch (err) {
        console.warn('Soil lookup error', err);
      }
    };
    updateSoil();
    return () => { mounted = false; };
  }, [location]);

  // Fetch IoT Sensor Data from Open-Meteo
  useEffect(() => {
    let mounted = true;
    const fetchIotData = async () => {
      if (!location) return;
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,relative_humidity_2m,soil_temperature_0cm,soil_moisture_0_to_7cm&timezone=auto`);
        const data = await res.json();
        if (mounted) setIotData(data.current);
      } catch (err) {
        console.warn("Failed to fetch IoT data", err);
      }
    };
    fetchIotData();
    return () => { mounted = false; };
  }, [location]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setRecommendations([]);

    try {
      console.log('🚀 Getting AI-powered dynamic crop recommendations with data:', formData);

      const aiRecommendations = await getCropRecommendations({
        location: formData.location,
        farmSize: formData.farmSize,
        soilType: formData.soilType,
        season: formData.season,
        budget: formData.budget,
        previousCrop: formData.previousCrop,
        category: formData.category
      });

      console.log('📊 Received AI recommendations:', aiRecommendations);
      setRecommendations(aiRecommendations);
      saveToHistory(aiRecommendations, formData);

    } catch (err: any) {
      console.error("Error getting recommendations:", err);
      setError("Failed to get AI-powered crop recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-5 rounded-xl border border-border shadow-xs">
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          <div className="p-2 sm:p-2.5 bg-gradient-to-r from-primary to-primary-glow rounded-lg text-white shadow-xs shrink-0">
            <Sprout className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-bold text-foreground tracking-tight leading-tight">AI Crop Recommendation</h1>
            <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-1 sm:line-clamp-none">
              Personalized crop suggestions & profit predictions based on your soil & climate
            </p>
          </div>
        </div>
      </div>

      {/* Saved Recommendations History Banner */}
      {recHistory.length > 0 && (
        <Card className="border border-emerald-200/80 bg-emerald-50/40 rounded-xl p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between pb-2.5 border-b border-emerald-100">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-emerald-700" />
              <span className="text-xs sm:text-sm font-semibold text-emerald-950">
                Recent Recommendations History ({recHistory.length})
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearHistory}
              className="text-[11px] h-7 text-red-600 hover:text-red-700 hover:bg-red-50 px-2"
            >
              Clear History
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-3">
            {recHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => handleRestoreHistoryItem(item)}
                className="group p-3 bg-white border border-emerald-200/90 rounded-lg hover:border-emerald-500 hover:shadow-xs cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span className="font-semibold text-slate-900 flex items-center gap-1 truncate max-w-[140px]">
                      <MapPin className="h-3 w-3 text-emerald-600 shrink-0" /> {item.location}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] shrink-0">
                      <Clock className="h-3 w-3" /> {item.timestamp}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 capitalize mb-2">
                    {item.season} season · {item.soilType} soil
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {item.cropNames?.slice(0, 3).map((cn, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] py-0 px-1.5 border-emerald-300 text-emerald-800 bg-emerald-50 font-medium">
                        {cn}
                      </Badge>
                    ))}
                    {(item.cropNames?.length || 0) > 3 && (
                      <span className="text-[10px] text-slate-500">+{item.cropNames.length - 3}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-[11px]">
                  <span className="text-emerald-700 font-semibold group-hover:underline">Restore Advice →</span>
                  <button
                    onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                    className="text-slate-400 hover:text-red-600 p-0.5"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Input Form */}
        <Card className="border border-border/80 shadow-xs rounded-xl bg-card">
          <CardHeader className="p-3.5 sm:p-5 pb-2 border-b border-border/50">
            <CardTitle className="text-sm sm:text-base font-semibold flex items-center justify-between">
              <span className="flex items-center space-x-2 text-foreground">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <span>Farm & Soil Parameters</span>
              </span>
              {locationName && (
                <span className="text-[11px] text-muted-foreground truncate max-w-[150px] font-normal" title={locationName}>📍 {locationName}</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 sm:p-5 space-y-3 sm:space-y-4">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="flex flex-row gap-1.5 sm:gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Search city for climate context..."
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && cityInput.trim()) { fetchWeatherByCity(cityInput.trim()); } }}
                    className="h-8 sm:h-9 text-xs sm:text-sm bg-background"
                  />
                </div>
                <Button type="button" size="sm" className="h-8 sm:h-9 px-2.5 text-xs" onClick={() => cityInput.trim() && fetchWeatherByCity(cityInput.trim())}>Search</Button>
                <Button type="button" size="sm" variant="outline" className="h-8 sm:h-9 px-2 text-xs" onClick={useCurrentLocation}><MapPin className="h-3.5 w-3.5 mr-1" /><span className="hidden sm:inline">Use </span>GPS</Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <div>
                  <Label htmlFor="location" className="text-xs">Location / District</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="e.g. Pune, Ludhiana, Guntur"
                  />
                </div>

                <div>
                  <Label htmlFor="farmSize">Farm Size (Acres)</Label>
                  <Input
                    id="farmSize"
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={formData.farmSize}
                    onChange={(e) => handleInputChange('farmSize', e.target.value)}
                    placeholder="e.g. 5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="soilType">Soil Type</Label>
                  <Select value={formData.soilType} onValueChange={(val) => handleInputChange('soilType', val)}>
                    <SelectTrigger id="soilType">
                      <SelectValue placeholder="Select soil type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="loamy">Loamy Soil</SelectItem>
                      <SelectItem value="clay">Clay Soil</SelectItem>
                      <SelectItem value="sandy">Sandy Soil</SelectItem>
                      <SelectItem value="black">Black Soil</SelectItem>
                      <SelectItem value="red">Red Soil</SelectItem>
                      <SelectItem value="alluvial">Alluvial Soil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="season">Season</Label>
                  <Select value={formData.season} onValueChange={(val) => handleInputChange('season', val)}>
                    <SelectTrigger id="season">
                      <SelectValue placeholder="Select season" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kharif">Kharif (Monsoon: Jun - Oct)</SelectItem>
                      <SelectItem value="rabi">Rabi (Winter: Oct - Mar)</SelectItem>
                      <SelectItem value="zaid">Zaid / Summer (Mar - Jun)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Crop Category</Label>
                  <Select value={formData.category} onValueChange={(val) => handleInputChange('category', val)}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">🌟 All Crops (Vegetables, Fruits, Grains)</SelectItem>
                      <SelectItem value="Vegetables">🥦 Vegetables</SelectItem>
                      <SelectItem value="Fruits">🍎 Fruits</SelectItem>
                      <SelectItem value="Grains & Millets">🌾 Grains & Millets</SelectItem>
                      <SelectItem value="Pulses & Legumes">🫘 Pulses & Legumes</SelectItem>
                      <SelectItem value="Oilseeds & Spices">🌻 Oilseeds & Spices</SelectItem>
                      <SelectItem value="Cash & Plantation">🎋 Cash & Plantation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="budget">Available Budget (₹)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                    placeholder="e.g. 100000"
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2.5">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Live Weather & Real-Time Mandi Prices...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Get Recommendations
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Live Soil & Weather Intelligence Card */}
        <Card className="border-0 shadow-card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Thermometer className="h-5 w-5 text-primary" />
              <span>Live Soil & Weather Intelligence</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <LocationMaps
              lat={location?.lat}
              lon={location?.lon}
              locationName={formData.location || locationName}
              height="280px"
            />

            {iotData && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-100">
                  <div className="flex items-center space-x-1.5 mb-1">
                    <Thermometer className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-semibold text-amber-900">Air Temp</span>
                  </div>
                  <p className="text-xl font-bold text-amber-700">{iotData.temperature_2m}°C</p>
                  <p className="text-[11px] text-amber-600/80">Ambient</p>
                </div>

                <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-100">
                  <div className="flex items-center space-x-1.5 mb-1">
                    <Droplets className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-semibold text-blue-900">Humidity</span>
                  </div>
                  <p className="text-xl font-bold text-blue-700">{iotData.relative_humidity_2m}%</p>
                  <p className="text-[11px] text-blue-600/80">Relative</p>
                </div>

                <div className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-100 col-span-2 sm:col-span-1">
                  <div className="flex items-center space-x-1.5 mb-1">
                    <Droplets className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-900">Soil Moisture</span>
                  </div>
                  <p className="text-xl font-bold text-emerald-700">{iotData.soil_moisture_0_to_7cm} m³/m³</p>
                  <p className="text-[11px] text-emerald-600/80">0-7cm depth</p>
                </div>
              </div>
            )}

            <div className="p-4 bg-gradient-to-r from-success/10 to-primary/10 rounded-lg border border-success/20">
              <h4 className="font-semibold text-success mb-2 text-sm">Soil Health Status ({formData.soilType})</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Nitrogen (N)</span>
                  <Badge variant="secondary">{soilNutrients?.nitrogen || 'Optimal'}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Phosphorus (P)</span>
                  <Badge variant="secondary">{soilNutrients?.phosphorus || 'Medium'}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Potassium (K)</span>
                  <Badge variant="secondary">{soilNutrients?.potassium || 'High'}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Recommendations Results */}
      {recommendations.length > 0 && (
        <div className="space-y-6 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold flex items-center">
                <Brain className="mr-2 h-5 w-5 text-primary" />
                AI-Powered Crop Recommendations ({recommendations.length} Varieties)
              </h2>
              <p className="text-sm text-muted-foreground">
                Personalized recommendations calculated mathematically from live Mandi prices & weather conditions
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSubmit()}
                disabled={loading}
                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800"
              >
                <Target className="mr-2 h-4 w-4" />
                Recalculate
              </Button>
            </div>
          </div>

          {/* 6 Crop Recommendations Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((rec, index) => {
              return (
                <Card key={index} className="border-2 border-gray-200 bg-white shadow-card-shadow hover:shadow-hover-lift hover:bg-gray-50 transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          <span className="font-semibold">{rec.cropName}</span>
                        </CardTitle>
                        {rec.category && (
                          <span className="text-[11px] text-muted-foreground font-medium">{rec.category}</span>
                        )}
                      </div>
                      <Badge
                        className={
                          rec.profitability === "High Profit"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : rec.profitability === "Medium Profit"
                              ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                              : "bg-gray-100 text-gray-800 border-gray-200"
                        }
                      >
                        {rec.profitability}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-2 bg-gray-50 rounded-md border border-gray-100">
                        <p className="text-gray-600 text-xs font-medium flex items-center">
                          <Brain className="w-3 h-3 mr-1 text-primary" /> Yield
                        </p>
                        <p className="font-semibold text-gray-900 line-clamp-1" title={rec.expectedYield}>{rec.expectedYield}</p>
                      </div>
                      <div className="p-2 bg-gray-50 rounded-md border border-gray-100">
                        <p className="text-gray-600 text-xs font-medium flex items-center">
                          <Calendar className="w-3 h-3 mr-1 text-primary" /> Duration
                        </p>
                        <p className="font-semibold text-gray-900">{rec.duration}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 space-y-1">
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-blue-700 font-medium flex items-center">
                          <TrendingUp className="w-3 h-3 mr-1" /> Market Price
                        </p>
                        <span className="text-sm font-bold text-blue-900">{rec.marketPrice}</span>
                      </div>
                      {rec.priceTrend && (
                        <div className="text-[11px] text-blue-600 border-t border-blue-200 pt-1 mt-1">
                          Trend: {rec.priceTrend}
                        </div>
                      )}
                    </div>

                    {/* Profit Information */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-red-50/50 rounded-lg border border-red-100">
                        <p className="text-xs text-red-700 font-medium">Investment</p>
                        <p className="text-sm font-bold text-red-900">{rec.investment}</p>
                      </div>
                      <div className="p-3 bg-green-50/50 rounded-lg border border-green-100">
                        <p className="text-xs text-green-700 font-medium">Net Profit</p>
                        <p className="text-sm font-bold text-green-900">{rec.estimatedProfit || "N/A"}</p>
                      </div>
                    </div>

                    {/* Reasons */}
                    <div>
                      <p className="text-sm font-semibold mb-2 text-gray-800">Why this crop?</p>
                      <ul className="space-y-1.5">
                        {rec.reasons && rec.reasons.map((reason: string, idx: number) => (
                          <li key={idx} className="text-xs text-gray-700 flex items-start">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2 mt-1.5 flex-shrink-0"></div>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90 text-white">
                        <BarChart3 className="mr-2 h-3 w-3" />
                        Analysis
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 border-primary/20 hover:bg-primary/5">
                        <Sprout className="mr-2 h-3 w-3" />
                        Plan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CropRecommendation;