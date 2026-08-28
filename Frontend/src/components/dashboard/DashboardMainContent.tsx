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
    <div className="p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-0.5">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground flex items-center gap-1.5">
            <span>{`Welcome, ${user?.username || "Farmer"}!`}</span>
            <span className="text-xl sm:text-2xl">🌱</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Real-time farm insights & agricultural decision support
          </p>
        </div>
      </div>

      {/* Quick Insights 2x2 Grid on Mobile, 4x1 on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Weather Card */}
        <Card
          className="border border-border/70 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden rounded-xl bg-card"
          onClick={() => setActiveModule("market-supply-tracker")}
        >
          <CardContent className="p-3 sm:p-4 md:p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CloudRain className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0 h-4 sm:h-5 font-normal">Live</Badge>
            </div>
            {weatherLoading ? (
              <div className="flex items-center justify-center h-14 sm:h-16">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            ) : weatherError || !weatherData ? (
              <p className="text-xs text-destructive">{weatherError || "Unavailable"}</p>
            ) : (
              <div className="space-y-0.5">
                <p className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">Weather & Alerts</p>
                <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground">{Math.round(weatherData.main.temp)}°C</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{weatherData.weather[0].description.replace(/\b\w/g, (l: string) => l.toUpperCase())}</p>
                <p className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 flex items-center font-medium pt-0.5">
                  <Droplets className="h-3 w-3 mr-1 shrink-0" />
                  {weatherData.main.humidity}% Humidity
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profit Prediction Card */}
        <Card
          className="border border-border/70 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden rounded-xl bg-card"
          onClick={() => setActiveModule("crop-profit-predictor")}
        >
          <CardContent className="p-3 sm:p-4 md:p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0 h-4 sm:h-5 font-normal">AI</Badge>
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">Profit Predict</p>
              <p className="text-base sm:text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">+₹45,000</p>
              <p className="text-[11px] sm:text-xs text-muted-foreground truncate">Wheat / Season</p>
              <p className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 flex items-center font-medium pt-0.5">
                <ArrowUp className="h-3 w-3 mr-0.5 shrink-0" />
                +12% Yield
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Market Price Card */}
        <Card
          className="border border-border/70 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden rounded-xl bg-card"
          onClick={() => setActiveModule("marketplace")}
        >
          <CardContent className="p-3 sm:p-4 md:p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 sm:p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0 h-4 sm:h-5 font-normal">Mandi</Badge>
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">Price Trends</p>
              <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground">₹2,500/Q</p>
              <p className="text-[11px] sm:text-xs text-muted-foreground truncate">Wheat APMC</p>
              <p className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 flex items-center font-medium pt-0.5">
                <ArrowUp className="h-3 w-3 mr-0.5 shrink-0" />
                +8% This Wk
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Active Subsidies Card */}
        <Card
          className="border border-border/70 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden rounded-xl bg-card"
          onClick={() => setActiveModule("government-schemes")}
        >
          <CardContent className="p-3 sm:p-4 md:p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 sm:p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <Badge className="text-[10px] sm:text-xs px-1.5 py-0 h-4 sm:h-5 bg-purple-600 text-white font-normal">Active</Badge>
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">Govt Subsidies</p>
              <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground">14 Schemes</p>
              <p className="text-[11px] sm:text-xs text-muted-foreground truncate">PM-KISAN, PMFBY</p>
              <p className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-400 flex items-center font-medium pt-0.5">
                Apply Online
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Market Price Trends */}
        <Card
          className="border border-border/70 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer rounded-xl bg-card"
          onClick={() => setActiveModule("marketplace")}
        >
          <CardHeader className="p-3.5 sm:p-5 pb-2">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Market Price Trends
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 sm:p-5 pt-0">
            <div className="h-44 sm:h-56 md:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                  <XAxis dataKey="month" className="text-muted-foreground text-xs" />
                  <YAxis className="text-muted-foreground text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
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
          className="border border-border/70 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer rounded-xl bg-card"
          onClick={() => setActiveModule("crop-profit-predictor")}
        >
          <CardHeader className="p-3.5 sm:p-5 pb-2">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <BarChartIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Profit vs Loss Predictions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 sm:p-5 pt-0">
            <div className="h-44 sm:h-56 md:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={profitData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                  <XAxis dataKey="crop" className="text-muted-foreground text-xs" />
                  <YAxis className="text-muted-foreground text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* AI Recommendations */}
        <Card className="border border-border/70 shadow-sm bg-gradient-to-br from-primary/5 to-success/5 rounded-xl">
          <CardHeader className="p-3.5 sm:p-5 pb-2">
            <CardTitle className="flex items-center gap-2 text-primary text-base sm:text-lg">
              <Sprout className="h-4 w-4 sm:h-5 sm:w-5" />
              Best Crops to Plant This Season
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 sm:p-5 pt-2 space-y-3">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div
                className="text-center p-2 sm:p-3 bg-card/70 rounded-lg border border-primary/20 cursor-pointer hover:bg-primary/10 transition-all duration-200"
                onClick={() => setActiveModule("crop-profit-predictor")}
              >
                <Wheat className="h-6 w-6 sm:h-7 sm:w-7 text-primary mx-auto mb-1" />
                <p className="font-medium text-xs sm:text-sm truncate">Wheat</p>
                <p className="text-[10px] sm:text-xs text-success font-semibold">92% profit</p>
              </div>
              <div
                className="text-center p-2 sm:p-3 bg-card/70 rounded-lg border border-success/20 cursor-pointer hover:bg-success/10 transition-all duration-200"
                onClick={() => setActiveModule("crop-profit-predictor")}
              >
                <Sprout className="h-6 w-6 sm:h-7 sm:w-7 text-success mx-auto mb-1" />
                <p className="font-medium text-xs sm:text-sm truncate">Maize</p>
                <p className="text-[10px] sm:text-xs text-success font-semibold">87% profit</p>
              </div>
              <div
                className="text-center p-2 sm:p-3 bg-card/70 rounded-lg border border-accent/20 cursor-pointer hover:bg-accent/10 transition-all duration-200"
                onClick={() => setActiveModule("crop-profit-predictor")}
              >
                <Leaf className="h-6 w-6 sm:h-7 sm:w-7 text-accent mx-auto mb-1" />
                <p className="font-medium text-xs sm:text-sm truncate">Mustard</p>
                <p className="text-[10px] sm:text-xs text-success font-semibold">81% profit</p>
              </div>
            </div>
            <Button
              className="w-full text-xs sm:text-sm h-8 sm:h-9"
              variant="outline"
              onClick={() => setActiveModule("crop-profit-predictor")}
            >
              Get Detailed Recommendations
            </Button>
          </CardContent>
        </Card>

        {/* Notifications Panel */}
        <Card className="border border-border/70 shadow-sm rounded-xl">
          <CardHeader className="p-3.5 sm:p-5 pb-2">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Notifications & Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 sm:p-5 pt-2 space-y-2.5">
            <Alert
              className="p-2.5 sm:p-3 border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-all duration-200"
              onClick={() => setActiveModule("market-supply-tracker")}
            >
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200 text-xs sm:text-sm">
                <strong>Weather Alert:</strong> Heavy rain expected in next 48 hours. Secure crops.
              </AlertDescription>
            </Alert>

            <Alert
              className="p-2.5 sm:p-3 border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200"
              onClick={() => setActiveModule("government-schemes")}
            >
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
              <AlertDescription className="text-red-800 dark:text-red-200 text-xs sm:text-sm">
                <strong>Subsidy Expiring:</strong> PM Fasal Bima Yojana registration ends in 5 days.
              </AlertDescription>
            </Alert>

            <Alert
              className="p-2.5 sm:p-3 border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-800 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-all duration-200"
              onClick={() => setActiveModule("marketplace")}
            >
              <Bell className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
              <AlertDescription className="text-green-800 dark:text-green-200 text-xs sm:text-sm">
                <strong>Market Update:</strong> Wheat prices increased by 8% in local mandis.
              </AlertDescription>
            </Alert>

            <Button
              variant="outline"
              className="w-full text-xs sm:text-sm h-8 sm:h-9"
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