import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';

interface OpenWeatherData {
    main: {
        temp: number;
        humidity: number;
        feels_like: number;
    };
    weather: {
        main: string;
        description: string;
    }[];
    wind: {
        speed: number;
    };
    visibility: number;
    name: string;
    sys: {
        country: string;
    };
}

interface OpenMeteoData {
    current: {
        weather_code: number;
        wind_speed_10m: number;
    };
    daily: {
        time: string[];
        uv_index_max: number[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        weather_code: number[];
        precipitation_probability_max: number[];
        rain_sum: number[];
    };
    hourly: {
        time: string[];
        temperature_2m: number[];
    };
}

export interface Alert {
    type: "warning" | "critical" | "info";
    title: string;
    message: string;
    time: string;
    severity: "Low" | "Medium" | "High";
    iconName: "CloudRain" | "Sun" | "Thermometer" | "Wind" | "Droplets" | "AlertTriangle";
}

interface AlertSettings {
    rain: boolean;
    temp: boolean;
    frost: boolean;
    wind: boolean;
}

interface WeatherContextType {
    weatherData: OpenWeatherData | null;
    forecastData: OpenMeteoData | null;
    locationName: string;
    location: { lat: number; lon: number } | null;
    loading: boolean;
    error: string | null;
    fetchWeatherByCity: (city: string) => void;
    useCurrentLocation: () => void;
    alerts: Alert[];
    alertSettings: AlertSettings;
    setAlertSettings: React.Dispatch<React.SetStateAction<AlertSettings>>;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

const OPENWEATHER_API_KEY = '5b88263f64d6c71a355d39ea646359c6';

export const WeatherProvider = ({ children }: { children: ReactNode }) => {
    const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
    const [locationName, setLocationName] = useState<string>('Loading...');
    const [weatherData, setWeatherData] = useState<OpenWeatherData | null>(null);
    const [forecastData, setForecastData] = useState<OpenMeteoData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Alert State
    const [alertSettings, setAlertSettings] = useState<AlertSettings>({
        rain: true,
        temp: true,
        frost: true,
        wind: false
    });

    // Generate Dynamic Alerts
    const alerts = useMemo(() => {
        if (!forecastData || !weatherData) return [];

        const generatedAlerts: Alert[] = [];

        // Check next 24 hours (today/tomorrow)
        const todayMaxTemp = forecastData.daily.temperature_2m_max?.[0] ?? 0;
        const todayMinTemp = forecastData.daily.temperature_2m_min?.[0] ?? 0;
        const rainProb = forecastData.daily.precipitation_probability_max?.[0] ?? 0;
        const windSpeed = forecastData.current?.wind_speed_10m ?? weatherData.wind.speed ?? 0; // Use current wind speed

        // 1. Heavy Rain Alert
        if (alertSettings.rain) {
            if (rainProb >= 70) {
                generatedAlerts.push({
                    type: "warning",
                    title: "Heavy Rain Warning",
                    message: `High chance of rain (${rainProb}%) today. Avoid outdoor spraying and protect sensitive crops.`,
                    time: "Forecast for today",
                    severity: "High",
                    iconName: "CloudRain"
                });
            } else if (rainProb >= 40) {
                generatedAlerts.push({
                    type: "warning",
                    title: "Rain Expected",
                    message: `Moderate chance of rain (${rainProb}%) today. Plan irrigation accordingly.`,
                    time: "Forecast for today",
                    severity: "Medium",
                    iconName: "CloudRain"
                });
            }
        }

        // 2. Temperature Alerts (Frost/Heat)
        if (alertSettings.frost && todayMinTemp <= 4) {
            generatedAlerts.push({
                type: "critical",
                title: "Frost Warning",
                message: `Temperatures dropping to ${todayMinTemp}°C. Risk of frost damage to crops.`,
                time: "Tonight",
                severity: "High",
                iconName: "Thermometer"
            });
        }

        if (alertSettings.temp && todayMaxTemp >= 35) {
            generatedAlerts.push({
                type: "critical",
                title: "High Heat Advisory",
                message: `Temperatures reaching ${todayMaxTemp}°C. Ensure adequate irrigation.`,
                time: "Today",
                severity: "High",
                iconName: "Sun"
            });
        }

        // 3. Wind Alerts
        if (alertSettings.wind && windSpeed >= 30) {
            generatedAlerts.push({
                type: "warning",
                title: "High Wind Alert",
                message: `Current wind speeds of ${windSpeed} km/h. Avoid spraying pesticides.`,
                time: "Current",
                severity: "High",
                iconName: "Wind"
            });
        }

        // 4. Ideal Conditions (Positive Alert)
        if (windSpeed < 15 && rainProb < 20 && todayMaxTemp > 15 && todayMaxTemp < 30) {
            generatedAlerts.push({
                type: "info",
                title: "Ideal Spraying Conditions",
                message: "Low wind and optimal temperatures for spraying/fertilizing.",
                time: "Current",
                severity: "Low",
                iconName: "Droplets"
            });
        }

        return generatedAlerts;
    }, [forecastData, weatherData, alertSettings]);

    const fetchWeatherByCoords = async (lat: number, lon: number) => {
        setLoading(true);
        setError(null);
        try {
            const [weatherRes, forecastRes] = await Promise.all([
                fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`),
                fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,daylight_duration,sunshine_duration,uv_index_max,uv_index_clear_sky_max,rain_sum,showers_sum,snowfall_sum,precipitation_sum,precipitation_hours,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,shortwave_radiation_sum,et0_fao_evapotranspiration&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation_probability,precipitation,rain,showers,snowfall,snow_depth,weather_code,pressure_msl,surface_pressure,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,visibility,evapotranspiration,et0_fao_evapotranspiration,vapour_pressure_deficit,wind_speed_10m,wind_speed_80m,wind_speed_120m,wind_speed_180m,wind_direction_10m,wind_direction_80m,wind_direction_120m,wind_direction_180m,wind_gusts_10m,temperature_80m,temperature_120m,temperature_180m,soil_temperature_0cm,soil_temperature_6cm,soil_temperature_18cm,soil_temperature_54cm,soil_moisture_0_to_1cm,soil_moisture_1_to_3cm,soil_moisture_3_to_9cm,soil_moisture_9_to_27cm,soil_moisture_27_to_81cm&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&forecast_days=16&timezone=auto`)
            ]);

            if (!weatherRes.ok || !forecastRes.ok) {
                throw new Error('Failed to fetch weather data from one or more sources.');
            }

            const current = await weatherRes.json();
            const forecast = await forecastRes.json();

            setLocationName(`${current.name}, ${current.sys.country}`);
            setWeatherData(current);
            setForecastData(forecast);

        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weather data.';
            setError(errorMessage);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchWeatherByCity = async (city: string) => {
        setLoading(true);
        setError(null);
        try {
            const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${OPENWEATHER_API_KEY}`);
            const geoData = await geoRes.json();
            if (geoData && geoData.length > 0) {
                const { lat, lon } = geoData[0];
                setLocation({ lat, lon });
                // The useEffect will trigger fetchWeatherByCoords
            } else {
                setError(`Could not find location: ${city}`);
                setLoading(false);
            }
        } catch (err) {
            setError('Failed to fetch location data.');
            console.error(err);
            setLoading(false);
        }
    };

    const useCurrentLocation = () => {
        setLoading(true);
        setError(null);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setLocation({ lat: latitude, lon: longitude });
                },
                () => {
                    setError('Geolocation permission denied. Please enter a location manually or grant permission.');
                    setLoading(false);
                    // Fallback to a default location if permission is denied
                    fetchWeatherByCity('Delhi');
                }
            );
        } else {
            setError('Geolocation is not supported by this browser.');
            setLoading(false);
            // Fallback to a default location
            fetchWeatherByCity('Delhi');
        }
    };

    useEffect(() => {
        if (location) {
            fetchWeatherByCoords(location.lat, location.lon);
        } else {
            // Call useCurrentLocation directly, not inside useEffect
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        // Persist location so dependent features (e.g., soil lookup) run
                        setLocation({ lat: latitude, lon: longitude });
                        fetchWeatherByCoords(latitude, longitude);
                    },
                    (error) => {
                        console.error('Error getting location:', error);
                        setError('Unable to get your location. Using default location.');
                        setLoading(false);
                        fetchWeatherByCity('Delhi');
                    }
                );
            } else {
                setError('Geolocation is not supported by this browser.');
                setLoading(false);
                fetchWeatherByCity('Delhi');
            }
        }
    }, [location]);

    const value = {
        weatherData,
        forecastData,
        locationName,
        location,
        loading,
        error,
        fetchWeatherByCity,
        useCurrentLocation,
        alerts,
        alertSettings,
        setAlertSettings
    };

    return <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>;
};

export const useWeather = () => {
    const context = useContext(WeatherContext);
    if (context === undefined) {
        throw new Error('useWeather must be used within a WeatherProvider');
    }
    return context;
};