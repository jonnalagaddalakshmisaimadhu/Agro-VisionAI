import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, TrendingUp, DollarSign, Zap, Plus, X, Layers, Percent, Scale } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const CATEGORIES = [
  "All",
  "Vegetables",
  "Fruits",
  "Grains & Millets",
  "Pulses & Legumes",
  "Oilseeds & Spices",
  "Cash & Plantation"
];

const CROP_CATALOG: Record<string, string[]> = {
  "Vegetables": ["Tomato", "Potato", "Onion", "Garlic", "Ginger", "Green Chilli", "Capsicum", "Brinjal", "Okra", "Cabbage", "Cauliflower", "Carrot", "Spinach", "Cucumber", "Bitter Gourd", "Green Peas"],
  "Fruits": ["Mango", "Banana", "Papaya", "Watermelon", "Muskmelon", "Pomegranate", "Guava", "Grapes", "Orange", "Lemon", "Dragon Fruit", "Pineapple", "Coconut", "Apple", "Strawberry"],
  "Grains & Millets": ["Rice", "Wheat", "Maize", "Bajra", "Jowar", "Ragi", "Barley"],
  "Pulses & Legumes": ["Chickpea", "Pigeon Pea", "Green Gram", "Black Gram", "Soybean", "Lentil"],
  "Oilseeds & Spices": ["Mustard", "Groundnut", "Sunflower", "Turmeric", "Cumin", "Coriander"],
  "Cash & Plantation": ["Cotton", "Sugarcane", "Coffee", "Tea", "Tobacco", "Jute"]
};

