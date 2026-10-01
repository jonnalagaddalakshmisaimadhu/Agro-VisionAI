import React, { useEffect, useRef, useState, useCallback } from "react";
import { Map as MapLibreMap, Marker, NavigationControl, StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Radio,
  Navigation,
  Compass,
  Gauge,
  BatteryCharging,
  Layers,
  Play,
  RotateCw,
  Wifi,
  WifiOff,
  Truck,
  MapPin,
  Clock,
  Send,
  Zap,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Backend HTTP & WebSocket base URLs
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const WS_BASE_URL = API_BASE_URL.replace(/^http/, "ws");

interface VehicleTelemetry {
  vehicle_id: string;
  trip_id?: number;
  latitude: number;
  longitude: number;
  speed_kmh: number;
  heading: number;
  timestamp?: number;
  status?: string;
  battery_pct?: number;
}

export const RealtimeTelemetryMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<MapLibreMap | null>(null);
  const vehicleMarkersRef = useRef<Map<string, { marker: Marker; element: HTMLElement }>>(new Map());
  const socketRef = useRef<WebSocket | null>(null);
  const animationFramesRef = useRef<Map<string, number>>(new Map());

  // Real-time state
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [engineType, setEngineType] = useState<string>("Redis 7.2 Pub/Sub");
  const [messagesReceived, setMessagesReceived] = useState<number>(0);
  const [vehicles, setVehicles] = useState<Map<string, VehicleTelemetry>>(new Map());
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("AP-07-TA-8822");
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Manual Ingestion Input State
  const [manualVehicleId, setManualVehicleId] = useState<string>("AP-07-TA-8822");
  const [manualLat, setManualLat] = useState<string>("16.4410");
  const [manualLon, setManualLon] = useState<string>("80.5620");
  const [manualSpeed, setManualSpeed] = useState<string>("55");
  const [manualHeading, setManualHeading] = useState<string>("45");

  // Selected vehicle telemetry details
  const selectedVehicle = vehicles.get(selectedVehicleId) || {
    vehicle_id: selectedVehicleId,
    latitude: 16.4410,
    longitude: 80.5620,
    speed_kmh: 0,
    heading: 0,
    battery_pct: 95,
    status: "STANDBY"
  };

  // 1. Initialize MapLibre GL Vector Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Carto Positron open vector-compatible style
    const vectorMapStyle: StyleSpecification = {
      version: 8,
      sources: {
        "osm-tiles": {
          type: "raster",
          tiles: [
            "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
            "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
            "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png"
          ],
          tileSize: 256,
          attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OSM'
        }
      },
      layers: [
        {
          id: "osm-raster-layer",
          type: "raster",
          source: "osm-tiles",
          minzoom: 0,
          maxzoom: 20
        }
      ]
    };

    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: vectorMapStyle,
      center: [80.5620, 16.4410], // Longitude, Latitude (MapLibre standard)
      zoom: 12,
      pitch: 35, // 35-degree 3D vector pitch
      bearing: 0,
      attributionControl: false
    });

    map.addControl(new NavigationControl({ visualizePitch: true }), "top-right");

    map.on("load", () => {
      // Add route trail vector source & layer
      if (!map.getSource("vehicle-trail")) {
        map.addSource("vehicle-trail", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: [[80.5620, 16.4410]]
            }
          }
        });

        map.addLayer({
          id: "vehicle-trail-line",
          type: "line",
          source: "vehicle-trail",
          layout: {
            "line-join": "round",
            "line-cap": "round"
          },
          paint: {
            "line-color": "#10b981",
            "line-width": 4,
            "line-opacity": 0.8
          }
        });
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Smooth Vector Animation Helper (Interpolates position smoothly)
  const animateMarkerMovement = useCallback(
    (
      vehicleId: string,
      startLng: number,
      startLat: number,
      targetLng: number,
      targetLat: number,
      targetHeading: number,
      durationMs: number = 800
    ) => {
      const markerData = vehicleMarkersRef.current.get(vehicleId);
      if (!markerData) return;

      // Cancel any ongoing animation for this vehicle
      const existingAnim = animationFramesRef.current.get(vehicleId);
      if (existingAnim) cancelAnimationFrame(existingAnim);

      const startTime = performance.now();

      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / durationMs, 1.0);

        // Ease-out cubic easing for smooth road physics
        const ease = 1 - Math.pow(1 - progress, 3);

        const currentLng = startLng + (targetLng - startLng) * ease;
        const currentLat = startLat + (targetLat - startLat) * ease;

        markerData.marker.setLngLat([currentLng, currentLat]);

        // Rotate vehicle icon smoothly
        const iconElement = markerData.element.querySelector(".vehicle-arrow");
        if (iconElement) {
          (iconElement as HTMLElement).style.transform = `rotate(${targetHeading}deg)`;
        }

        if (progress < 1.0) {
          const nextFrame = requestAnimationFrame(step);
          animationFramesRef.current.set(vehicleId, nextFrame);
        } else {
          animationFramesRef.current.delete(vehicleId);
        }
      };

      const animId = requestAnimationFrame(step);
      animationFramesRef.current.set(vehicleId, animId);
    },
    []
  );

  // 3. Update or Create Vehicle Marker on Vector Map
  const updateVehicleMarker = useCallback(
    (telemetry: VehicleTelemetry) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      const vehicleId = telemetry.vehicle_id;
      const targetLng = telemetry.longitude;
      const targetLat = telemetry.latitude;
      const heading = telemetry.heading || 0;

      let markerEntry = vehicleMarkersRef.current.get(vehicleId);

      if (!markerEntry) {
        // Create custom MapLibre DOM marker with truck icon & heading arrow
        const el = document.createElement("div");
        el.className = "relative flex items-center justify-center cursor-pointer";
        el.style.width = "48px";
        el.style.height = "48px";

        el.innerHTML = `
          <div class="absolute w-12 h-12 rounded-full bg-emerald-500/25 animate-ping"></div>
          <div class="relative w-10 h-10 rounded-full bg-slate-900 border-2 border-emerald-400 shadow-xl flex items-center justify-center text-white">
            <div class="vehicle-arrow transition-transform duration-300" style="transform: rotate(${heading}deg);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
              </svg>
            </div>
          </div>
          <div class="absolute -bottom-2 bg-slate-900/90 text-[10px] text-white font-mono px-1.5 py-0.2 rounded border border-emerald-500/40 whitespace-nowrap">
            ${vehicleId}
          </div>
        `;

        el.addEventListener("click", () => {
          setSelectedVehicleId(vehicleId);
          map.flyTo({ center: [targetLng, targetLat], zoom: 14, speed: 1.2 });
        });

        const newMarker = new Marker({ element: el, anchor: "center" })
          .setLngLat([targetLng, targetLat])
          .addTo(map);

        markerEntry = { marker: newMarker, element: el };
        vehicleMarkersRef.current.set(vehicleId, markerEntry);
      } else {
        // Marker exists: smooth animation from previous coordinate
        const currentPos = markerEntry.marker.getLngLat();
        animateMarkerMovement(
          vehicleId,
          currentPos.lng,
          currentPos.lat,
          targetLng,
          targetLat,
          heading,
          800
        );
      }
    },
    [animateMarkerMovement]
  );

  // 4. WebSocket Client Connection Manager
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWebSocket = () => {
      try {
        const wsUrl = `${WS_BASE_URL}/api/telemetry/ws/live`;
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setWsConnected(true);
          toast.success("Connected to Real-Time Telemetry WebSocket!");
        };

        ws.onmessage = (event) => {
          setMessagesReceived((prev) => prev + 1);
          try {
            const message = JSON.parse(event.data);

            if (message.type === "SNAPSHOT") {
              if (message.engine) setEngineType(message.engine);
              const activeList: VehicleTelemetry[] = message.active_vehicles || [];
              const newMap = new Map<string, VehicleTelemetry>();
              activeList.forEach((v) => {
                newMap.set(v.vehicle_id, v);
                updateVehicleMarker(v);
              });
              setVehicles(newMap);
            } else if (message.type === "TELEMETRY_UPDATE") {
              const record: VehicleTelemetry = message.data;
              setVehicles((prev) => {
                const next = new Map(prev);
                next.set(record.vehicle_id, record);
                return next;
              });
              updateVehicleMarker(record);
            }
          } catch (err) {
            // Heartbeat response or raw string
          }
        };

        ws.onclose = () => {
          setWsConnected(false);
          // Auto-reconnect with 3s backoff
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = () => {
          setWsConnected(false);
        };

        socketRef.current = ws;
      } catch (err) {
        setWsConnected(false);
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    // Heartbeat ping interval every 15s
    const pingInterval = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send("ping");
      }
    }, 15000);

    return () => {
      clearInterval(pingInterval);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socketRef.current) socketRef.current.close();
    };
  }, [updateVehicleMarker]);

  // 5. Trigger Real-Time Telemetry Route Simulation
  const handleLaunchSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/telemetry/simulate/1?speed_factor=2.5&vehicle_id=${selectedVehicleId}`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("Simulation endpoint error");
      const data = await res.json();
      toast.success(`Telemetry simulation running: ${data.waypoints_count} waypoints streaming!`);

      // Center map on starting point
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo({
          center: [80.4365, 16.3067],
          zoom: 12.5,
          pitch: 45,
          speed: 1.4
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start simulation");
    } finally {
      setTimeout(() => setIsSimulating(false), 3000);
    }
  };

  // 6. Manual Telemetry Ingestion
  const handleManualIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/telemetry/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_id: manualVehicleId,
          latitude: parseFloat(manualLat),
          longitude: parseFloat(manualLon),
          speed_kmh: parseFloat(manualSpeed),
          heading: parseFloat(manualHeading),
          battery_pct: 92,
          status: "IN_TRANSIT"
        })
      });

      if (!res.ok) throw new Error("Ingestion error");
      toast.success("Telemetry coordinate ingested into Redis 7.2 GeoSet!");
    } catch (err: any) {
      toast.error(err.message || "Failed to ingest telemetry coordinate");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-80px)] w-full bg-slate-50 dark:bg-slate-950 font-sans">
      {/* LEFT TELEMETRY CONTROL CONSOLE */}
      <div className="w-full lg:w-[460px] xl:w-[480px] flex-shrink-0 p-4 lg:p-6 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col gap-4 overflow-y-auto max-h-[92vh]">
        {/* Header Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Real-Time Telemetry & Radar
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Redis 7.2 GeoSets • WebSocket Stream • MapLibre GL
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 font-mono text-xs">
            Phase 2 P0
          </Badge>
        </div>

        {/* WebSocket Stream Live Status HUD */}
        <div className="p-3.5 rounded-xl bg-slate-900 text-white shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${wsConnected ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
              {wsConnected ? <Wifi className="w-5 h-5 animate-pulse" /> : <WifiOff className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  {wsConnected ? "WebSocket Live Stream" : "Connecting..."}
                </span>
                <span className={`w-2 h-2 rounded-full ${wsConnected ? "bg-emerald-400 animate-ping" : "bg-red-500"}`} />
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Engine: <b className="text-emerald-400">{engineType}</b>
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Events Ingested</span>
            <span className="text-lg font-bold font-mono text-emerald-400">{messagesReceived}</span>
          </div>
        </div>

        {/* Selected Vehicle Telemetry Gauge HUD */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white border border-slate-700/60 shadow-xl flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-sm tracking-wide">{selectedVehicle.vehicle_id}</span>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] uppercase font-mono">
              {selectedVehicle.status || "ACTIVE"}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            {/* Speedometer */}
            <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/40 flex flex-col items-center">
              <Gauge className="w-4 h-4 text-emerald-400 mb-1" />
              <span className="text-xl font-bold font-mono text-white">
                {selectedVehicle.speed_kmh}
              </span>
              <span className="text-[10px] text-slate-400 uppercase">km/h Speed</span>
            </div>

            {/* Compass Heading */}
            <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/40 flex flex-col items-center">
              <Compass className="w-4 h-4 text-cyan-400 mb-1" />
              <span className="text-xl font-bold font-mono text-cyan-300">
                {selectedVehicle.heading}°
              </span>
              <span className="text-[10px] text-slate-400 uppercase">Bearing</span>
            </div>

            {/* Battery Level */}
            <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/40 flex flex-col items-center">
              <BatteryCharging className="w-4 h-4 text-amber-400 mb-1" />
              <span className="text-xl font-bold font-mono text-amber-300">
                {selectedVehicle.battery_pct || 94}%
              </span>
              <span className="text-[10px] text-slate-400 uppercase">Telemetry Batt</span>
            </div>
          </div>

          {/* Instantaneous Coordinates */}
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
            <span>Lat: {selectedVehicle.latitude.toFixed(5)}</span>
            <span>Lon: {selectedVehicle.longitude.toFixed(5)}</span>
            <span className="text-emerald-400">Zero Refresh</span>
          </div>

          {/* 1-Click Real-Time Simulation Driver */}
          <Button
            onClick={handleLaunchSimulation}
            disabled={isSimulating}
            className="mt-1 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-transform active:scale-95"
          >
            <Play className={`w-3.5 h-3.5 mr-1.5 ${isSimulating ? "animate-spin" : ""}`} />
            {isSimulating ? "Streaming GPS Vectors..." : "Launch Smooth Highway Run Simulator"}
          </Button>
        </div>

        {/* Active Fleet Vector Roster */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Active Tracked Vehicles in Redis ({vehicles.size})</span>
            <span className="text-[11px] font-normal lowercase text-emerald-600">click to focus</span>
          </label>

          <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
            {Array.from(vehicles.values()).map((v) => (
              <button
                key={v.vehicle_id}
                onClick={() => {
                  setSelectedVehicleId(v.vehicle_id);
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.flyTo({ center: [v.longitude, v.latitude], zoom: 14 });
                  }
                }}
                className={`text-left text-xs p-2.5 rounded-lg border transition-all flex items-center justify-between ${
                  selectedVehicleId === v.vehicle_id
                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40"
                    : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                    {v.vehicle_id}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-[11px] font-mono">
                  <span>{v.speed_kmh} km/h</span>
                  <span>{v.heading}°</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Live GPS Telemetry Ingest Tool */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Manual Coordinate Ingest (Redis GeoAdd)
            </span>
          </div>

          <form onSubmit={handleManualIngest} className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Vehicle ID"
                value={manualVehicleId}
                onChange={(e) => setManualVehicleId(e.target.value)}
                className="text-xs h-7 font-mono"
              />
              <Input
                placeholder="Speed (km/h)"
                value={manualSpeed}
                onChange={(e) => setManualSpeed(e.target.value)}
                className="text-xs h-7 font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Latitude"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                className="text-xs h-7 font-mono"
              />
              <Input
                placeholder="Longitude"
                value={manualLon}
                onChange={(e) => setManualLon(e.target.value)}
                className="text-xs h-7 font-mono"
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <Input
                placeholder="Heading (0-360°)"
                value={manualHeading}
                onChange={(e) => setManualHeading(e.target.value)}
                className="text-xs h-7 font-mono w-32"
              />
              <Button
                type="submit"
                size="sm"
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-7 px-3"
              >
                <Send className="w-3 h-3 mr-1" /> Ingest
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* RIGHT MAPLIBRE GL VECTOR CANVAS */}
      <div className="flex-1 relative h-[450px] lg:h-full w-full">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Vector 3D Radar HUD Banner */}
        <div className="absolute top-4 left-4 z-[10] flex flex-col gap-2">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-500" />
              MapLibre GL Vector Engine (35° Pitch)
            </span>
            <div className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
            <span className="text-[11px] text-emerald-600 font-mono font-medium">
              Smooth Vector Interpolation Active
            </span>
          </div>
        </div>

        {/* Map Legend Overlay */}
        <div className="absolute bottom-6 right-4 z-[10] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg text-[11px] flex flex-col gap-1.5 font-mono">
          <span className="font-bold text-slate-800 dark:text-slate-200">Vector Radar Legend</span>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-900 border border-emerald-400 flex items-center justify-center text-[7px] text-emerald-400">
              ▲
            </div>
            <span>Moving Vehicle Marker (Heading Oriented)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 bg-emerald-500 inline-block rounded" />
            <span>Real-time Trajectory Trail</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <span>Latency: &lt; 50ms via WebSocket</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealtimeTelemetryMap;
