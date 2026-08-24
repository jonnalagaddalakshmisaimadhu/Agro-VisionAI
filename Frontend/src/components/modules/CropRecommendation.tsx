import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useWeather } from "@/components/dashboard/WeatherContext";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
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

        // Move focus to next field (farm size)
        const farmSizeInput = document.getElementById('farmSize');
        if (farmSizeInput) {
          (farmSizeInput as HTMLInputElement).focus();
        }
      } catch (err) {
        console.warn('Soil lookup error', err);
      }
    };
    updateSoil();
    return () => { mounted = false; };
  }, [location]);
  const [formData, setFormData] = useState({
    location: "Delhi",
    soilType: "loamy",
    farmSize: "12",
    budget: "100000",
    season: "rabi",
    previousCrop: "Rice"
  });

  const [recommendations, setRecommendations] = useState<CropRecommendationType[]>([]);
  const [soilNutrients, setSoilNutrients] = useState<SoilNutrients | null>(null);
  const [iotData, setIotData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRecommendations([]);

    try {
      console.log('🚀 Getting AI-powered crop recommendations with data:', formData);

      const aiRecommendations = await getCropRecommendations({
        location: formData.location,
        farmSize: formData.farmSize,
        soilType: formData.soilType,
        season: formData.season,
        budget: formData.budget,
        previousCrop: formData.previousCrop
      });

      console.log('📊 Received AI recommendations:', aiRecommendations);

      setRecommendations(aiRecommendations);

    } catch (err) {
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Pune, Maharashtra"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="farmSize">Farm Size (acres)</Label>
                  <Input
                    id="farmSize"
                    placeholder="e.g., 12"
                    type="number"
                    value={formData.farmSize}
                    onChange={(e) => handleInputChange("farmSize", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="soilType">Soil Type</Label>
                  <Select value={formData.soilType} onValueChange={(value) => handleInputChange("soilType", value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select soil type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                      <SelectItem value="loamy" className="text-gray-900 hover:bg-gray-100">Loamy Soil</SelectItem>
                      <SelectItem value="clay" className="text-gray-900 hover:bg-gray-100">Clay Soil</SelectItem>
                      <SelectItem value="sandy" className="text-gray-900 hover:bg-gray-100">Sandy Soil</SelectItem>
                      <SelectItem value="silt" className="text-gray-900 hover:bg-gray-100">Silt Soil</SelectItem>
                      <SelectItem value="black" className="text-gray-900 hover:bg-gray-100">Black Soil</SelectItem>
                      <SelectItem value="red" className="text-gray-900 hover:bg-gray-100">Red Soil</SelectItem>
                      <SelectItem value="alluvial" className="text-gray-900 hover:bg-gray-100">Alluvial Soil</SelectItem>
                      <SelectItem value="mixed" className="text-gray-900 hover:bg-gray-100">Mixed Soil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="season">Season</Label>
                  <Select value={formData.season} onValueChange={(value) => handleInputChange("season", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select season" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kharif">Kharif (Monsoon)</SelectItem>
                      <SelectItem value="rabi">Rabi (Winter)</SelectItem>
                      <SelectItem value="zaid">Zaid (Summer)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget">Budget (₹)</Label>
                  <Input
                    id="budget"
                    placeholder="e.g., 100000"
                    type="number"
                    value={formData.budget}
                    onChange={(e) => handleInputChange("budget", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="previousCrop">Previous Crop</Label>
                  <Input
                    id="previousCrop"
                    placeholder="e.g., Rice"
                    value={formData.previousCrop}
                    onChange={(e) => handleInputChange("previousCrop", e.target.value)}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Target className="mr-2 h-4 w-4" />
                    Get Recommendations
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Location Maps Grid */}
        <div className="space-y-6">
          {location && <LocationMaps lat={location.lat} lon={location.lon} />}

          {/* Current Conditions */}
          <Card className="border-0 shadow-card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Thermometer className="h-5 w-5" />
                <span>Real-Time IoT Sensor Data (Simulated)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {weatherLoading ? (
                <div className="flex items-center justify-center h-24">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : weatherError || !weatherData ? (
                <p className="text-sm text-destructive">{weatherError || "Could not load weather."}</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Thermometer className="h-4 w-4 text-warning" />
                      <span className="text-sm font-medium">Temperature</span>
                    </div>
                    <p className="text-2xl font-bold">{iotData ? iotData.temperature_2m : Math.round(weatherData.main.temp)}°C</p>
                    <p className="text-xs text-muted-foreground">{weatherData.weather[0].main}</p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Droplets className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Humidity</span>
                    </div>
                    <p className="text-2xl font-bold">{iotData ? iotData.relative_humidity_2m : weatherData.main.humidity}%</p>
                    <p className="text-xs text-muted-foreground">Air moisture level</p>
                  </div>
                </div>
              )}

              {/* IoT Soil Data */}
              {iotData && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-amber-50/50 rounded-lg border border-amber-100">
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-900">Soil Temp (0cm)</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-700">{iotData.soil_temperature_0cm}°C</p>
                    <p className="text-xs text-amber-600/80">Surface temp</p>
                  </div>

                  <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                    <div className="flex items-center space-x-2 mb-2">
                      <Droplets className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Soil Moisture</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">{iotData.soil_moisture_0_to_7cm} m³/m³</p>
                    <p className="text-xs text-blue-600/80">0-7cm depth</p>
                  </div>
                </div>
              )}

              <div className="p-4 bg-gradient-to-r from-success/10 to-primary/10 rounded-lg border border-success/20">
                <h4 className="font-medium text-success mb-2">Soil Health Status</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Nitrogen</span>
                    <Badge variant="secondary">{soilNutrients?.nitrogen || 'Good'}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Phosphorus</span>
                    <Badge variant="secondary">{soilNutrients?.phosphorus || 'Medium'}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Potassium</span>
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

      </div>

      {/* AI Recommendations */}

      {recommendations.length > 0 && (
        <div className="space-y-6">
          {/* Header with AI Badge */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold flex items-center">
                <Brain className="mr-2 h-5 w-5 text-primary" />
                AI-Powered Crop Recommendations
              </h2>
              <p className="text-sm text-muted-foreground">
                Personalized recommendations based on your farm conditions
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSubmit}
                disabled={loading}
                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800"
              >
                <Target className="mr-2 h-4 w-4" />
                Get New Mix
              </Button>
            </div>
          </div>


          {/* 6 Crop Recommendations */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((rec, index) => {
              return (
                <Card key={index} className="border-2 border-gray-200 bg-white shadow-card-shadow hover:shadow-hover-lift hover:bg-gray-50 transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        <span className="font-semibold">{rec.cropName}</span>
                      </CardTitle>
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

                    <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-blue-700 font-medium flex items-center">
                          <TrendingUp className="w-3 h-3 mr-1" /> Market Price
                        </p>
                        <span className="text-sm font-bold text-blue-900">{rec.marketPrice}</span>
                      </div>
                      {rec.priceTrend && (
                        <div className="text-xs text-blue-600 border-t border-blue-200 pt-1 mt-1">
                          Trend: {rec.priceTrend}
                        </div>
                      )}
                    </div>

                    {/* Enhanced Profit Information */}
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

                    <div>
                      <p className="text-sm font-semibold mb-2 text-gray-800">Why this crop?</p>
                      <ul className="space-y-2">
                        {rec.reasons.map((reason: string, idx: number) => (
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
      )
      }
    </div >
  );
};

export default CropRecommendation;