const ProfitPredictor = () => {
  const [formData, setFormData] = useState({
    district: '',
    area_ha: '',
    season: 'Kharif',
    lat: '',
    lon: '',
    budget: '',
    desired_crops: [] as string[]
  });

  const [activeCategory, setActiveCategory] = useState("All");
  const [customCrop, setCustomCrop] = useState("");
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(false);

  const seasons = ['Kharif', 'Rabi', 'Summer'];

  const availableCrops = activeCategory === "All"
    ? Object.values(CROP_CATALOG).flat()
    : (CROP_CATALOG[activeCategory] || []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCropToggle = (crop: string) => {
    setFormData(prev => ({
      ...prev,
      desired_crops: prev.desired_crops.includes(crop)
        ? prev.desired_crops.filter(c => c !== crop)
        : [...prev.desired_crops, crop]
    }));
  };

  const handleAddCustomCrop = () => {
    const trimmed = customCrop.trim();
    if (trimmed && !formData.desired_crops.includes(trimmed)) {
      setFormData(prev => ({
        ...prev,
        desired_crops: [...prev.desired_crops, trimmed]
      }));
      setCustomCrop("");
    }
  };

  const handleGetRecommendations = async () => {
    setError('');
    setLoading(true);

    if (!formData.district || !formData.area_ha || !formData.season) {
      setError('Please fill in district, area, and season');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        district: formData.district,
        area_ha: parseFloat(formData.area_ha),
        season: formData.season,
        lat: formData.lat ? parseFloat(formData.lat) : null,
        lon: formData.lon ? parseFloat(formData.lon) : null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        desired_crops: formData.desired_crops.length > 0 ? formData.desired_crops : null
      };

      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
      setShowResults(true);
    } catch (err: any) {
      setError(`Failed to fetch recommendations: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getProfitColor = (profit_per_ha: number) => {
    if (profit_per_ha >= 100000) return 'bg-green-100 text-green-800';
    if (profit_per_ha >= 40000) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getProfitIcon = (profitability: string) => {
    return profitability === 'High Profit' ? '🟢' : profitability === 'Medium Profit' ? '🟡' : '🔴';
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      {/* Form Section */}
      <Card className="bg-white shadow-lg border border-gray-200">
        <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-700 text-white rounded-t-xl">
          <div className="flex items-center gap-2">
            <CardTitle className="text-2xl font-bold">Universal Crop Profit Predictor</CardTitle>
            <Badge className="bg-amber-400 text-amber-950 font-bold text-xs">All Vegetables & Fruits</Badge>
          </div>
          <p className="text-sm mt-1 opacity-90">AI-powered profit forecast with live Mandi prices, break-even analysis & 3-scenario risk matrix</p>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                District / Region *
              </label>
              <input
                type="text"
                name="district"
                value={formData.district}
                onChange={handleInputChange}
                placeholder="e.g., Pune, Nashik, Ludhiana"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Farm Area (Hectares) *
              </label>
              <input
                type="number"
                name="area_ha"
                value={formData.area_ha}
                onChange={handleInputChange}
                placeholder="e.g., 2.5"
                step="0.1"
                min="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Season *
              </label>
              <select
                name="season"
                value={formData.season}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              >
                {seasons.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
              Select Crop Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                    activeCategory === cat
                      ? "bg-emerald-700 text-white border-emerald-800 font-semibold"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Desired Crops Selection */}
          <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-semibold text-gray-700">
                Filter / Target Crops ({formData.desired_crops.length} selected):
              </label>
              {formData.desired_crops.length > 0 && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, desired_crops: [] }))}
                  className="text-xs text-red-600 hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            {formData.desired_crops.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-lg border border-emerald-200">
                {formData.desired_crops.map(crop => (
                  <Badge key={crop} className="bg-emerald-100 text-emerald-900 border-emerald-300 flex items-center gap-1">
                    {crop}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => handleCropToggle(crop)} />
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {availableCrops.slice(0, 20).map(crop => {
                const isSelected = formData.desired_crops.includes(crop);
                return (
                  <button
                    key={crop}
                    type="button"
                    onClick={() => handleCropToggle(crop)}
                    className={`px-3 py-1 text-xs rounded-full border transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-700 font-medium'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-500'
                    }`}
                  >
                    {isSelected ? `✓ ${crop}` : `+ ${crop}`}
                  </button>
                );
              })}
            </div>

            {/* Custom write-in */}
            <div className="flex gap-2 pt-1">
              <Input
                placeholder="Type ANY custom fruit, vegetable, or crop (e.g. Dragon Fruit, Passion Fruit, Chia)..."
                value={customCrop}
                onChange={(e) => setCustomCrop(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomCrop(); } }}
                className="bg-white text-xs"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddCustomCrop}
                className="border-emerald-600 text-emerald-800 text-xs shrink-0"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Custom
              </Button>
            </div>
          </div>

          <Button
            onClick={handleGetRecommendations}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Analyzing Live Market Prices & Risk Scenarios...</span>
              </>
            ) : (
              <>
                <TrendingUp className="w-5 h-5" />
                <span>Calculate High-Profit Crop Recommendations</span>
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Section */}
      {showResults && recommendations.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Zap className="h-6 w-6 text-amber-500" />
              Profit & Market Forecast Results ({recommendations.length} Varieties)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((rec, index) => (
              <Card key={index} className="bg-white border-2 border-emerald-100 hover:border-emerald-400 hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-emerald-50/50 pb-3 border-b border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-bold text-gray-900">{rec.crop}</CardTitle>
                      {rec.category && (
                        <span className="text-xs text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-medium mt-1 inline-block">
                          {rec.category}
                        </span>
                      )}
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${getProfitColor(rec.profit_per_ha)}`}>
                      {getProfitIcon(rec.profitability)} {rec.profitability}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                  {/* Profit Banner */}
                  <div className="p-3 bg-emerald-600 rounded-xl text-white shadow-sm flex justify-between items-end">
                    <div>
                      <p className="text-xs text-emerald-100 font-medium">Estimated Net Profit</p>
                      <p className="text-2xl font-black">₹{Math.round(rec.profit).toLocaleString()}</p>
                      <p className="text-xs text-emerald-100 mt-0.5">₹{Math.round(rec.profit_per_ha).toLocaleString()} / ha</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-md inline-flex items-center gap-0.5">
                        <Percent className="h-3 w-3" /> ROI: {rec.roi_percent || 140}%
                      </span>
                    </div>
                  </div>

                  {/* Production Metrics */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-gray-500 font-medium">Market Price</p>
                      <p className="font-bold text-blue-700">₹{rec.price_per_kg}/kg</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-gray-500 font-medium">Break-Even Price</p>
                      <p className="font-bold text-amber-800">₹{rec.break_even_price_per_kg || '10.0'}/kg</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-gray-500 font-medium">Expected Yield</p>
                      <p className="font-bold text-gray-900">{rec.yield_t_per_ha} tonnes/ha</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-gray-500 font-medium">Duration</p>
                      <p className="font-bold text-gray-900">{rec.duration_days[0]}-{rec.duration_days[1]} days</p>
                    </div>
                  </div>

                  {/* Financial Total */}
                  <div className="flex justify-between text-xs p-2 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="text-gray-600">Total Investment: <strong>₹{Math.round(rec.investment).toLocaleString()}</strong></span>
                    <span className="text-emerald-700">Revenue: <strong>₹{Math.round(rec.revenue).toLocaleString()}</strong></span>
                  </div>

                  {/* Reasons */}
                  {rec.explanation && rec.explanation.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-600 uppercase">Key Agronomic Reasons:</p>
                      <ul className="space-y-1">
                        {rec.explanation.map((e: string, i: number) => (
                          <li key={i} className="text-xs text-gray-700 flex items-start gap-1">
                            <span className="text-emerald-600">✓</span> {e}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfitPredictor;
