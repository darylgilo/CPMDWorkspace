<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class WeatherController extends Controller
{
    public function getWeather(Request $request)
    {
        $lat = $request->input('lat');
        $lon = $request->input('lon');
        
        if (!$lat || !$lon) {
            return response()->json(['error' => 'Location required'], 400);
        }

        // Create cache key based on coordinates (rounded to reduce API calls)
        $cacheKey = "weather_" . round($lat, 2) . "_" . round($lon, 2);
        
        // Cache for 30 minutes to reduce API calls
        $weatherData = Cache::remember($cacheKey, 1800, function () use ($lat, $lon) {
            $apiKey = env('OPENWEATHER_API_KEY');
            
            if (!$apiKey) {
                return $this->getSampleData();
            }

            try {
                // Current weather
                $currentResponse = Http::get("https://api.openweathermap.org/data/2.5/weather", [
                    'lat' => $lat,
                    'lon' => $lon,
                    'appid' => $apiKey,
                    'units' => 'metric'
                ]);

                if (!$currentResponse->successful()) {
                    return $this->getSampleData();
                }

                $currentData = $currentResponse->json();

                // 5-day forecast
                $forecastResponse = Http::get("https://api.openweathermap.org/data/2.5/forecast", [
                    'lat' => $lat,
                    'lon' => $lon,
                    'appid' => $apiKey,
                    'units' => 'metric'
                ]);

                $forecastData = $forecastResponse->successful() ? $forecastResponse->json() : null;

                // We need to fetch the city name explicitly using OpenWeather's Reverse Geocoding API 
                // because the weather API often returns the barangay/neighborhood name instead.
                $geoResponse = Http::get("http://api.openweathermap.org/geo/1.0/reverse", [
                    'lat' => $lat,
                    'lon' => $lon,
                    'limit' => 1,
                    'appid' => $apiKey
                ]);

                $cityName = $currentData['name'];
                if ($geoResponse->successful()) {
                    $geoData = $geoResponse->json();
                    if (!empty($geoData) && isset($geoData[0]['name'])) {
                        // Use the city name from reverse geocoding, 
                        // fallback to currentData['name'] if not available
                        $cityName = $geoData[0]['name'];
                        
                        // Optionally append state/province if available to distinguish
                        // e.g. "Manila" instead of "Maytubig"
                        if (isset($geoData[0]['state']) && $geoData[0]['state'] != $cityName) {
                            $cityName = $cityName . ', ' . $geoData[0]['state'];
                        }
                    }
                }

                return [
                    'location' => $cityName,
                    'temperature' => round($currentData['main']['temp']),
                    'condition' => $currentData['weather'][0]['main'],
                    'humidity' => $currentData['main']['humidity'],
                    'windSpeed' => $currentData['wind']['speed'],
                    'icon' => $currentData['weather'][0]['icon'],
                    'forecast' => $this->processForecastData($forecastData)
                ];
            } catch (\Exception $e) {
                return $this->getSampleData();
            }
        });

        return response()->json($weatherData);
    }

    private function processForecastData($forecastData)
    {
        if (!$forecastData) {
            return [];
        }

        $dailyForecasts = [];
        $processedDays = [];

        foreach ($forecastData['list'] as $item) {
            $date = new \DateTime($item['dt_txt']);
            $dayName = $date->format('D');
            
            if (!in_array($dayName, $processedDays) && count($dailyForecasts) < 5) {
                $processedDays[] = $dayName;
                $dailyForecasts[] = [
                    'day' => $dayName,
                    'high' => round($item['main']['temp_max']),
                    'low' => round($item['main']['temp_min']),
                    'condition' => $item['weather'][0]['main'],
                    'icon' => $item['weather'][0]['icon']
                ];
            }
        }
        
        return $dailyForecasts;
    }

    private function getSampleData()
    {
        return [
            'location' => 'Manila, Philippines',
            'temperature' => 28,
            'condition' => 'Partly Cloudy',
            'humidity' => 75,
            'windSpeed' => 12,
            'icon' => '02d',
            'forecast' => [
                ['day' => 'Mon', 'high' => 30, 'low' => 24, 'condition' => 'Sunny', 'icon' => '01d'],
                ['day' => 'Tue', 'high' => 29, 'low' => 23, 'condition' => 'Cloudy', 'icon' => '02d'],
                ['day' => 'Wed', 'high' => 27, 'low' => 22, 'condition' => 'Rainy', 'icon' => '10d'],
                ['day' => 'Thu', 'high' => 28, 'low' => 23, 'condition' => 'Partly Cloudy', 'icon' => '02d'],
                ['day' => 'Fri', 'high' => 30, 'low' => 25, 'condition' => 'Sunny', 'icon' => '01d'],
            ]
        ];
    }
}
