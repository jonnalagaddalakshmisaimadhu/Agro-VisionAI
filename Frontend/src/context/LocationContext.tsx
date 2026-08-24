import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWeather } from '@/components/dashboard/WeatherContext';

interface LocationData {
  locationName: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
  weatherData?: unknown;
  lastUpdated: Date;
}

interface LocationContextType {
  locationData: LocationData | null;
  updateLocation: (location: string, coordinates?: { lat: number; lon: number }) => void;
  clearLocation: () => void;
  isLoading: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const { locationName, weatherData, loading } = useWeather();
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sync with weather context
  useEffect(() => {
    if (locationName && locationName !== 'Loading...') {
      setLocationData(prev => ({
        locationName,
        coordinates: prev?.coordinates,
        weatherData,
        lastUpdated: new Date()
      }));
    }
  }, [locationName, weatherData]);

  const updateLocation = (location: string, coordinates?: { lat: number; lon: number }) => {
    setLocationData({
      locationName: location,
      coordinates,
      weatherData,
      lastUpdated: new Date()
    });
  };

  const clearLocation = () => {
    setLocationData(null);
  };

  const value = {
    locationData,
    updateLocation,
    clearLocation,
    isLoading: loading
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
