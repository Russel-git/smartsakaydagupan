const axios = require('axios');
const NodeCache = require('node-cache');
const config = require('../config/env');

const weatherCache = new NodeCache({ stdTTL: 900 }); // 15 minutes TTL

// Map WMO codes from Open-Meteo to readable descriptions and icons
const mapWmoCode = (code) => {
  if (code === 0) return { text: 'Clear Sky', icon: '//cdn.weatherapi.com/weather/64x64/day/113.png' };
  if (code === 1) return { text: 'Mainly Clear', icon: '//cdn.weatherapi.com/weather/64x64/day/116.png' };
  if (code === 2) return { text: 'Partly Cloudy', icon: '//cdn.weatherapi.com/weather/64x64/day/116.png' };
  if (code === 3) return { text: 'Overcast', icon: '//cdn.weatherapi.com/weather/64x64/day/122.png' };
  if (code >= 45 && code <= 48) return { text: 'Foggy', icon: '//cdn.weatherapi.com/weather/64x64/day/143.png' };
  if (code >= 51 && code <= 55) return { text: 'Light Drizzle', icon: '//cdn.weatherapi.com/weather/64x64/day/266.png' };
  if (code >= 61 && code <= 65) return { text: 'Rain', icon: '//cdn.weatherapi.com/weather/64x64/day/296.png' };
  if (code >= 80 && code <= 82) return { text: 'Rain Showers', icon: '//cdn.weatherapi.com/weather/64x64/day/353.png' };
  if (code >= 95) return { text: 'Thunderstorm', icon: '//cdn.weatherapi.com/weather/64x64/day/389.png' };
  return { text: 'Partly Cloudy', icon: '//cdn.weatherapi.com/weather/64x64/day/116.png' };
};

const generateAdvisories = (tempC, windKph, conditionText, precipitation = 0, rainChance = 0) => {
  const advisories = [];
  const textLower = (conditionText || '').toLowerCase();

  if (textLower.includes('thunder') || textLower.includes('storm')) {
    advisories.push('⛈️ Thunderstorms detected over Dagupan City — take shelter and anticipate road waterlogging near Lucao & Downtown.');
  } else if (textLower.includes('rain') || textLower.includes('drizzle') || textLower.includes('shower') || precipitation > 0 || rainChance >= 60) {
    advisories.push(`🌧️ Wet road conditions in Dagupan City${precipitation > 0 ? ` (${precipitation}mm rainfall)` : ''} — carry an umbrella and allow extra travel time.`);
  }
  if (windKph > 35) {
    advisories.push(`💨 Strong coastal winds (${windKph} km/h) in Dagupan — exercise caution near open transport terminals and on tricycles.`);
  }
  if (tempC > 34) {
    advisories.push(`☀️ High heat index (${tempC}°C) — stay hydrated and seek shaded waiting sheds at jeepney stops.`);
  }
  return advisories.length > 0 ? advisories : ['Favorable commuting weather in Dagupan City.'];
};

const formatWeatherData = ({ tempC, conditionText, icon, humidity, windKph, feelsLikeC, precipitation = 0, currentHourPrecipitationProbability = null, forecastDays, alerts = [] }) => {
  const roundedTemp = Math.round(tempC);
  const roundedFeels = Math.round(feelsLikeC);
  const roundedWind = Math.round(windKph);

  const formattedForecast = (forecastDays || []).map((day) => {
    const maxT = Math.round(day.maxTempC);
    const minT = Math.round(day.minTempC);
    return {
      date: day.date,
      maxTempC: maxT,
      maxtemp_c: maxT,
      minTempC: minT,
      mintemp_c: minT,
      condition: day.conditionText,
      conditionText: day.conditionText,
      icon: day.icon,
      chanceOfRain: day.chanceOfRain ?? 20,
      day: {
        maxtemp_c: maxT,
        mintemp_c: minT,
        condition: {
          text: day.conditionText,
          icon: day.icon,
        },
        daily_chance_of_rain: day.chanceOfRain ?? 20,
      },
    };
  });

  return {
    current: {
      tempC: roundedTemp,
      temp_c: roundedTemp,
      condition: conditionText,
      conditionText: conditionText,
      icon: icon || '//cdn.weatherapi.com/weather/64x64/day/116.png',
      humidity: humidity || 75,
      windKph: roundedWind,
      wind_kph: roundedWind,
      feelsLikeC: roundedFeels,
      feelslike_c: roundedFeels,
      precipitation: Number(precipitation) || 0,
      rainChance: currentHourPrecipitationProbability ?? 20,
      coordinates: { latitude: 16.0433, longitude: 120.3397, location: 'Dagupan City, Pangasinan' },
      lastUpdated: new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
    },
    forecast: formattedForecast,
    alerts,
    travelAdvisory: generateAdvisories(roundedTemp, roundedWind, conditionText, precipitation, currentHourPrecipitationProbability),
  };
};

