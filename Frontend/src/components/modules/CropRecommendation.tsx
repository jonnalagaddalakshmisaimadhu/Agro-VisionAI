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
} from "lucide-react";
import LocationMaps from "./LocationMaps";

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
    <div className="space-y-6 lg:pl-4 pt-6">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gradient-to-r from-primary to-primary-glow rounded-lg">
          <Sprout className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AI Crop Recommendation</h1>
          <p className="text-muted-foreground">Get personalized crop suggestions based on your farm conditions</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card className="border-0 shadow-card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Farm Details</span>
              </span>
              {locationName && (
                <span className="hidden sm:inline text-xs text-muted-foreground truncate max-w-[200px]" title={locationName}>{locationName}</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Search city for weather context..."
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && cityInput.trim()) { fetchWeatherByCity(cityInput.trim()); } }}
                  />
                </div>
                <Button type="button" onClick={() => cityInput.trim() && fetchWeatherByCity(cityInput.trim())}>Search</Button>
                <Button type="button" variant="outline" onClick={useCurrentLocation}><MapPin className="h-4 w-4 mr-1.5" />Use Current</Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location / District</Label>
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