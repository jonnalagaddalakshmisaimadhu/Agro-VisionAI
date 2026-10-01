import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import {
  Navigation,
  MapPin,
  AlertTriangle,
  Clock,
  Compass,
  ArrowRight,
  ShieldAlert,
  Play,
  CheckCircle2,
  PlusCircle,
  RefreshCw,
  Sliders,
  Car,
  Bike,
  Info,
  ChevronDown,
  ChevronUp,
  X,
  Radio
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import RealtimeTelemetryMap from "./RealtimeTelemetryMap";
import mobileBackgroundService from "@/services/mobileBackgroundService";

// API Base URL from environment or default local
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface Coordinate {
  lat: number;
  lon: number;
  name: string;
}

interface TurnStep {
  instruction: string;
  type: string;
  modifier?: string;
  distance_meters: number;
  duration_seconds: number;
}

interface Incident {
  id: number;
  title: string;
  incident_type: string;
  severity: string;
  latitude: number;
  longitude: number;
  radius_meters?: number;
  description?: string;
  reported_by?: string;
  distance_from_corridor_meters?: number;
  estimated_delay_minutes?: number;
}

interface ActiveTrip {
  trip_id: number;
  origin: Coordinate;
  destination: Coordinate;
  distance_km: number;
  duration_minutes: number;
  status: string;
  startTime: string;
}

const PRESET_CORRIDORS = [
  {
    name: "Guntur Agri Hub ➔ Vijayawada Wholesale Terminal",
    origin: { lat: 16.3067, lon: 80.4365, name: "Guntur Agri Hub" },
    destination: { lat: 16.5062, lon: 80.6480, name: "Vijayawada Wholesale Terminal" }
  },
  {
    name: "Tenali Rice Mill ➔ Amaravati Capital Terminal",
    origin: { lat: 16.2430, lon: 80.6400, name: "Tenali Rice Processing Hub" },
    destination: { lat: 16.5130, lon: 80.5160, name: "Amaravati Agro Logistics" }
  },
  {
    name: "NH16 Freight Bypass (Mangalagiri ➔ Gannavaram Cargo)",
    origin: { lat: 16.4350, lon: 80.5700, name: "Mangalagiri Spices Depot" },
    destination: { lat: 16.5300, lon: 80.7900, name: "Gannavaram Air Cargo" }
  }
];

export const NavigationRouting: React.FC = () => {
  const { user } = useAuth();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Origin & Destination state
  const [origin, setOrigin] = useState<Coordinate>(PRESET_CORRIDORS[0].origin);
  const [destination, setDestination] = useState<Coordinate>(PRESET_CORRIDORS[0].destination);
  const [vehicleProfile, setVehicleProfile] = useState<"driving" | "bike">("driving");
  const [corridorBuffer, setCorridorBuffer] = useState<number>(1000);
  const [currentMode, setCurrentMode] = useState<"routing" | "telemetry">("routing");

  // Route calculation results
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeData, setRouteData] = useState<{
    routing_engine: string;
    distance_km: number;
    base_duration_minutes: number;
    adjusted_duration_minutes: number;
    total_incident_delay_minutes: number;
    polyline: [number, number][];
    turn_by_turn_steps: TurnStep[];
    incidents_on_route: Incident[];
  } | null>(null);

  // Active incidents & Reporting state
  const [allIncidents, setAllIncidents] = useState<Incident[]>([]);
  const [isReportingOpen, setIsReportingOpen] = useState(false);
  const [newIncidentTitle, setNewIncidentTitle] = useState("");
  const [newIncidentType, setNewIncidentType] = useState("congestion");
  const [newIncidentSeverity, setNewIncidentSeverity] = useState("medium");
  const [newIncidentLat, setNewIncidentLat] = useState<string>("");
  const [newIncidentLon, setNewIncidentLon] = useState<string>("");
  const [newIncidentDesc, setNewIncidentDesc] = useState("");

  // Trip tracking
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null);
  const [showSteps, setShowSteps] = useState(true);

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [16.42, 80.55],
        zoom: 11,
        zoomControl: false
      });

      L.control.zoom({ position: "topright" }).addTo(map);

      // OpenStreetMap high-contrast tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        maxZoom: 19
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    // Initial load
    fetchActiveIncidents();
    handleCalculateRoute();

    return () => {
      // Map cleanup if component unmounts
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Fetch Active Spatial Incidents from PostGIS database
  const fetchActiveIncidents = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/navigation/incidents?radius_km=100`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.incidents || [];
        setAllIncidents(list);
      }
    } catch (err) {
      console.error("Failed to fetch spatial incidents:", err);
    }
  };

  // 3. Request Route & Incident Corridor Matching
  const handleCalculateRoute = async (
    customOrigin = origin,
    customDest = destination,
    customProfile = vehicleProfile
  ) => {
    setIsLoadingRoute(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/navigation/route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: customOrigin,
          destination: customDest,
          profile: customProfile,
          corridor_buffer_meters: corridorBuffer
        })
      });

      if (!response.ok) {
        throw new Error(`Routing failed with status: ${response.status}`);
      }

      const data = await response.json();
      setRouteData(data);

      renderRouteOnMap(data);
      toast.success("Optimal route path calculated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to calculate navigation route.");
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // 4. Render Route Polyline and Incidents on Leaflet Map
  const renderRouteOnMap = (route: any) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing polyline
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
    }
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();
    }

    const polylineCoords = route.polyline; // [[lat, lon], ...]
    if (polylineCoords && polylineCoords.length > 0) {
      // Draw glow border line
      const glowLine = L.polyline(polylineCoords, {
        color: "#10b981",
        weight: 8,
        opacity: 0.35,
        lineCap: "round"
      });

      // Draw primary route line
      const mainLine = L.polyline(polylineCoords, {
        color: "#059669",
        weight: 5,
        opacity: 0.95,
        lineCap: "round"
      });

      const routeGroup = L.featureGroup([glowLine, mainLine]);
      routeGroup.addTo(map);
      routeLayerRef.current = mainLine;

      map.fitBounds(routeGroup.getBounds(), { padding: [50, 50] });

      // Origin Marker (Custom SVG Pin)
      const originIcon = L.divIcon({
        className: "custom-div-icon",
        html: `
          <div style="background:#059669; color:#fff; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:3px solid #ffffff; box-shadow:0 4px 10px rgba(0,0,0,0.35); font-weight:bold; font-size:14px;">
            A
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      // Destination Marker
      const destIcon = L.divIcon({
        className: "custom-div-icon",
        html: `
          <div style="background:#dc2626; color:#fff; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:3px solid #ffffff; box-shadow:0 4px 10px rgba(0,0,0,0.35); font-weight:bold; font-size:14px;">
            B
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      if (markersLayerRef.current) {
        L.marker([route.origin.lat, route.origin.lon], { icon: originIcon })
          .bindPopup(`<b>Origin</b><br>${route.origin.name}`)
          .addTo(markersLayerRef.current);

        L.marker([route.destination.lat, route.destination.lon], { icon: destIcon })
          .bindPopup(`<b>Destination</b><br>${route.destination.name}`)
          .addTo(markersLayerRef.current);

        // Render Spatial Incidents along corridor
        const corridorHazards = route.incidents_on_route || route.corridor_hazards || [];
        corridorHazards.forEach((inc: Incident) => {
          const colorMap: Record<string, string> = {
            critical: "#dc2626",
            high: "#ea580c",
            medium: "#f59e0b",
            low: "#3b82f6"
          };
          const bg = colorMap[inc.severity] || "#ea580c";

          const hazardIcon = L.divIcon({
            className: "hazard-icon",
            html: `
              <div style="background:${bg}; color:#fff; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #fff; box-shadow:0 3px 8px rgba(0,0,0,0.4); animation: pulse 2s infinite;">
                ⚠️
              </div>
            `,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          });

          L.marker([inc.latitude, inc.longitude], { icon: hazardIcon })
            .bindPopup(`
              <div style="font-family:sans-serif; min-width:180px;">
                <b style="color:${bg}; text-transform:uppercase;">${inc.incident_type} (${inc.severity})</b>
                <p style="margin:4px 0 2px; font-weight:600;">${inc.title}</p>
                <small style="color:#666;">${inc.description || ""}</small>
                <div style="margin-top:6px; font-size:11px; color:#e11d48; font-weight:bold;">
                  +${inc.estimated_delay_minutes || 5} min corridor delay
                </div>
              </div>
            `)
            .addTo(markersLayerRef.current!);
        });
      }
    }
  };

  // 5. Select Preset Route
  const handleSelectPreset = (preset: (typeof PRESET_CORRIDORS)[0]) => {
    setOrigin(preset.origin);
    setDestination(preset.destination);
    handleCalculateRoute(preset.origin, preset.destination);
  };

  // 6. Use My Location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    toast.info("Acquiring GPS location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: Coordinate = {
          lat: Number(pos.coords.latitude.toFixed(5)),
          lon: Number(pos.coords.longitude.toFixed(5)),
          name: "Current GPS Location"
        };
        setOrigin(coords);
        toast.success("GPS location locked as origin!");
      },
      (err) => toast.error(`Location error: ${err.message}`)
    );
  };

  // 7. Start Active Journey
  const handleStartTrip = async () => {
    if (!routeData) {
      toast.error("Please calculate a route first");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/navigation/trips/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: routeData.origin || origin,
          destination: routeData.destination || destination,
          distance_km: routeData.distance_km,
          duration_minutes: routeData.adjusted_duration_minutes,
          route_polyline: routeData.polyline ? routeData.polyline.slice(0, 10) : [],
          user_email: user?.email || "farmer@farmiq.ai"
        })
      });

      if (!res.ok) throw new Error("Could not start trip");
      const data = await res.json();
      setActiveTrip({
        trip_id: data.trip_id,
        origin,
        destination,
        distance_km: routeData.distance_km,
        duration_minutes: routeData.adjusted_duration_minutes,
        status: "IN_PROGRESS",
        startTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      });

      // Activate Phase 3 Background GPS collection with persistent foreground notification
      await mobileBackgroundService.startBackgroundTracking(
        data.trip_id,
        user?.email || "AP-07-TA-8822"
      );

      toast.success(`Active journey initiated! Trip ID #${data.trip_id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to start trip.");
    }
  };

  // 8. Complete Journey
  const handleCompleteTrip = async () => {
    if (!activeTrip) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/navigation/trips/${activeTrip.trip_id}/complete`, {
        method: "PUT"
      });
      if (!res.ok) throw new Error("Could not complete trip");

      // Dismiss foreground notification and stop background tracking
      await mobileBackgroundService.stopBackgroundTracking();

      toast.success("Trip completed successfully! Safe travels logged.");
      setActiveTrip(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to complete trip.");
    }
  };

  // 9. Report New Incident Modal Submit
  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncidentTitle || !newIncidentLat || !newIncidentLon) {
      toast.error("Please provide title, latitude, and longitude.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/navigation/incidents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newIncidentTitle,
          incident_type: newIncidentType,
          severity: newIncidentSeverity,
          latitude: parseFloat(newIncidentLat),
          longitude: parseFloat(newIncidentLon),
          radius_meters: 250,
          description: newIncidentDesc,
          reported_by: user?.email || "Field_Driver"
        })
      });

      if (!res.ok) throw new Error("Could not report incident");
      toast.success("Spatial incident broadcasted to active map!");
      setIsReportingOpen(false);
      setNewIncidentTitle("");
      setNewIncidentDesc("");
      fetchActiveIncidents();
      handleCalculateRoute();
    } catch (err: any) {
      toast.error(err.message || "Failed to report incident.");
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-80px)] w-full bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Top Navigation Mode Switcher Bar */}
      <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setCurrentMode("routing")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentMode === "routing"
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Phase 1: Core Routing Engine</span>
              <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-emerald-300 bg-emerald-50 text-emerald-700">
                OSRM
              </Badge>
            </button>
            <button
              onClick={() => setCurrentMode("telemetry")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentMode === "telemetry"
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-500" />
              <span>Phase 2: Live Telemetry & Vector Radar</span>
              <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-emerald-300 bg-emerald-50 text-emerald-700">
                Redis 7.2
              </Badge>
            </button>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-mono">
          <span>Zero Page Refreshes</span>
          <span>•</span>
          <span className="text-emerald-600 font-semibold">MapLibre GL & WebSockets</span>
        </div>
      </div>

      {/* Conditional View Rendering */}
      {currentMode === "telemetry" ? (
        <div className="flex-1 w-full h-[calc(100vh-140px)]">
          <RealtimeTelemetryMap />
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row flex-1 h-[calc(100vh-140px)] w-full">
          {/* LEFT CONTROL PANEL (Routing, Presets, Incidents & Turns) */}
          <div className="w-full lg:w-[460px] xl:w-[500px] flex-shrink-0 p-4 lg:p-6 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col gap-4 overflow-y-auto max-h-[92vh]">
        {/* Header Banner */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <Navigation className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Core Routing & Pathfinding
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                PostGIS 3.4 • OSRM Turn Engine • Spatial Corridors
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 font-mono text-xs">
            Phase 1 MVP
          </Badge>
        </div>

        {/* Active Trip Live HUD */}
        {activeTrip && (
          <div className="p-4 rounded-xl bg-emerald-600 text-white shadow-lg flex flex-col gap-2 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider bg-emerald-700/60 px-2 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping inline-block" /> Live Journey #{activeTrip.trip_id}
              </span>
              <span className="text-xs font-mono">Started: {activeTrip.startTime}</span>
            </div>
            <div className="text-sm font-medium">
              {activeTrip.origin.name} ➔ {activeTrip.destination.name}
            </div>
            <div className="flex items-center justify-between text-xs text-emerald-100 pt-1 border-t border-emerald-500/50">
              <span>{activeTrip.distance_km} km remaining</span>
              <span>Est: ~{activeTrip.duration_minutes} min</span>
            </div>
            <Button
              onClick={handleCompleteTrip}
              size="sm"
              className="mt-1 bg-white text-emerald-700 hover:bg-emerald-50 font-bold"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" /> Complete Trip & Log
            </Button>
          </div>
        )}

        {/* Quick Corridor Presets */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Quick Corridor Presets</span>
            <span className="text-[11px] font-normal lowercase text-emerald-600">click to load</span>
          </label>
          <div className="flex flex-col gap-1.5">
            {PRESET_CORRIDORS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectPreset(preset)}
                className="text-left text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-all flex items-center justify-between group"
              >
                <span className="font-medium text-slate-700 dark:text-slate-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                  {preset.name}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </div>
        </div>

        {/* Origin & Destination Inputs */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col gap-3">
          {/* Origin */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Origin Point
              </label>
              <button
                onClick={handleUseCurrentLocation}
                className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1"
              >
                <Compass className="w-3 h-3" /> GPS Detect
              </button>
            </div>
            <Input
              value={origin.name}
              onChange={(e) => setOrigin({ ...origin, name: e.target.value })}
              placeholder="Origin Name or Terminal"
              className="text-xs h-8"
            />
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.0001"
                value={origin.lat}
                onChange={(e) => setOrigin({ ...origin, lat: parseFloat(e.target.value) || 0 })}
                placeholder="Lat"
                className="text-xs h-7 font-mono"
              />
              <Input
                type="number"
                step="0.0001"
                value={origin.lon}
                onChange={(e) => setOrigin({ ...origin, lon: parseFloat(e.target.value) || 0 })}
                placeholder="Lon"
                className="text-xs h-7 font-mono"
              />
            </div>
          </div>

          {/* Destination */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Destination Point
            </label>
            <Input
              value={destination.name}
              onChange={(e) => setDestination({ ...destination, name: e.target.value })}
              placeholder="Destination Name or Cold Storage"
              className="text-xs h-8"
            />
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.0001"
                value={destination.lat}
                onChange={(e) => setDestination({ ...destination, lat: parseFloat(e.target.value) || 0 })}
                placeholder="Lat"
                className="text-xs h-7 font-mono"
              />
              <Input
                type="number"
                step="0.0001"
                value={destination.lon}
                onChange={(e) => setDestination({ ...destination, lon: parseFloat(e.target.value) || 0 })}
                placeholder="Lon"
                className="text-xs h-7 font-mono"
              />
            </div>
          </div>

          {/* Vehicle Profile & Action */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setVehicleProfile("driving")}
                className={`px-2.5 py-1 text-xs rounded-md font-medium flex items-center gap-1 transition-colors ${
                  vehicleProfile === "driving"
                    ? "bg-emerald-600 text-white"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Car className="w-3.5 h-3.5" /> Truck / Car
              </button>
              <button
                type="button"
                onClick={() => setVehicleProfile("bike")}
                className={`px-2.5 py-1 text-xs rounded-md font-medium flex items-center gap-1 transition-colors ${
                  vehicleProfile === "bike"
                    ? "bg-emerald-600 text-white"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Bike className="w-3.5 h-3.5" /> Two-Wheeler
              </button>
            </div>

            <Button
              onClick={() => handleCalculateRoute()}
              disabled={isLoadingRoute}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4"
            >
              {isLoadingRoute ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Routing...
                </>
              ) : (
                <>
                  <Compass className="w-3.5 h-3.5 mr-1.5" /> Find Path
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Route Metrics HUD */}
        {routeData && (
          <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-gradient-to-br from-emerald-500/10 via-slate-50 to-emerald-500/5 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-800 border border-emerald-200 dark:border-emerald-800/50">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">Distance</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                {routeData.distance_km} <span className="text-xs font-normal text-slate-500">km</span>
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">Base ETA</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                {routeData.base_duration_minutes} <span className="text-xs font-normal text-slate-500">min</span>
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider text-amber-600 font-medium flex items-center gap-0.5">
                <Clock className="w-3 h-3" /> Live ETA
              </span>
              <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                {routeData.adjusted_duration_minutes} <span className="text-xs font-normal text-amber-500">min</span>
              </span>
            </div>
            <div className="col-span-3 pt-1 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200 dark:border-slate-800">
              <span className="flex items-center gap-1 font-mono">
                Engine: <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{routeData.routing_engine}</Badge>
              </span>
              {!activeTrip && (
                <button
                  onClick={handleStartTrip}
                  className="text-emerald-600 font-bold hover:underline flex items-center gap-1"
                >
                  <Play className="w-3 h-3" /> Start This Journey
                </button>
              )}
            </div>
          </div>
        )}

        {/* Spatial Incident Warnings along corridor */}
        {routeData && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Corridor Hazards Detected (
                {routeData.incidents_on_route?.length || 0})
              </span>
              <button
                onClick={() => setIsReportingOpen(true)}
                className="text-xs text-emerald-600 hover:underline flex items-center gap-1"
              >
                <PlusCircle className="w-3 h-3" /> Report Hazard
              </button>
            </div>

            {(!routeData.incidents_on_route || routeData.incidents_on_route.length === 0) ? (
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs text-slate-500 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>All clear! No critical spatial bottlenecks detected within corridor buffer.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                {routeData.incidents_on_route.map((inc) => (
                  <div
                    key={inc.id}
                    className="p-2.5 rounded-lg border border-amber-300 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20 text-xs flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                        {inc.title}
                      </span>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold text-amber-700 border-amber-400 bg-amber-100 dark:bg-amber-900/50">
                        {inc.severity}
                      </Badge>
                    </div>
                    {inc.description && <p className="text-slate-600 dark:text-slate-400 text-[11px]">{inc.description}</p>}
                    <div className="flex items-center justify-between text-[10px] text-amber-800 dark:text-amber-300 font-mono pt-1">
                      <span>Proximity: {inc.distance_from_corridor_meters ? `${inc.distance_from_corridor_meters}m from route` : "On Corridor"}</span>
                      <span className="font-bold text-red-600 dark:text-red-400">+{inc.estimated_delay_minutes || 5} min delay</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Turn-by-Turn Maneuvers Collapsible */}
        {routeData && routeData.turn_by_turn_steps && (
          <div className="flex flex-col gap-2 border-t border-slate-200 dark:border-slate-800 pt-3">
            <button
              onClick={() => setShowSteps(!showSteps)}
              className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:text-emerald-600"
            >
              <span className="flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5" /> Turn-by-Turn Guidance ({routeData.turn_by_turn_steps.length} steps)
              </span>
              {showSteps ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showSteps && (
              <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
                {routeData.turn_by_turn_steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-md bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px] flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 font-medium">
                        {step.instruction}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono flex-shrink-0">
                      {step.distance_meters > 1000
                        ? `${(step.distance_meters / 1000).toFixed(1)} km`
                        : `${Math.round(step.distance_meters)} m`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT INTERACTIVE MAP CANVAS */}
      <div className="flex-1 relative h-[450px] lg:h-full w-full">
        <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 1 }} />

        {/* Floating Controls Overlay */}
        <div className="absolute top-4 left-4 z-[500] flex flex-col gap-2">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              OSRM PostGIS Engine
            </span>
            <div className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
            <span className="text-xs text-slate-500">
              Corridor Buffer: <b className="text-slate-800 dark:text-slate-200">{corridorBuffer}m</b>
            </span>
            <button
              onClick={() => {
                fetchActiveIncidents();
                handleCalculateRoute();
              }}
              title="Refresh Map & Incidents"
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-500"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Map Legend Overlay */}
        <div className="absolute bottom-6 right-4 z-[500] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg text-[11px] flex flex-col gap-1.5">
          <span className="font-bold text-slate-700 dark:text-slate-300">Spatial Map Legend</span>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
            <span>Origin Point (A)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-600 inline-block" />
            <span>Destination (B)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 bg-emerald-500 inline-block rounded" />
            <span>Calculated Route Polyline</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs">⚠️</span>
            <span>Spatial Incident / Hazard</span>
          </div>
        </div>
      </div>
    </div>
  )}

      {/* REPORT NEW SPATIAL INCIDENT MODAL */}
      {isReportingOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 dark:text-white">Report Spatial Road Hazard</h3>
              </div>
              <button
                onClick={() => setIsReportingOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReportIncident} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Incident Title</label>
                <Input
                  required
                  placeholder="e.g. Tractor Breakdown on NH16 Bypass"
                  value={newIncidentTitle}
                  onChange={(e) => setNewIncidentTitle(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Type</label>
                  <select
                    value={newIncidentType}
                    onChange={(e) => setNewIncidentType(e.target.value)}
                    className="h-9 px-2 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-background"
                  >
                    <option value="congestion">Congestion / Slow</option>
                    <option value="accident">Accident</option>
                    <option value="road_work">Road Work / Repair</option>
                    <option value="hazard">Road Hazard / Debris</option>
                    <option value="weather_block">Waterlogging / Mud</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Severity</label>
                  <select
                    value={newIncidentSeverity}
                    onChange={(e) => setNewIncidentSeverity(e.target.value)}
                    className="h-9 px-2 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-background"
                  >
                    <option value="low">Low (+3 min)</option>
                    <option value="medium">Medium (+8 min)</option>
                    <option value="high">High (+18 min)</option>
                    <option value="critical">Critical (+35 min)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Latitude</label>
                  <Input
                    required
                    type="number"
                    step="0.0001"
                    placeholder="16.4410"
                    value={newIncidentLat}
                    onChange={(e) => setNewIncidentLat(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Longitude</label>
                  <Input
                    required
                    type="number"
                    step="0.0001"
                    placeholder="80.5620"
                    value={newIncidentLon}
                    onChange={(e) => setNewIncidentLon(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Description</label>
                <textarea
                  placeholder="Detail condition, lane closures, or alternative diversions..."
                  value={newIncidentDesc}
                  onChange={(e) => setNewIncidentDesc(e.target.value)}
                  className="p-2 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-background h-16 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsReportingOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                >
                  Publish Spatial Incident
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NavigationRouting;
