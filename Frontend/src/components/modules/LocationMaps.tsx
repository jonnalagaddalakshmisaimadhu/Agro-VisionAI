import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useWeather } from '@/components/dashboard/WeatherContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Layers,
  MapPin,
  Maximize2,
  Minimize2,
  Crosshair,
  ExternalLink,
  CloudRain,
  Cloud,
  Thermometer,
  Wind,
  Satellite,
  Sparkles
} from 'lucide-react';

interface LocationMapsProps {
  lat?: number;
  lon?: number;
  locationName?: string;
  height?: string;
  className?: string;
}

type BaseLayerType = 'google-hybrid' | 'google-satellite' | 'esri-satellite' | 'osm';
type OverlayLayerType = 'none' | 'precipitation' | 'clouds' | 'temp' | 'wind';

const OWM_API_KEY = '5b88263f64d6c71a355d39ea646359c6';

const LocationMaps: React.FC<LocationMapsProps> = ({
  lat: propLat,
  lon: propLon,
  locationName: propLocationName,
  height = '360px',
  className = ''
}) => {
  const { location: weatherLocation, locationName: weatherLocationName, weatherData } = useWeather();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const overlayTileLayerRef = useRef<L.TileLayer | null>(null);

  const [activeBaseLayer, setActiveBaseLayer] = useState<BaseLayerType>('google-hybrid');
  const [activeOverlay, setActiveOverlay] = useState<OverlayLayerType>('none');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(14);

  // Determine active coordinates with fallbacks
  const lat = propLat ?? weatherLocation?.lat ?? 28.6139; // Default Delhi
  const lon = propLon ?? weatherLocation?.lon ?? 77.2090;
  const locationName = propLocationName || weatherLocationName || 'Farm Plot';

  // Base tile layer URLs
  const getBaseLayer = (type: BaseLayerType): L.TileLayer => {
    switch (type) {
      case 'google-hybrid':
        return L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
          subdomains: ['0', '1', '2', '3'],
          maxZoom: 20,
          attribution: 'Imagery &copy; Google Maps'
        });
      case 'google-satellite':
        return L.tileLayer('https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
          subdomains: ['0', '1', '2', '3'],
          maxZoom: 20,
          attribution: 'Imagery &copy; Google Maps'
        });
      case 'esri-satellite':
        return L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          {
            maxZoom: 19,
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS'
          }
        );
      case 'osm':
      default:
        return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors'
        });
    }
  };

  // Weather overlay tile layer
  const getOverlayLayer = (type: OverlayLayerType): L.TileLayer | null => {
    if (type === 'none') return null;

    let layerName = 'precipitation_new';
    let opacity = 0.65;

    if (type === 'precipitation') {
      layerName = 'precipitation_new';
      opacity = 0.65;
    } else if (type === 'clouds') {
      layerName = 'clouds_new';
      opacity = 0.5;
    } else if (type === 'temp') {
      layerName = 'temp_new';
      opacity = 0.55;
    } else if (type === 'wind') {
      layerName = 'wind_new';
      opacity = 0.55;
    }

    return L.tileLayer(
      `https://tile.openweathermap.org/map/${layerName}/{z}/{x}/{y}.png?appid=${OWM_API_KEY}`,
      {
        opacity,
        maxZoom: 19,
        attribution: 'Weather &copy; OpenWeatherMap'
      }
    );
  };

  // Create custom animated farm marker
  const createFarmMarkerIcon = () => {
    return L.divIcon({
      className: 'custom-farm-pin',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
          <div style="position: absolute; width: 36px; height: 36px; background-color: rgba(34, 197, 94, 0.4); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; width: 32px; height: 32px; background: linear-gradient(135deg, #10b981, #047857); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.3); border: 2.5px solid white;">
            <svg style="width: 18px; height: 18px; color: white;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 2v20m0-20c-4.418 0-8 3.582-8 8 0 5.25 8 12 8 12s8-6.75 8-12c0-4.418-3.582-8-8-8z" />
            </svg>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18]
    });
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [lat, lon],
        zoom: 14,
        zoomControl: false,
        attributionControl: false
      });

      // Add Base Layer
      const baseLayer = getBaseLayer(activeBaseLayer);
      baseLayer.addTo(map);
      baseTileLayerRef.current = baseLayer;

      // Add Marker
      const marker = L.marker([lat, lon], {
        icon: createFarmMarkerIcon(),
        title: locationName
      }).addTo(map);

      const popupContent = `
        <div style="font-family: system-ui, -apple-system, sans-serif; padding: 4px;">
          <div style="font-weight: 700; font-size: 14px; color: #1e293b; margin-bottom: 2px;">
            🌾 ${locationName}
          </div>
          <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">
            GPS: ${lat.toFixed(4)}°, ${lon.toFixed(4)}°
          </div>
          ${weatherData ? `
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 6px; font-size: 11px; color: #166534;">
              🌡️ <b>${Math.round(weatherData.main.temp)}°C</b> | 💧 <b>${weatherData.main.humidity}%</b> Humidity
            </div>
          ` : ''}
          <div style="margin-top: 8px; text-align: right;">
            <a href="https://www.google.com/maps/@?api=1&map_action=map&center=${lat},${lon}&zoom=16&basemap=satellite" target="_blank" rel="noopener noreferrer" style="color: #2563eb; font-size: 11px; font-weight: 600; text-decoration: none;">
              Open in Google Maps &rarr;
            </a>
          </div>
        </div>
      `;
      marker.bindPopup(popupContent);
      markerRef.current = marker;

      // Track zoom level
      map.on('zoomend', () => {
        setCurrentZoom(map.getZoom());
      });

      mapInstanceRef.current = map;

      // Ensure tiles render cleanly without delay
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    }

    return () => {
      // Clean up on component unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map view & marker when lat/lon changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.setView([lat, lon], map.getZoom() || 14);

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lon]);
      markerRef.current.setPopupContent(`
        <div style="font-family: system-ui, -apple-system, sans-serif; padding: 4px;">
          <div style="font-weight: 700; font-size: 14px; color: #1e293b; margin-bottom: 2px;">
            🌾 ${locationName}
          </div>
          <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">
            GPS: ${lat.toFixed(4)}°, ${lon.toFixed(4)}°
          </div>
          <div style="margin-top: 6px;">
            <a href="https://www.google.com/maps/@?api=1&map_action=map&center=${lat},${lon}&zoom=16&basemap=satellite" target="_blank" rel="noopener noreferrer" style="color: #2563eb; font-size: 11px; font-weight: 600; text-decoration: none;">
              Open in Google Maps &rarr;
            </a>
          </div>
        </div>
      `);
    }

    map.invalidateSize();
  }, [lat, lon, locationName]);

  // Update Base Layer when changed
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
    }

    const newBase = getBaseLayer(activeBaseLayer);
    newBase.addTo(map);
    baseTileLayerRef.current = newBase;

    // Keep overlay on top if present
    if (overlayTileLayerRef.current) {
      overlayTileLayerRef.current.bringToFront();
    }
  }, [activeBaseLayer]);

  // Update Overlay Layer when changed
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (overlayTileLayerRef.current) {
      map.removeLayer(overlayTileLayerRef.current);
      overlayTileLayerRef.current = null;
    }

    const newOverlay = getOverlayLayer(activeOverlay);
    if (newOverlay) {
      newOverlay.addTo(map);
      newOverlay.bringToFront();
      overlayTileLayerRef.current = newOverlay;
    }
  }, [activeOverlay]);

  // Handler for recentering
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lon], 16, { duration: 1.2 });
      if (markerRef.current) {
        markerRef.current.openPopup();
      }
    }
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 300);
  };

  return (
    <div
      className={`relative w-full rounded-xl overflow-hidden border border-border shadow-md bg-slate-950 ${
        isFullscreen ? 'fixed inset-4 z-50 h-[calc(100vh-2rem)]' : className
      }`}
      style={{ height: isFullscreen ? 'calc(100vh - 2rem)' : height }}
    >
      {/* Map Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Header Floating Bar */}
      <div className="absolute top-2 left-2 right-2 flex flex-wrap items-center justify-between gap-2 z-10 pointer-events-none">
        {/* Location & Status HUD */}
        <div className="flex items-center gap-1.5 bg-background/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-border/80 shadow-sm pointer-events-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-xs text-foreground truncate max-w-[160px] sm:max-w-[240px]">
            {locationName}
          </span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/30 text-emerald-600 bg-emerald-500/10 font-mono">
            {lat.toFixed(3)}°, {lon.toFixed(3)}°
          </Badge>
        </div>

        {/* Action Buttons: Fullscreen & External Google Maps */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 px-2.5 text-xs bg-background/90 backdrop-blur-md hover:bg-background border border-border/80 shadow-sm gap-1"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
          </Button>

          <a
            href={`https://www.google.com/maps/@?api=1&map_action=map&center=${lat},${lon}&zoom=17&basemap=satellite`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 h-8 px-2.5 text-xs font-medium bg-background/90 backdrop-blur-md hover:bg-background text-foreground rounded-md border border-border/80 shadow-sm transition-colors"
            title="Open in Official Google Maps"
          >
            <ExternalLink className="h-3.5 w-3.5 text-blue-500" />
            <span className="hidden sm:inline">Google Maps</span>
          </a>
        </div>
      </div>

      {/* Layer Selection Chips (Top Center / Under HUD) */}
      <div className="absolute top-12 left-2 z-10 flex flex-wrap gap-1 pointer-events-auto bg-background/85 backdrop-blur-md p-1 rounded-lg border border-border/70 shadow-sm max-w-[calc(100%-1rem)]">
        <button
          type="button"
          onClick={() => setActiveBaseLayer('google-hybrid')}
          className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded transition-all ${
            activeBaseLayer === 'google-hybrid'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Satellite className="h-3 w-3" />
          <span>🛰️ Google Satellite</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveBaseLayer('google-satellite')}
          className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded transition-all ${
            activeBaseLayer === 'google-satellite'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <span>📸 Pure Satellite</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveBaseLayer('esri-satellite')}
          className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded transition-all ${
            activeBaseLayer === 'esri-satellite'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <span>🌾 Esri Field</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveBaseLayer('osm')}
          className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded transition-all ${
            activeBaseLayer === 'osm'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <span>🗺️ Street Map</span>
        </button>
      </div>

      {/* Weather Overlay Controls (Bottom Left) */}
      <div className="absolute bottom-2 left-2 z-10 flex flex-wrap items-center gap-1 bg-background/90 backdrop-blur-md p-1 rounded-lg border border-border/80 shadow-md">
        <span className="text-[10px] font-semibold text-muted-foreground px-1.5 flex items-center gap-1">
          <Layers className="h-3 w-3" /> Overlays:
        </span>

        <button
          type="button"
          onClick={() => setActiveOverlay(activeOverlay === 'precipitation' ? 'none' : 'precipitation')}
          className={`flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded transition-all ${
            activeOverlay === 'precipitation'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <CloudRain className="h-3 w-3" />
          <span>🌧️ Rain Radar</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveOverlay(activeOverlay === 'clouds' ? 'none' : 'clouds')}
          className={`flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded transition-all ${
            activeOverlay === 'clouds'
              ? 'bg-slate-600 text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Cloud className="h-3 w-3" />
          <span>☁️ Clouds</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveOverlay(activeOverlay === 'temp' ? 'none' : 'temp')}
          className={`flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded transition-all ${
            activeOverlay === 'temp'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Thermometer className="h-3 w-3" />
          <span>🌡️ Thermal</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveOverlay(activeOverlay === 'wind' ? 'none' : 'wind')}
          className={`flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded transition-all ${
            activeOverlay === 'wind'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Wind className="h-3 w-3" />
          <span>💨 Wind</span>
        </button>
      </div>

      {/* Floating Zoom & Recenter Controls (Bottom Right) */}
      <div className="absolute bottom-2 right-2 z-10 flex flex-col gap-1.5">
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8 bg-background/90 backdrop-blur-md hover:bg-background border border-border shadow-md text-foreground"
          onClick={handleRecenter}
          title="Recenter to Farm Pin"
        >
          <Crosshair className="h-4 w-4 text-emerald-600" />
        </Button>

        <div className="flex flex-col rounded-md overflow-hidden border border-border shadow-md bg-background/90 backdrop-blur-md">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-8 rounded-none text-foreground hover:bg-muted font-bold text-sm"
            onClick={handleZoomIn}
            title="Zoom In"
          >
            +
          </Button>
          <div className="h-[1px] bg-border w-full" />
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-8 rounded-none text-foreground hover:bg-muted font-bold text-sm"
            onClick={handleZoomOut}
            title="Zoom Out"
          >
            -
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LocationMaps;