const fetchFromOpenMeteo = async () => {
  const targetUrl = config.weather?.apiUrl || 'https://api.open-meteo.com/v1/forecast?latitude=16.0433&longitude=120.3397&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,apparent_temperature,wind_speed_10m&hourly=precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FManila';

  const response = await axios.get(targetUrl, { timeout: 8000 });
  const cur = response.data.current || {};
  const daily = response.data.daily || {};
  const hourly = response.data.hourly || {};
  const wmo = mapWmoCode(cur.weather_code);

  // Extract current hour precipitation probability if hourly data exists
  let currentHourPrecipitationProbability = null;
  if (Array.isArray(hourly.time) && Array.isArray(hourly.precipitation_probability)) {
    const nowIso = new Date().toISOString().slice(0, 13); // 'YYYY-MM-DDTHH'
    const matchIdx = hourly.time.findIndex((t) => t.startsWith(nowIso));
    if (matchIdx !== -1) {
      currentHourPrecipitationProbability = hourly.precipitation_probability[matchIdx];
    }
  }

  const forecastDays = (daily.time || []).slice(0, 3).map((dateStr, idx) => {
    const dayWmo = mapWmoCode(daily.weather_code?.[idx] ?? 2);
    return {
      date: dateStr,
      maxTempC: daily.temperature_2m_max?.[idx] ?? 33,
      minTempC: daily.temperature_2m_min?.[idx] ?? 25,
      conditionText: dayWmo.text,
      icon: dayWmo.icon,
      chanceOfRain: daily.precipitation_probability_max?.[idx] ?? 20,
    };
  });

  return formatWeatherData({
    tempC: cur.temperature_2m ?? 28,
    conditionText: wmo.text,
    icon: wmo.icon,
    humidity: cur.relative_humidity_2m ?? 75,
    windKph: cur.wind_speed_10m ?? 10,
    feelsLikeC: cur.apparent_temperature ?? cur.temperature_2m ?? 28,
    precipitation: cur.precipitation ?? 0,
    currentHourPrecipitationProbability,
    forecastDays,
  });
};

const fetchWeather = async () => {
  const cacheKey = 'dagupan_weather';
  const cached = weatherCache.get(cacheKey);
  if (cached) return cached;

  // 1. Try WeatherAPI if user has configured a custom key
  if (config.weather?.apiKey && config.weather.apiKey !== 'your-weatherapi-key') {
    try {
      const response = await axios.get('http://api.weatherapi.com/v1/forecast.json', {
        params: {
          key: config.weather.apiKey,
          q: 'Dagupan,Philippines',
          days: 3,
          aqi: 'no',
          alerts: 'yes',
        },
        timeout: 5000,
      });

      const cur = response.data.current;
      const forecastDays = (response.data.forecast?.forecastday || []).map((day) => ({
        date: day.date,
        maxTempC: day.day.maxtemp_c,
        minTempC: day.day.mintemp_c,
        conditionText: day.day.condition.text,
        icon: day.day.condition.icon,
        chanceOfRain: day.day.daily_chance_of_rain,
      }));

      const data = formatWeatherData({
        tempC: cur.temp_c,
        conditionText: cur.condition.text,
        icon: cur.condition.icon,
        humidity: cur.humidity,
        windKph: cur.wind_kph,
        feelsLikeC: cur.feelslike_c,
        forecastDays,
        alerts: response.data.alerts?.alert || [],
      });

      weatherCache.set(cacheKey, data);
      return data;
    } catch (e) {
      console.warn('WeatherAPI attempt failed, falling back to live Open-Meteo.');
    }
  }

  // 2. Try Open-Meteo for live Dagupan real-time weather
  try {
    const liveData = await fetchFromOpenMeteo();
    weatherCache.set(cacheKey, liveData);
    return liveData;
  } catch (openMeteoError) {
    console.warn('Open-Meteo unavailable, returning Dagupan offline fallback data:', openMeteoError.message);
  }

  // 3. Fallback data if completely offline
  const todayStr = new Date().toISOString().split('T')[0];
  const offlineData = formatWeatherData({
    tempC: 30,
    conditionText: 'Partly Cloudy',
    icon: '//cdn.weatherapi.com/weather/64x64/day/116.png',
    humidity: 78,
    windKph: 12,
    feelsLikeC: 34,
    forecastDays: [
      { date: todayStr, maxTempC: 33, minTempC: 26, conditionText: 'Partly Cloudy', icon: '//cdn.weatherapi.com/weather/64x64/day/116.png', chanceOfRain: 25 },
      { date: new Date(Date.now() + 86400000).toISOString().split('T')[0], maxTempC: 32, minTempC: 25, conditionText: 'Light Rain Shower', icon: '//cdn.weatherapi.com/weather/64x64/day/353.png', chanceOfRain: 45 },
      { date: new Date(Date.now() + 172800000).toISOString().split('T')[0], maxTempC: 34, minTempC: 26, conditionText: 'Mainly Clear', icon: '//cdn.weatherapi.com/weather/64x64/day/113.png', chanceOfRain: 15 },
    ],
  });

  weatherCache.set(cacheKey, offlineData);
  return offlineData;
};

module.exports = { fetchWeather };
