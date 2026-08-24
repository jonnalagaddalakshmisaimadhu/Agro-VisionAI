import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, TrendingUp, DollarSign, Zap } from 'lucide-react';

const ProfitPredictor = () => {
  const [formData, setFormData] = useState({
    district: '',
    area_ha: '',
    season: 'Kharif',
    lat: '',
    lon: '',
    budget: '',
    desired_crops: []
  });

  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(false);

  const seasons = ['Kharif', 'Rabi', 'Summer'];
  const allCrops = ['Tomato', 'Potato', 'Wheat', 'Maize', 'Cotton', 'Onion', 'Rice', 'Sugarcane', 'Mustard', 'Bell Pepper'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCropToggle = (crop) => {
    setFormData(prev => ({
      ...prev,
      desired_crops: prev.desired_crops.includes(crop)
        ? prev.desired_crops.filter(c => c !== crop)
        : [...prev.desired_crops, crop]
    }));
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
    } catch (err) {
      setError(`Failed to fetch recommendations: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getProfitColor = (profit_per_ha) => {
    if (profit_per_ha >= 100000) return 'bg-green-100 text-green-800';
    if (profit_per_ha >= 50000) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getProfitIcon = (profitability) => {
    return profitability === 'High Profit' ? '🟢' : profitability === 'Medium Profit' ? '🟡' : '🔴';
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      {/* Form Section */}
      <Card className="bg-white shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white">
          <CardTitle className="text-2xl">Smart Crop Profit Predictor</CardTitle>
          <p className="text-sm mt-2 opacity-90">Get AI-powered crop recommendations with live market price analysis</p>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-100 text-red-800 rounded-lg">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* District Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">District / Region</label>
              <input
                type="text"
                name="district"
                value={formData.district}
                onChange={handleInputChange}
                placeholder="e.g., Anantapur, Hyderabad"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Area Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Farm Area (hectares)</label>
              <input
                type="number"
                name="area_ha"
                value={formData.area_ha}
                onChange={handleInputChange}
                placeholder="0.5"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Season Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Season</label>
              <select
                name="season"
                value={formData.season}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {seasons.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Budget Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Budget (₹) - Optional</label>
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleInputChange}
                placeholder="Optional"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Latitude */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Latitude - Optional</label>
              <input
                type="number"
                name="lat"
                value={formData.lat}
                onChange={handleInputChange}
                placeholder="14.68"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Longitude */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Longitude - Optional</label>
              <input
                type="number"
                name="lon"
                value={formData.lon}
                onChange={handleInputChange}
                placeholder="77.60"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Crop Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Preferred Crops (Optional - leave blank for all)</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {allCrops.map(crop => (
                <button
                  key={crop}
                  onClick={() => handleCropToggle(crop)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    formData.desired_crops.includes(crop)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {crop}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button
              onClick={handleGetRecommendations}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap size={20} />
                  Get Recommendations
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {showResults && recommendations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="text-green-600" />
            Top Recommended Crops
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((rec, idx) => (
              <Card key={idx} className="bg-white shadow-lg hover:shadow-xl transition border-l-4 border-green-600 overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl text-gray-800">{rec.crop}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Duration: {rec.duration_days[0]}-{rec.duration_days[1]} days
                      </p>
                    </div>
                    <span className={`text-lg font-bold px-3 py-1 rounded-full ${getProfitColor(rec.profit_per_ha)}`}>
                      {getProfitIcon(rec.profitability)} {rec.profitability}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600">Expected Yield</p>
                      <p className="text-lg font-bold text-blue-600">{rec.yield_t_per_ha}t/ha</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600">Market Price</p>
                      <p className="text-lg font-bold text-purple-600">₹{rec.price_per_kg}/kg</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600">Investment</p>
                      <p className="text-lg font-bold text-orange-600">₹{(rec.investment / 1000).toFixed(0)}k</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600">Revenue</p>
                      <p className="text-lg font-bold text-green-600">₹{(rec.revenue / 1000).toFixed(0)}k</p>
                    </div>
                  </div>

                  {/* Profit Highlight */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                    <p className="text-xs text-gray-600 mb-1">Estimated Profit</p>
                    <p className="text-2xl font-bold text-green-700">₹{(rec.profit / 1000).toFixed(0)}k</p>
                    <p className="text-sm text-gray-600 mt-1">₹{rec.profit_per_ha.toLocaleString()}/ha</p>
                  </div>

                  {/* Scores */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Suitability</p>
                      <p className="text-lg font-bold text-gray-800">{(rec.soil_match * 100).toFixed(0)}%</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Season Match</p>
                      <p className="text-lg font-bold text-gray-800">{(rec.season_match * 100).toFixed(0)}%</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Risk</p>
                      <p className="text-sm font-bold text-gray-800">{rec.risk}</p>
                    </div>
                  </div>

                  {/* Why This Crop */}
                  <div className="bg-blue-50 p-3 rounded-lg border-l-2 border-blue-400">
                    <p className="text-sm font-semibold text-gray-800 mb-2">Why this crop?</p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {rec.explanation.map((reason, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-green-600 font-bold">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm">
                      View Details
                    </Button>
                    <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm">
                      Plan Cultivation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {showResults && recommendations.length === 0 && !loading && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-6 text-center">
            <AlertCircle className="mx-auto mb-3 text-yellow-600" size={32} />
            <p className="text-gray-700 font-semibold">No recommendations found</p>
            <p className="text-sm text-gray-600 mt-1">Try adjusting your inputs</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfitPredictor;
