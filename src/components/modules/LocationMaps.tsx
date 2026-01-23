import React, { useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface LocationMapsProps {
    lat?: number;
    lon?: number;
}

const LocationMaps: React.FC<LocationMapsProps> = ({ lat, lon }) => {
    const mapRef1 = useRef<HTMLDivElement>(null);
    const mapRef2 = useRef<HTMLDivElement>(null);

    // OpenWeatherMap API Key (reused from WeatherContext)
    const OWM_API_KEY = '5b88263f64d6c71a355d39ea646359c6';

    useEffect(() => {
        if (!lat || !lon) return;

        const loader = new Loader({
            apiKey: "", // Dev purposes only (works with warnings or constrained use)
            version: "weekly",
            libraries: ["places"]
        });

        loader.load().then(() => {
            const mapOptions = {
                center: { lat, lng: lon },
                zoom: 12, // Slightly zoomed out to see weather patterns
                disableDefaultUI: true,
                scene: {
                    // attempting to force a specific style if possible, but basic types work best
                }
            };

            const addMarker = (map: google.maps.Map, title: string) => {
                new google.maps.Marker({
                    position: { lat, lng: lon },
                    map: map,
                    title: title
                });
            };

            // --- Map 1: Environmental (Air, Moisture, etc.) ---
            if (mapRef1.current) {
                const map1 = new google.maps.Map(mapRef1.current, {
                    ...mapOptions,
                    mapTypeId: 'terrain', // Good base for environmental data
                });

                // Add OpenWeatherMap Tile Layers
                // Layer for Precipitation (Moisture)
                const precipLayer = new google.maps.ImageMapType({
                    getTileUrl: function (coord, zoom) {
                        return `https://tile.openweathermap.org/map/precipitation_new/${zoom}/${coord.x}/${coord.y}.png?appid=${OWM_API_KEY}`;
                    },
                    tileSize: new google.maps.Size(256, 256),
                    opacity: 0.6,
                    name: "Precipitation"
                });

                // Layer for Temperature (Air representation) or Clouds
                // Using Clouds for "Air" visual
                const cloudsLayer = new google.maps.ImageMapType({
                    getTileUrl: function (coord, zoom) {
                        return `https://tile.openweathermap.org/map/clouds_new/${zoom}/${coord.x}/${coord.y}.png?appid=${OWM_API_KEY}`;
                    },
                    tileSize: new google.maps.Size(256, 256),
                    opacity: 0.4,
                    name: "Clouds"
                });

                // Overlay layers
                map1.overlayMapTypes.push(precipLayer);
                map1.overlayMapTypes.push(cloudsLayer);

                addMarker(map1, "Environmental Data");
            }

            // --- Map 2: Satellite (User Location) ---
            if (mapRef2.current) {
                const map2 = new google.maps.Map(mapRef2.current, {
                    ...mapOptions,
                    zoom: 18, // High zoom for satellite detail
                    mapTypeId: 'satellite',
                });
                addMarker(map2, "Your Location");
            }

        }).catch(e => {
            console.error("Error loading maps:", e);
        });

    }, [lat, lon]);

    if (!lat || !lon) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 h-[400px] w-full bg-muted/20 p-2 rounded-xl border border-border">
            {/* Map 1: Environmental */}
            <div className="relative rounded-lg overflow-hidden border border-border shadow-sm group h-full">
                <div ref={mapRef1} className="w-full h-full" />
                <div className="absolute top-2 left-2 bg-background/80 backdrop-blur px-3 py-1.5 rounded-md text-sm font-semibold shadow-sm border border-border/50">
                    <span className="text-blue-500 mr-2">●</span>Environmental (Air & Moisture)
                </div>
            </div>

            {/* Map 2: Satellite */}
            <div className="relative rounded-lg overflow-hidden border border-border shadow-sm group h-full">
                <div ref={mapRef2} className="w-full h-full" />
                <div className="absolute top-2 left-2 bg-background/80 backdrop-blur px-3 py-1.5 rounded-md text-sm font-semibold shadow-sm border border-border/50">
                    <span className="text-red-500 mr-2">●</span>Satellite View
                </div>
            </div>
        </div>
    );
};

export default LocationMaps;
