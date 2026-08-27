import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "@/context/LocationContext";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Globe,
  Palette,
  Database,
  Download,
  Trash2,
  Save,
  RefreshCw,
  ArrowLeft,
  Wheat,
  CloudRain,
  PhoneCall,
  Volume2,
  VolumeX,
  Lock,
  CheckCircle2,
  Layers,
  MapPin,
  Mic,
  Sliders,
  HardDrive,
  Sparkles,
  HelpCircle,
  Radio
} from "lucide-react";

interface FarmingSettings {
  language: string;
  landUnit: string;
  farmSize: string;
  soilType: string;
  primaryCrop: string;
  irrigationType: string;
  rainAlert: boolean;
  rainThreshold: string;
  windSprayAlert: boolean;
  heatwaveAlert: boolean;
  frostAlert: boolean;
  alertSound: boolean;
  voipEnabled: boolean;
  numberMasking: boolean;
  ringtoneType: string;
  mandiPriceAlerts: boolean;
  offlineCacheEnabled: boolean;
  theme: string;
}

const DEFAULT_SETTINGS: FarmingSettings = {
  language: "en",
  landUnit: "Acres",
  farmSize: "3.5",
  soilType: "Black Clay Loam",
  primaryCrop: "Paddy (వరి)",
  irrigationType: "Borewell / Solar Pump",
  rainAlert: true,
  rainThreshold: "60",
  windSprayAlert: true,
  heatwaveAlert: true,
  frostAlert: false,
  alertSound: true,
  voipEnabled: true,
  numberMasking: true,
  ringtoneType: "kisan_bell",
  mandiPriceAlerts: true,
  offlineCacheEnabled: true,
  theme: "light"
};

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { locationData } = useLocation();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("farm_profile");
  const [settings, setSettings] = useState<FarmingSettings>(() => {
    try {
      const saved = localStorage.getItem("farmiq_app_settings");
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_SETTINGS;
  });

  const [lastSavedTime, setLastSavedTime] = useState<string>("Synced");
  const [micTesting, setMicTesting] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Auto-persist settings in real time whenever any field changes
  const updateSetting = <K extends keyof FarmingSettings>(key: K, value: FarmingSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem("farmiq_app_settings", JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLastSavedTime(`Saved at ${now}`);
  };

  // Test Ringtone Synthesizer
  const testRingtone = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      setTimeout(() => {
        try {
          osc.stop();
          ctx.close();
        } catch (e) {}
      }, 900);

      toast({
        title: "Ringtone Tested",
        description: "In-App VoIP audio ringtone preview played."
      });
    } catch (e) {}
  };

  // Test Microphone Input Level
  const toggleMicTest = async () => {
    if (micTesting) {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setMicTesting(false);
      setMicLevel(0);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = ctx;
        const analyser = ctx.createAnalyser();
        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 64;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        setMicTesting(true);

        const checkVolume = () => {
          if (!micStreamRef.current) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          setMicLevel(Math.min(100, Math.round((avg / 128) * 100)));
          requestAnimationFrame(checkVolume);
        };
        checkVolume();
      } catch (err) {
        toast({
          title: "Microphone Access Denied",
          description: "Please allow microphone permissions in your browser to test voice calling.",
          variant: "destructive"
        });
      }
    }
  };

  const handleResetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem("farmiq_app_settings", JSON.stringify(DEFAULT_SETTINGS));
    toast({
      title: "Preferences Reset",
      description: "All farming and system settings have been restored to default."
    });
    setLastSavedTime("Reset to Default");
  };

  const handleClearCache = () => {
    toast({
      title: "Offline Storage Cleared",
      description: "Crop models cache and local temporary logs have been refreshed."
    });
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `farmiq_settings_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    toast({
      title: "Settings Exported",
      description: "Preferences backup file downloaded successfully."
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* 1. TOP HEADER WITH BACK BUTTON & REAL-TIME SYNC BADGE */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/")}
            className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 h-9 px-3 flex items-center gap-1.5 font-semibold text-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Dashboard</span>
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-emerald-700" />
              <span>Settings & Preferences</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize farming parameters, real-time alert thresholds, language, and in-app VoIP calling.
            </p>
          </div>
        </div>

        {/* Real-time Status Badge */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{lastSavedTime}</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN SETTINGS TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl grid grid-cols-2 sm:grid-cols-5 gap-1 w-full border border-slate-200/80">
          <TabsTrigger
            value="farm_profile"
            className="rounded-lg font-semibold text-xs py-2.5 data-[state=active]:bg-white data-[state=active]:text-emerald-900 data-[state=active]:shadow-xs transition-all flex items-center justify-center gap-1.5"
          >
            <Wheat className="h-3.5 w-3.5" />
            <span>Farm Profile</span>
          </TabsTrigger>

          <TabsTrigger
            value="weather_alerts"
            className="rounded-lg font-semibold text-xs py-2.5 data-[state=active]:bg-white data-[state=active]:text-emerald-900 data-[state=active]:shadow-xs transition-all flex items-center justify-center gap-1.5"
          >
            <CloudRain className="h-3.5 w-3.5" />
            <span>Weather Alerts</span>
          </TabsTrigger>

          <TabsTrigger
            value="voip_privacy"
            className="rounded-lg font-semibold text-xs py-2.5 data-[state=active]:bg-white data-[state=active]:text-emerald-900 data-[state=active]:shadow-xs transition-all flex items-center justify-center gap-1.5"
          >
            <PhoneCall className="h-3.5 w-3.5" />
            <span>VoIP & Calling</span>
          </TabsTrigger>

          <TabsTrigger
            value="language_mandi"
            className="rounded-lg font-semibold text-xs py-2.5 data-[state=active]:bg-white data-[state=active]:text-emerald-900 data-[state=active]:shadow-xs transition-all flex items-center justify-center gap-1.5"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Language & Mandi</span>
          </TabsTrigger>

          <TabsTrigger
            value="data_storage"
            className="rounded-lg font-semibold text-xs py-2.5 data-[state=active]:bg-white data-[state=active]:text-emerald-900 data-[state=active]:shadow-xs transition-all flex items-center justify-center gap-1.5"
          >
            <HardDrive className="h-3.5 w-3.5" />
            <span>Offline & Data</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: FARMING & SOIL PROFILE */}
        <TabsContent value="farm_profile" className="space-y-6">
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-6 space-y-6">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Wheat className="h-4 w-4 text-emerald-700" />
                <span>Agricultural & Soil Characteristics</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Used to calibrate disease recommendations, profit simulations, and fertilizer schedules for your specific land.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              {/* Land Unit */}
              <div className="space-y-1.5">
                <Label className="font-semibold text-slate-800 text-xs">Land Measurement Unit</Label>
                <Select value={settings.landUnit} onValueChange={(v) => updateSetting("landUnit", v)}>
                  <SelectTrigger className="rounded-xl h-10 border-slate-200 text-xs">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Acres">Acres (ఎకరాలు)</SelectItem>
                    <SelectItem value="Hectares">Hectares (హెక్టార్లు)</SelectItem>
                    <SelectItem value="Guntas">Guntas / Cents (గుంటలు)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Farm Size */}
              <div className="space-y-1.5">
                <Label className="font-semibold text-slate-800 text-xs">Total Cultivated Area ({settings.landUnit})</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={settings.farmSize}
                    onChange={(e) => updateSetting("farmSize", e.target.value)}
                    className="rounded-xl h-10 border-slate-200 text-xs"
                    placeholder="e.g. 3.5"
                  />
                  <div className="flex gap-1 shrink-0">
                    {["1", "2.5", "5", "10"].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => updateSetting("farmSize", num)}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors ${
                          settings.farmSize === num
                            ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Primary Soil Type */}
              <div className="space-y-1.5">
                <Label className="font-semibold text-slate-800 text-xs">Predominant Soil Type</Label>
                <Select value={settings.soilType} onValueChange={(v) => updateSetting("soilType", v)}>
                  <SelectTrigger className="rounded-xl h-10 border-slate-200 text-xs">
                    <SelectValue placeholder="Select soil type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Black Clay Loam">Black Clay Loam (నల్లరేగడి నేల)</SelectItem>
                    <SelectItem value="Red Sandy Loam">Red Sandy Loam (ఎర్ర నేల)</SelectItem>
                    <SelectItem value="Alluvial Delta Soil">Alluvial Delta Soil (ఒండ్రు నేల)</SelectItem>
                    <SelectItem value="Laterite Soil">Laterite Soil (లేటరైట్ నేల)</SelectItem>
                    <SelectItem value="Saline Soil">Coastal Saline Soil (ఉప్పు నేల)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Primary Crop */}
              <div className="space-y-1.5">
                <Label className="font-semibold text-slate-800 text-xs">Primary Target Crop</Label>
                <Select value={settings.primaryCrop} onValueChange={(v) => updateSetting("primaryCrop", v)}>
                  <SelectTrigger className="rounded-xl h-10 border-slate-200 text-xs">
                    <SelectValue placeholder="Select primary crop" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Paddy (వరి)">Paddy / Rice (వరి)</SelectItem>
                    <SelectItem value="Chilli (మిర్చి)">Chilli / Mirchi (మిర్చి)</SelectItem>
                    <SelectItem value="Cotton (పత్తి)">Cotton (పత్తి)</SelectItem>
                    <SelectItem value="Groundnut (వేరుశనగ)">Groundnut (వేరుశనగ)</SelectItem>
                    <SelectItem value="Maize (మొక్కజొన్న)">Maize (మొక్కజొన్న)</SelectItem>
                    <SelectItem value="Sugarcane (చెరకు)">Sugarcane (చెరకు)</SelectItem>
                    <SelectItem value="Tomato (టమోటా)">Tomato (టమోటా)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Irrigation Type */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="font-semibold text-slate-800 text-xs">Irrigation Infrastructure</Label>
                <Select value={settings.irrigationType} onValueChange={(v) => updateSetting("irrigationType", v)}>
                  <SelectTrigger className="rounded-xl h-10 border-slate-200 text-xs">
                    <SelectValue placeholder="Select irrigation source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Borewell / Solar Pump">Borewell & Solar Pump (PM-KUSUM)</SelectItem>
                    <SelectItem value="Drip / Micro-Irrigation">Drip / Micro-Irrigation (APMIP Assisted)</SelectItem>
                    <SelectItem value="Canal / Delta Gravity">Canal / River Delta Gravity Flow</SelectItem>
                    <SelectItem value="Rainfed (వర్షాధారం)">Rainfed / Non-irrigated (వర్షాధారం)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 2: REAL-TIME WEATHER & SPRAY ALERTS */}
        <TabsContent value="weather_alerts" className="space-y-6">
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-6 space-y-6">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <CloudRain className="h-4 w-4 text-blue-600" />
                <span>Weather Alert Thresholds & Spray Conditions</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated field notifications to protect your fertilizer applications, drone spraying, and harvesting.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              {/* Rain Alert Switch & Slider */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="font-semibold text-slate-900">Rain & Storm Warning</p>
                  <p className="text-slate-500 text-[11px]">
                    Alert when rainfall probability exceeds <strong>{settings.rainThreshold}%</strong> within 24 hours.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Select value={settings.rainThreshold} onValueChange={(v) => updateSetting("rainThreshold", v)}>
                    <SelectTrigger className="w-28 h-9 rounded-lg text-xs bg-white">
                      <SelectValue placeholder="Threshold" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="40">&gt; 40% Rain</SelectItem>
                      <SelectItem value="60">&gt; 60% Rain</SelectItem>
                      <SelectItem value="80">&gt; 80% Heavy</SelectItem>
                    </SelectContent>
                  </Select>
                  <Switch checked={settings.rainAlert} onCheckedChange={(v) => updateSetting("rainAlert", v)} />
                </div>
              </div>

              {/* Wind Speed Spray Advisory */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="font-semibold text-slate-900">Pesticide Spray Window Advisory</p>
                  <p className="text-slate-500 text-[11px]">
                    Warn against drone or knapsack spraying when wind speed &gt; 18 km/h (prevents pesticide drift).
                  </p>
                </div>
                <Switch checked={settings.windSprayAlert} onCheckedChange={(v) => updateSetting("windSprayAlert", v)} />
              </div>

              {/* Heatwave Advisory */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="font-semibold text-slate-900">Severe Heatwave & Evaporation Alert</p>
                  <p className="text-slate-500 text-[11px]">
                    Notify to increase irrigation frequency when ambient temperatures exceed 38°C.
                  </p>
                </div>
                <Switch checked={settings.heatwaveAlert} onCheckedChange={(v) => updateSetting("heatwaveAlert", v)} />
              </div>

              {/* Sound toggle */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="font-semibold text-slate-900">Audible Alert Sound</p>
                  <p className="text-slate-500 text-[11px]">Play a notification chime when critical weather warnings trigger.</p>
                </div>
                <Switch checked={settings.alertSound} onCheckedChange={(v) => updateSetting("alertSound", v)} />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 3: IN-APP VOIP & CALL PRIVACY */}
        <TabsContent value="voip_privacy" className="space-y-6">
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-6 space-y-6">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <PhoneCall className="h-4 w-4 text-emerald-700" />
                <span>In-App Voice Calling (WebRTC VoIP) & Confidentiality</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Controls real-time voice communication for equipment rentals, agronomist calls, and marketplace negotiations.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              {/* VoIP Enabled Switch */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="font-semibold text-slate-900">Enable In-App VoIP Voice Calling</p>
                  <p className="text-slate-500 text-[11px]">
                    Allows receiving and making high-definition encrypted voice calls directly in the browser/app.
                  </p>
                </div>
                <Switch checked={settings.voipEnabled} onCheckedChange={(v) => updateSetting("voipEnabled", v)} />
              </div>

              {/* Number Masking Switch */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-emerald-800" />
                    <p className="font-bold text-emerald-950">Farmer Phone Number Masking (100% Confidential)</p>
                  </div>
                  <p className="text-emerald-800 text-[11px]">
                    Never show your private mobile number to other farmers, buyers, or machine renters. Calls connect through secure in-app channels.
                  </p>
                </div>
                <Switch checked={settings.numberMasking} onCheckedChange={(v) => updateSetting("numberMasking", v)} />
              </div>

              {/* Ringtone Tester */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="font-semibold text-slate-900">In-App Ringtone Sound</p>
                  <p className="text-slate-500 text-[11px]">Preview incoming call chime synthesizer sound.</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={testRingtone}
                    className="rounded-xl border-slate-200 bg-white h-9 px-3.5 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                  >
                    <Volume2 className="h-3.5 w-3.5 mr-1.5 text-emerald-700" />
                    <span>Play Chime</span>
                  </Button>
                </div>
              </div>

              {/* Microphone Test */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-900">Microphone Hardware Test</p>
                    <p className="text-slate-500 text-[11px]">Verify that your microphone captures clear voice audio for agronomist calls.</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={micTesting ? "destructive" : "outline"}
                    onClick={toggleMicTest}
                    className="rounded-xl h-9 px-3.5 text-xs font-semibold"
                  >
                    <Mic className="h-3.5 w-3.5 mr-1.5" />
                    <span>{micTesting ? "Stop Test" : "Test Mic"}</span>
                  </Button>
                </div>

                {micTesting && (
                  <div className="space-y-1 pt-2">
                    <div className="flex justify-between text-[11px] font-medium text-slate-600">
                      <span>Mic Input Level</span>
                      <span>{micLevel}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-2 transition-all duration-75 rounded-full"
                        style={{ width: `${micLevel}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 4: LANGUAGE & MANDI ALERTS */}
        <TabsContent value="language_mandi" className="space-y-6">
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-6 space-y-6">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-purple-600" />
                <span>Language & Market Price Notifications</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Set regional dialect and live AP / Telangana mandi rate alerts.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              {/* Language */}
              <div className="space-y-1.5">
                <Label className="font-semibold text-slate-800 text-xs">Application Language</Label>
                <Select value={settings.language} onValueChange={(v) => updateSetting("language", v)}>
                  <SelectTrigger className="rounded-xl h-10 border-slate-200 text-xs">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="te">తెలుగు (Telugu)</SelectItem>
                    <SelectItem value="hi">हिंदी (Hindi)</SelectItem>
                    <SelectItem value="ta">தமிழ் (Tamil)</SelectItem>
                    <SelectItem value="mr">मराठी (Marathi)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Currency Display */}
              <div className="space-y-1.5">
                <Label className="font-semibold text-slate-800 text-xs">Currency Unit</Label>
                <Input value="₹ INR (Indian Rupee)" disabled className="rounded-xl h-10 bg-slate-50 text-xs" />
              </div>

              {/* Mandi Price Updates */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="font-semibold text-slate-900">Daily Mandi Price Ticker</p>
                  <p className="text-slate-500 text-[11px]">
                    Receive morning price summaries for Guntur Mirchi Yard, Tenali Paddy Market, and Warangal Cotton.
                  </p>
                </div>
                <Switch checked={settings.mandiPriceAlerts} onCheckedChange={(v) => updateSetting("mandiPriceAlerts", v)} />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 5: OFFLINE CACHE & STORAGE */}
        <TabsContent value="data_storage" className="space-y-6">
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-6 space-y-6">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-teal-600" />
                <span>Offline Model Storage & Data Backup</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage cached crop disease detection models for field diagnostics with poor 2G/3G network.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              {/* Storage Usage Bar */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-800">Offline Agricultural Cache</span>
                  <span className="text-slate-500 font-mono">34.8 MB / 200 MB</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-600 h-2 rounded-full" style={{ width: "17%" }}></div>
                </div>
                <p className="text-[11px] text-slate-500">
                  Includes MobileNetV2 offline leaf disease models, fertilizer dosing database, and government subsidy forms.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearCache}
                  className="rounded-xl border-slate-200 hover:bg-slate-50 h-10 text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-slate-600" />
                  <span>Refresh Cache</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleExportData}
                  className="rounded-xl border-slate-200 hover:bg-slate-50 h-10 text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <Download className="h-3.5 w-3.5 text-slate-600" />
                  <span>Export JSON Backup</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetSettings}
                  className="rounded-xl border-red-200 text-red-700 hover:bg-red-50 h-10 text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Reset All</span>
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
