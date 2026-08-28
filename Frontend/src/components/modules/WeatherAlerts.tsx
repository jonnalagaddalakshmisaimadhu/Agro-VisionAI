import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  CloudRain,
  Sun,
  Cloud,
  Thermometer,
  Droplets,
  Wind,
  Eye,
  AlertTriangle,
  Bell,
  MapPin,
  Search,
  Zap
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useWeather } from "@/components/dashboard/WeatherContext";
import LocationMaps from "./LocationMaps";

const WMO_CODES: { [key: number]: { description: string; icon: React.ElementType, emoji: string } } = {
  0: { description: 'Clear sky', icon: Sun, emoji: '☀️' },
  1: { description: 'Mainly clear', icon: Sun, emoji: '☀️' },
  2: { description: 'Partly cloudy', icon: Cloud, emoji: '⛅' },
  3: { description: 'Overcast', icon: Cloud, emoji: '☁️' },
  45: { description: 'Fog', icon: Cloud, emoji: '🌫️' },
  48: { description: 'Depositing rime fog', icon: Cloud, emoji: '🌫️' },
  51: { description: 'Light Drizzle', icon: CloudRain, emoji: '🌦️' },
  53: { description: 'Moderate Drizzle', icon: CloudRain, emoji: '🌦️' },
  55: { description: 'Dense Drizzle', icon: CloudRain, emoji: '🌦️' },
  37: { description: 'Slight Rain', icon: CloudRain, emoji: '🌧️' },
  61: { description: 'Slight Rain', icon: CloudRain, emoji: '🌧️' },
  63: { description: 'Moderate Rain', icon: CloudRain, emoji: '🌧️' },
  65: { description: 'Heavy Rain', icon: CloudRain, emoji: '🌧️' },
  71: { description: 'Slight Snowfall', icon: Cloud, emoji: '🌨️' },
  73: { description: 'Moderate Snowfall', icon: Cloud, emoji: '🌨️' },
  75: { description: 'Heavy Snowfall', icon: Cloud, emoji: '🌨️' },
  80: { description: 'Slight Rain showers', icon: CloudRain, emoji: '🌦️' },
  81: { description: 'Moderate Rain showers', icon: CloudRain, emoji: '🌧️' },
  82: { description: 'Violent Rain showers', icon: CloudRain, emoji: '⛈️' },
  95: { description: 'Thunderstorm', icon: Zap, emoji: '⛈️' },
  96: { description: 'Thunderstorm with slight hail', icon: Zap, emoji: '⛈️' },
  99: { description: 'Thunderstorm with heavy hail', icon: Zap, emoji: '⛈️' },
};

const ALERT_ICONS: { [key: string]: React.ElementType } = {
  CloudRain,
  Sun,
  Thermometer,
  Wind,
  Droplets,
  AlertTriangle
};

const getWeatherInfo = (code: number) => {
  return WMO_CODES[code] || { description: 'Clear sky', icon: Sun, emoji: '☀️' };
};

const WeatherAlerts = () => {
  const [selectedTab, setSelectedTab] = useState("current");
  const [cityInput, setCityInput] = useState("");
  const {
    weatherData,
    forecastData,
    locationName,
    loading,
    error,
    fetchWeatherByCity,
    useCurrentLocation,
    alerts,
    alertSettings,
    setAlertSettings
  } = useWeather();

  const [notificationsEnabled, setNotificationsEnabled] = useState(
    typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted"
  );

  const toggleSetting = (key: keyof typeof alertSettings) => {
    setAlertSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const sendTestNotification = () => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification("🌾 FarmIQ Agro-Weather Alert Active", {
        body: "Real-time weather alerts and crop advisories are now active on your device.",
        icon: "/vite.svg"
      });
    }
  };

  // Request notification permission
  const enableNotifications = () => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notifications");
    } else if (Notification.permission === "granted") {
      setNotificationsEnabled(true);
      sendTestNotification();
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          setNotificationsEnabled(true);
          sendTestNotification();
        }
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "low": return "bg-success/10 text-success border-success/20";
      case "medium": return "bg-warning/10 text-warning border-warning/20";
      case "high": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-muted";
    }
  };

  const handleSearch = () => {
    if (cityInput.trim()) {
      fetchWeatherByCity(cityInput);
    }
  };

  // Trigger browser notifications for high severity alerts
  useEffect(() => {
    if (notificationsEnabled && alerts.length > 0) {
      alerts.forEach(alert => {
        if (alert.severity === "High" && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          new Notification(`⚠️ FarmIQ: ${alert.title}`, {
            body: alert.message,
            icon: '/vite.svg'
          });
        }
      });
    }
  }, [alerts, notificationsEnabled]);


  const { currentWeather, weeklyForecast, temperatureData } = useMemo(() => {
    if (!weatherData || !forecastData) {
      return { currentWeather: null, weeklyForecast: [], temperatureData: [] };
    }

    const current = {
      temperature: Math.round(weatherData.main.temp),
      condition: weatherData.weather[0].description.replace(/\b\w/g, (l: string) => l.toUpperCase()),
      humidity: weatherData.main.humidity,
      windSpeed: weatherData.wind.speed,
      visibility: weatherData.visibility / 1000, // meters to km
      uvIndex: forecastData.daily.uv_index_max[0], // Modified to index 0 for today
      feelsLike: Math.round(weatherData.main.feels_like),
      icon: getWeatherInfo(forecastData.current.weather_code).icon,
    };

    const forecast = forecastData.daily.time.slice(0, 7).map((date: string, i: number) => ({
      day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      high: Math.round(forecastData.daily.temperature_2m_max[i]),
      low: Math.round(forecastData.daily.temperature_2m_min[i]),
      condition: getWeatherInfo(forecastData.daily.weather_code[i]).description,
      rain: forecastData.daily.precipitation_probability_max[i],
      icon: getWeatherInfo(forecastData.daily.weather_code[i]).emoji,
    }));

    const temp = forecastData.hourly.time.slice(0, 24).map((time: string, i: number) => ({
      time: new Date(time).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
      temp: Math.round(forecastData.hourly.temperature_2m[i]),
    })).filter((_: any, i: number) => i % 3 === 0);

    return { currentWeather: current, weeklyForecast: forecast, temperatureData: temp };
  }, [weatherData, forecastData]);

  if (loading) {
    return <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin" /> <span className="ml-2">Loading Weather Data...</span></div>;
  }

  return (
    <div className="p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-5 rounded-xl border border-border shadow-xs">
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          <div className="p-2 sm:p-2.5 bg-gradient-to-r from-primary to-accent rounded-lg text-white shadow-xs shrink-0">
            <CloudRain className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-bold text-foreground tracking-tight leading-tight">Weather & Alerts</h1>
            <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-1 sm:line-clamp-none">Stay informed with real-time weather updates and precision agricultural advisories</p>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="py-2.5">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-xs">Error Fetching Weather</AlertTitle>
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {/* Location Search Bar */}
      <Card className="border border-border/80 shadow-xs rounded-xl bg-card">
        <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row gap-2 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search city / district name..."
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9 h-8 sm:h-9 text-xs sm:text-sm bg-background"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button size="sm" className="h-8 sm:h-9 px-3 text-xs flex-1 sm:flex-none" onClick={handleSearch}>Search</Button>
            <Button size="sm" variant="outline" className="h-8 sm:h-9 px-3 text-xs flex-1 sm:flex-none" onClick={useCurrentLocation}>
              <MapPin className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">Use </span>GPS
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs - 4 Equal Columns on Mobile */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4 sm:space-y-6">
        <div className="flex justify-center w-full mb-3 sm:mb-5">
          <TabsList className="bg-slate-200/80 p-1 rounded-xl shadow-xs grid grid-cols-4 w-full sm:w-auto sm:inline-flex max-w-2xl h-auto gap-0.5 sm:gap-1">
            <TabsTrigger value="current" className="rounded-lg font-medium py-1.5 px-1 sm:px-4 text-[11px] sm:text-sm data-[state=active]:bg-white data-[state=active]:text-primary truncate">Current</TabsTrigger>
            <TabsTrigger value="forecast" className="rounded-lg font-medium py-1.5 px-1 sm:px-4 text-[11px] sm:text-sm data-[state=active]:bg-white data-[state=active]:text-primary truncate">Forecast</TabsTrigger>
            <TabsTrigger value="alerts" className="rounded-lg font-medium py-1.5 px-1 sm:px-4 text-[11px] sm:text-sm data-[state=active]:bg-white data-[state=active]:text-primary truncate">Alerts</TabsTrigger>
            <TabsTrigger value="radar" className="rounded-lg font-medium py-1.5 px-1 sm:px-4 text-[11px] sm:text-sm data-[state=active]:bg-white data-[state=active]:text-primary truncate">Radar</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="current" className="space-y-6">
          {currentWeather && (
            <>
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-card-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Current Weather</CardTitle>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{locationName}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <currentWeather.icon className="h-8 w-8 text-primary" />
                        <div>
                          <p className="text-4xl font-bold">{currentWeather.temperature}°C</p>
                          <p className="text-muted-foreground">{currentWeather.condition}</p>
                          <p className="text-sm text-muted-foreground">Feels like {currentWeather.feelsLike}°C</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                        <Droplets className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Humidity</p>
                          <p className="font-semibold">{currentWeather.humidity}%</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                        <Wind className="h-5 w-5 text-accent" />
                        <div>
                          <p className="text-sm text-muted-foreground">Wind Speed</p>
                          <p className="font-semibold">{currentWeather.windSpeed} km/h</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                        <Eye className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Visibility</p>
                          <p className="font-semibold">{currentWeather.visibility} km</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                        <Sun className="h-5 w-5 text-warning" />
                        <div>
                          <p className="text-sm text-muted-foreground">UV Index</p>
                          <p className="font-semibold">{currentWeather.uvIndex}/10</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-card-shadow">
                  <CardHeader>
                    <CardTitle>Today's Temperature</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={temperatureData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="temp"
                          stroke="hsl(var(--primary))"
                          strokeWidth={3}
                          dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-0 shadow-card-shadow">
                <CardHeader>
                  <CardTitle>Farming Conditions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-success/10 rounded-lg border border-success/20">
                      <div className="text-2xl mb-2">🌱</div>
                      <h4 className="font-medium text-success mb-1">Excellent for Planting</h4>
                      <p className="text-xs text-muted-foreground">Soil moisture and temperature are ideal</p>
                    </div>

                    <div className="text-center p-4 bg-warning/10 rounded-lg border border-warning/20">
                      <div className="text-2xl mb-2">💧</div>
                      <h4 className="font-medium text-warning mb-1">Moderate for Irrigation</h4>
                      <p className="text-xs text-muted-foreground">Consider reducing water due to humidity</p>
                    </div>

                    <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <div className="text-2xl mb-2">🚜</div>
                      <h4 className="font-medium text-primary mb-1">Good for Field Work</h4>
                      <p className="text-xs text-muted-foreground">Weather suitable for machinery operation</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="forecast" className="space-y-6">
          <Card className="border-0 shadow-card-shadow">
            <CardHeader>
              <CardTitle>7-Day Weather Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weeklyForecast && weeklyForecast.map((day, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">{day.icon}</div>
                      <div>
                        <p className="font-medium">{day.day}</p>
                        <p className="text-sm text-muted-foreground">{day.condition}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">High/Low</p>
                        <p className="font-semibold">{day.high}°/{day.low}°</p>
                      </div>

                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Rain</p>
                        <div className="flex items-center space-x-2">
                          <Progress value={day.rain} className="w-16 h-2" />
                          <span className="text-sm font-medium">{day.rain}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-card-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5" />
                    <span>Active Alerts</span>
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={enableNotifications} disabled={notificationsEnabled}>
                    {notificationsEnabled ? "Notifications On" : "Enable Notifications"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {alerts.length > 0 ? (
                  alerts.map((alert, index) => {
                    const Icon = ALERT_ICONS[alert.iconName];
                    return (
                      <div key={index} className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                        <div className="flex items-start space-x-3">
                          <Icon className="h-5 w-5 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-medium">{alert.title}</h4>
                              <Badge className={getSeverityColor(alert.severity)}>
                                {alert.severity}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                            <p className="text-xs text-muted-foreground">{alert.time}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 rounded-lg border bg-muted/20 text-center text-muted-foreground">
                    No active alerts at this time.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-card-shadow">
              <CardHeader>
                <CardTitle>Alert Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Rain Alerts</p>
                      <p className="text-sm text-muted-foreground">Get notified about rainfall predictions</p>
                    </div>
                    <Button
                      size="sm"
                      variant={alertSettings.rain ? "outline" : "secondary"}
                      onClick={() => toggleSetting('rain')}
                    >
                      {alertSettings.rain ? "Enabled" : "Disabled"}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Temperature Warnings</p>
                      <p className="text-sm text-muted-foreground">Alerts for extreme temperatures</p>
                    </div>
                    <Button
                      size="sm"
                      variant={alertSettings.temp ? "outline" : "secondary"}
                      onClick={() => toggleSetting('temp')}
                    >
                      {alertSettings.temp ? "Enabled" : "Disabled"}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Frost Alerts</p>
                      <p className="text-sm text-muted-foreground">Early warning for frost conditions</p>
                    </div>
                    <Button
                      size="sm"
                      variant={alertSettings.frost ? "outline" : "secondary"}
                      onClick={() => toggleSetting('frost')}
                    >
                      {alertSettings.frost ? "Enabled" : "Disabled"}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Wind Speed Alerts</p>
                      <p className="text-sm text-muted-foreground">High wind speed notifications</p>
                    </div>
                    <Button
                      size="sm"
                      variant={alertSettings.wind ? "outline" : "secondary"}
                      onClick={() => toggleSetting('wind')}
                    >
                      {alertSettings.wind ? "Enabled" : "Disabled"}
                    </Button>
                  </div>
                </div>

                <Button className="w-full">
                  <Bell className="mr-2 h-4 w-4" />
                  Customize Alerts
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="radar" className="space-y-6">
          <Card className="border-0 shadow-card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <span className="text-xl">🛰️</span>
                  <span>Interactive High-Resolution Satellite & Live Weather Radar</span>
                </span>
                <Badge variant="outline" className="border-emerald-500 text-emerald-600 bg-emerald-50 font-normal text-xs">
                  Live Farm Telemetry
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LocationMaps
                lat={location?.lat}
                lon={location?.lon}
                locationName={locationName}
                height="540px"
              />
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default WeatherAlerts;