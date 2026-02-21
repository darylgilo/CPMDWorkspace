import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cloud, CloudRain, Sun, Wind, Droplets, Thermometer, MapPin } from 'lucide-react';

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  icon: string;
  forecast: {
    day: string;
    high: number;
    low: number;
    condition: string;
    icon: string;
  }[];
}

const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWeatherData();
  }, []);

  const fetchWeatherData = async () => {
    setLoading(true);
    try {
      // Get user's location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            await fetchWeatherByCoords(latitude, longitude);
          },
          async () => {
            // Fallback to Manila if location access denied
            await fetchWeatherByCity('Manila,PH');
          }
        );
      } else {
        // Fallback to Manila if geolocation not supported
        await fetchWeatherByCity('Manila,PH');
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
      setError('Unable to fetch weather data');
      // Set sample data as fallback
      setSampleData();
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherByCoords = async (lat: number, lon: number) => {
    // Using backend API to fetch weather data (more efficient for multiple users)
    // The backend handles API key management and caching
    try {
      const response = await fetch(
        `/api/weather?lat=${lat}&lon=${lon}`
      );

      if (!response.ok) {
        throw new Error('Weather API request failed');
      }

      const data = await response.json();

      setWeather({
        location: data.location,
        temperature: data.temperature,
        condition: data.condition,
        humidity: data.humidity,
        windSpeed: data.windSpeed,
        icon: data.icon,
        forecast: data.forecast
      });
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setSampleData();
    }
  };

  const fetchWeatherByCity = async (city: string) => {
    // Fallback implementation with sample data
    setSampleData();
  };

  const setSampleData = () => {
    setWeather({
      location: 'Manila, Philippines',
      temperature: 28,
      condition: 'Partly Cloudy',
      humidity: 75,
      windSpeed: 12,
      icon: '02d',
      forecast: [
        { day: 'Mon', high: 30, low: 24, condition: 'Sunny', icon: '01d' },
        { day: 'Tue', high: 29, low: 23, condition: 'Cloudy', icon: '02d' },
        { day: 'Wed', high: 27, low: 22, condition: 'Rainy', icon: '10d' },
        { day: 'Thu', high: 28, low: 23, condition: 'Partly Cloudy', icon: '02d' },
        { day: 'Fri', high: 30, low: 25, condition: 'Sunny', icon: '01d' },
      ]
    });
  };

  const processForecastData = (forecastData: any) => {
    // Process 5-day forecast from API response
    const dailyForecasts: {
      day: string;
      high: number;
      low: number;
      condition: string;
      icon: string;
    }[] = [];
    const processedDays = new Set<string>();

    forecastData.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

      if (!processedDays.has(dayName) && dailyForecasts.length < 5) {
        processedDays.add(dayName);
        dailyForecasts.push({
          day: dayName,
          high: Math.round(item.main.temp_max),
          low: Math.round(item.main.temp_min),
          condition: item.weather[0].main,
          icon: item.weather[0].icon
        });
      }
    });

    return dailyForecasts;
  };

  const getWeatherIcon = (condition: string, icon: string) => {
    if (condition.toLowerCase().includes('rain') || icon.includes('10')) {
      return <CloudRain className="h-6 w-6 text-blue-500" />;
    } else if (condition.toLowerCase().includes('cloud') || icon.includes('02') || icon.includes('03') || icon.includes('04')) {
      return <Cloud className="h-6 w-6 text-gray-500" />;
    } else {
      return <Sun className="h-6 w-6 text-yellow-500" />;
    }
  };

  if (loading) {
    return (
      <Card className="w-full bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Cloud className="h-5 w-5 text-[#163832]" />
            Weather
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-16">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !weather) {
    return (
      <Card className="w-full bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Cloud className="h-5 w-5 text-[#163832]" />
            Weather
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 dark:text-gray-400 py-2">
            <Cloud className="h-6 w-6 mx-auto mb-1 opacity-50" />
            <p className="text-xs">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 shadow-md hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Cloud className="h-5 w-5 text-[#163832]" />
          Weather
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        {weather && (
          <div className="space-y-3">
            {/* Current Weather */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <MapPin className="h-3 w-3" />
                  {weather.location}
                </div>
                <div className="text-xl font-bold dark:text-gray-100">{weather.temperature}°C</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{weather.condition}</div>
              </div>
              <div>
                {getWeatherIcon(weather.condition, weather.icon)}
              </div>
            </div>

            {/* Weather Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-1">
                <Droplets className="h-3 w-3 text-blue-500" />
                <span className="text-gray-600 dark:text-gray-400">Humidity:</span>
                <span className="font-medium dark:text-gray-200">{weather.humidity}%</span>
              </div>
              <div className="flex items-center gap-1">
                <Wind className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">Wind:</span>
                <span className="font-medium dark:text-gray-200">{weather.windSpeed} km/h</span>
              </div>
            </div>

            {/* 5-Day Forecast */}
            <div className="space-y-1">
              <h4 className="font-semibold text-xs">5-Day Forecast</h4>
              <div className="grid grid-cols-5 gap-1 text-xs">
                {weather.forecast.map((day, index) => (
                  <div key={index} className="text-center">
                    <div className="font-medium">{day.day}</div>
                    <div className="flex justify-center my-0.5">
                      {getWeatherIcon(day.condition, day.icon)}
                    </div>
                    <div className="text-xs font-medium">
                      <div className="text-gray-900 dark:text-gray-100">{day.high}°</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeatherWidget;
