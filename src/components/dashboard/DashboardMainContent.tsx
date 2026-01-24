import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWeather } from "@/components/dashboard/WeatherContext";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CloudRain,
  TrendingUp,
  IndianRupee,
  FileText,
  ThermometerSun,
  Leaf,
  AlertTriangle,
  Bell,
  ArrowUp,
  ArrowDown,
  Wheat,
  Sprout,
  Tractor,
  Droplets,
  BarChart as BarChartIcon
} from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useAuth } from "@/context/AuthContext";

interface DashboardMainContentProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
}

const DashboardMainContent = ({ activeModule, setActiveModule }: DashboardMainContentProps) => {
  const { weatherData, loading: weatherLoading, error: weatherError } = useWeather();
  const { user } = useAuth();

  // Helper to get last 6 months labels
  const getLast6MonthsLabels = () => {
    const months = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push(d.toLocaleString('default', { month: 'short' }));
    }
    return months;
  };

  // State for chart data
  const [priceData, setPriceData] = useState(() => {
    const months = getLast6MonthsLabels();
    // Default simulated data relative to current months
    return months.map(month => ({
      month,
      wheat: Math.floor(Math.random() * (2600 - 2200) + 2200),
      rice: Math.floor(Math.random() * (3400 - 3100) + 3100),
      tomato: Math.floor(Math.random() * (3000 - 2000) + 2000)
    }));
  });
  const [loadingPrices, setLoadingPrices] = useState(true);

  // Fetch live market prices
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch('/api/market-prices/history');
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            // Check if data has months matching our dynamic needs, otherwise we keep our simulated data
            // Or assume backend sends correct recent history. 
            // We'll trust backend if it returns data.
            setPriceData(data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch price history", error);
      } finally {
        setLoadingPrices(false);
      }
    };

    if (activeModule === "home") {
      fetchPrices();
    }
  }, [activeModule]);

  const [profitData, setProfitData] = useState([
    { crop: 'Wheat', profit: 45000, loss: 15000 },
    { crop: 'Rice', profit: 52000, loss: 8000 },
    { crop: 'Tomato', profit: 38000, loss: 22000 },
    { crop: 'Cotton', profit: 41000, loss: 19000 },
  ]);

  // Fetch live profit predictions for the chart
  useEffect(() => {
    const fetchProfits = async () => {
      const crops = [
        { name: 'Wheat', defaultLoss: 15000, defaultProfit: 45000 },
        { name: 'Rice', defaultLoss: 8000, defaultProfit: 52000 },
        { name: 'Tomato', defaultLoss: 22000, defaultProfit: 38000 },
        { name: 'Cotton', defaultLoss: 19000, defaultProfit: 41000 }
      ];

      try {
        const promises = crops.map(async (item) => {
          try {
            // Using default parameters for general prediction
            const res = await fetch('/api/profit/predict', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                crop_name: item.name,
                area_ha: 1,
                // Optional: add a typical district if known, otherwise leave blank for general
              })
            });

            if (res.ok) {
              const data = await res.json();
              return {
                crop: item.name,
                profit: Math.round(data.profit),
                loss: Math.round(data.investment) // Mapping Investment to "Loss" (Cost)
              };
            }
          } catch (e) {
            console.warn(`Failed to fetch profit for ${item.name}`, e);
          }
          // Fallback
          return { crop: item.name, profit: item.defaultProfit, loss: item.defaultLoss };
        });

        const results = await Promise.all(promises);
        setProfitData(results);
      } catch (error) {
        console.error("Failed to fetch profit data", error);
      }
    };

    if (activeModule === "home") {
      fetchProfits();
    }
  }, [activeModule]);

  if (activeModule !== "home") {
    return (
      <div className="p-6 lg:pl-0">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-muted-foreground">
            {activeModule.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </h2>
          <p className="text-muted-foreground mt-2">Content for this module is coming soon...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Welcome Section */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {`Welcome back, ${user?.username || "Farmer"}! 🌱`}
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening on your farm today
        </p>
      </div>

      {/* Quick Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Weather Card */}
        <Card
          className="border-0 shadow-card-shadow hover:shadow-hover-lift transition-all duration-300 cursor-pointer"
          onClick={() => setActiveModule("market-supply-tracker")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-primary-glow">
                <CloudRain className="h-6 w-6 text-primary-foreground" />
              </div>
              <Badge variant="outline" className="text-xs">Live</Badge>
            </div>
            {weatherLoading ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : weatherError || !weatherData ? (
              <p className="text-sm text-destructive">{weatherError || "Could not load weather."}</p>
            ) : (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Weather & Alerts</p>
                <p className="text-2xl font-bold">{Math.round(weatherData.main.temp)}°C</p>
                <p className="text-sm text-muted-foreground">{weatherData.weather[0].description.replace(/\b\w/g, (l: string) => l.toUpperCase())}</p>
                <p className="text-xs text-success flex items-center">
                  <Droplets className="h-3 w-3 mr-1" />
                  Humidity: {weatherData.main.humidity}%
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profit Prediction Card */}
        <Card
          className="border-0 shadow-card-shadow hover:shadow-hover-lift transition-all duration-300 cursor-pointer"
          onClick={() => setActiveModule("crop-profit-predictor")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-r from-success to-accent">
                <TrendingUp className="h-6 w-6 text-success-foreground" />
              </div>
              <Badge variant="outline" className="text-xs">AI</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Crop Profit Prediction</p>
              <p className="text-2xl font-bold text-success">+₹45,000</p>
              <p className="text-sm text-muted-foreground">This Season</p>
              <p className="text-xs text-success flex items-center">
                <ArrowUp className="h-3 w-3 mr-1" />
                +12% vs last season
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Market Price Card */}
        <Card
          className="border-0 shadow-card-shadow hover:shadow-hover-lift transition-all duration-300 cursor-pointer"
          onClick={() => setActiveModule("marketplace")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-r from-warning to-accent">
                <IndianRupee className="h-6 w-6 text-warning-foreground" />
              </div>
              <Badge variant="outline" className="text-xs">Market</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Market Price Trends</p>
              <p className="text-2xl font-bold">₹2,500/Q</p>
              <p className="text-sm text-muted-foreground">Wheat (Avg)</p>
              <p className="text-xs text-success flex items-center">
                <ArrowUp className="h-3 w-3 mr-1" />
                +8% this week
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Active Subsidies Card */}
        <Card
          className="border-0 shadow-card-shadow hover:shadow-hover-lift transition-all duration-300 cursor-pointer"
          onClick={() => setActiveModule("government-schemes")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-accent">
                <FileText className="h-6 w-6 text-primary-foreground" />
              </div>
              <Badge className="text-xs bg-success">Active</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Active Subsidies</p>
              <p className="text-2xl font-bold">3</p>
              <p className="text-sm text-muted-foreground">Available Now</p>
              <p className="text-xs text-primary">PM-KISAN + 2 more</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Market Price Trends */}
        <Card
          className="border-0 shadow-card-shadow cursor-pointer hover:shadow-hover-lift transition-all duration-300"
          onClick={() => setActiveModule("marketplace")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Market Price Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 lg:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="wheat"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="Wheat (₹/Q)"
                  />
                  <Line
                    type="monotone"
                    dataKey="rice"
                    stroke="hsl(var(--success))"
                    strokeWidth={2}
                    name="Rice (₹/Q)"
                  />
                  <Line
                    type="monotone"
                    dataKey="tomato"
                    stroke="hsl(var(--warning))"
                    strokeWidth={2}
                    name="Tomato (₹/Q)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Profit vs Loss Predictions */}
        <Card
          className="border-0 shadow-card-shadow cursor-pointer hover:shadow-hover-lift transition-all duration-300"
          onClick={() => setActiveModule("crop-profit-predictor")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChartIcon className="h-5 w-5 text-primary" />
              Profit vs Loss Predictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 lg:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={profitData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="crop" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar
                    dataKey="profit"
                    fill="hsl(var(--success))"
                    name="Profit (₹)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="loss"
                    fill="hsl(var(--destructive))"
                    name="Loss (₹)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations and Notifications */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* AI Recommendations */}
        <Card className="border-0 shadow-card-shadow bg-gradient-to-br from-primary/5 to-success/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Sprout className="h-5 w-5" />
              Best Crops to Plant This Season
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div
                className="text-center p-3 bg-card/50 rounded-lg border border-primary/20 cursor-pointer hover:bg-primary/10 transition-all duration-200"
                onClick={() => setActiveModule("crop-profit-predictor")}
              >
                <Wheat className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="font-medium text-sm">Wheat</p>
                <p className="text-xs text-success">92% profit</p>
              </div>
              <div
                className="text-center p-3 bg-card/50 rounded-lg border border-success/20 cursor-pointer hover:bg-success/10 transition-all duration-200"
                onClick={() => setActiveModule("crop-profit-predictor")}
              >
                <Sprout className="h-8 w-8 text-success mx-auto mb-2" />
                <p className="font-medium text-sm">Maize</p>
                <p className="text-xs text-success">87% profit</p>
              </div>
              <div
                className="text-center p-3 bg-card/50 rounded-lg border border-accent/20 cursor-pointer hover:bg-accent/10 transition-all duration-200"
                onClick={() => setActiveModule("crop-profit-predictor")}
              >
                <Leaf className="h-8 w-8 text-accent mx-auto mb-2" />
                <p className="font-medium text-sm">Mustard</p>
                <p className="text-xs text-success">81% profit</p>
              </div>
            </div>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => setActiveModule("crop-profit-predictor")}
            >
              Get Detailed Recommendations
            </Button>
          </CardContent>
        </Card>

        {/* Notifications Panel */}
        <Card className="border-0 shadow-card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications & Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert
              className="border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-all duration-200"
              onClick={() => setActiveModule("market-supply-tracker")}
            >
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                <strong>Weather Alert:</strong> Heavy rain expected in next 48 hours. Secure your crops.
              </AlertDescription>
            </Alert>

            <Alert
              className="border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200"
              onClick={() => setActiveModule("government-schemes")}
            >
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                <strong>Subsidy Expiring:</strong> PM Fasal Bima Yojana registration ends in 5 days.
              </AlertDescription>
            </Alert>

            <Alert
              className="border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-800 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-all duration-200"
              onClick={() => setActiveModule("marketplace")}
            >
              <Bell className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                <strong>Market Update:</strong> Wheat prices increased by 8% in local mandis.
              </AlertDescription>
            </Alert>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setActiveModule("market-supply-tracker")}
            >
              View All Notifications
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardMainContent;