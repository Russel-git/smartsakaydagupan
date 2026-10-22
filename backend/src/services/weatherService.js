const axios = require("axios");
const NodeCache = require("node-cache");
const config = require("../config/env");

const weatherCache = new NodeCache({ stdTTL: 900 }); // 15 minutes TTL

const DEFAULT_LAT = 16.0433;
const DEFAULT_LNG = 120.3397;
const DEFAULT_LOCATION = "Dagupan City, Pangasinan";

// Map WMO codes from Open-Meteo to readable descriptions and icons
const mapWmoCode = (code) => {
  if (code === 0)
    return {
      text: "Clear Sky",
      icon: "//cdn.weatherapi.com/weather/64x64/day/113.png",
    };
  if (code === 1)
    return {
      text: "Mainly Clear",
      icon: "//cdn.weatherapi.com/weather/64x64/day/116.png",
    };
  if (code === 2)
    return {
      text: "Partly Cloudy",
      icon: "//cdn.weatherapi.com/weather/64x64/day/116.png",
    };
  if (code === 3)
    return {
      text: "Overcast",
      icon: "//cdn.weatherapi.com/weather/64x64/day/122.png",
    };
  if (code >= 45 && code <= 48)
    return {
      text: "Foggy",
      icon: "//cdn.weatherapi.com/weather/64x64/day/143.png",
    };
  if (code >= 51 && code <= 55)
    return {
      text: "Light Drizzle",
      icon: "//cdn.weatherapi.com/weather/64x64/day/266.png",
    };
  if (code >= 61 && code <= 65)
    return {
      text: "Rain",
      icon: "//cdn.weatherapi.com/weather/64x64/day/296.png",
    };
  if (code >= 80 && code <= 82)
    return {
      text: "Rain Showers",
      icon: "//cdn.weatherapi.com/weather/64x64/day/353.png",
    };
  if (code >= 95)
    return {
      text: "Thunderstorm",
      icon: "//cdn.weatherapi.com/weather/64x64/day/389.png",
    };
  return {
    text: "Partly Cloudy",
    icon: "//cdn.weatherapi.com/weather/64x64/day/116.png",
  };
};

const generateAdvisories = (
  tempC,
  windKph,
  conditionText,
  precipitation = 0,
  rainChance = 0,
  locationName = "",
) => {
  const advisories = [];
  const textLower = (conditionText || "").toLowerCase();
  const loc = locationName || "your area";

  if (textLower.includes("thunder") || textLower.includes("storm")) {
    advisories.push(
      `⛈️ Thunderstorms detected over ${loc} — take shelter and anticipate road waterlogging.`,
    );
  } else if (
    textLower.includes("rain") ||
    textLower.includes("drizzle") ||
    textLower.includes("shower") ||
    precipitation > 0 ||
    rainChance >= 60
  ) {
    advisories.push(
      `🌧️ Wet road conditions in ${loc}${precipitation > 0 ? ` (${precipitation}mm rainfall)` : ""} — carry an umbrella and allow extra travel time.`,
    );
  }
  if (windKph > 35) {
    advisories.push(
      `💨 Strong winds (${windKph} km/h) in ${loc} — exercise caution near open transport terminals and on tricycles.`,
    );
  }
  if (tempC > 34) {
    advisories.push(
      `☀️ High heat index (${tempC}°C) — stay hydrated and seek shaded waiting sheds at jeepney stops.`,
    );
  }
  return advisories.length > 0
    ? advisories
    : [`Favorable commuting weather in ${loc}.`];
};

const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await axios.get(
      "https://geocoding-api.open-meteo.com/v1/search",
      {
        params: {
          name: `${latitude},${longitude}`,
          count: 1,
          language: "en",
          format: "json",
        },
        timeout: 3000,
      },
    );
    const result = response.data?.results?.[0];
    if (result) {
      const parts = [result.name, result.admin1, result.country].filter(
        Boolean,
      );
      return parts.join(", ");
    }
  } catch (_) {}

  try {
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/reverse",
      {
        params: {
          lat: latitude,
          lon: longitude,
          format: "json",
          zoom: 10,
          "accept-language": "en",
        },
        headers: { "User-Agent": "SmartSakay/1.0" },
        timeout: 3000,
      },
    );
    const addr = response.data?.address;
    if (addr) {
      const city =
        addr.city ||
        addr.town ||
        addr.municipality ||
        addr.village ||
        addr.county ||
        "";
      const state = addr.state || addr.region || "";
      return (
        [city, state].filter(Boolean).join(", ") ||
        response.data?.display_name?.split(",").slice(0, 2).join(",").trim() ||
        null
      );
    }
  } catch (_) {}

  return null;
};

const formatWeatherData = ({
  tempC,
  conditionText,
  icon,
  humidity,
  windKph,
  feelsLikeC,
  precipitation = 0,
  currentHourPrecipitationProbability = null,
  forecastDays,
  alerts = [],
  latitude,
  longitude,
  locationName,
}) => {
  const roundedTemp = Math.round(tempC);
  const roundedFeels = Math.round(feelsLikeC);
  const roundedWind = Math.round(windKph);
  const lat = latitude || DEFAULT_LAT;
  const lng = longitude || DEFAULT_LNG;
  const locName = locationName || DEFAULT_LOCATION;

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
      icon: icon || "//cdn.weatherapi.com/weather/64x64/day/116.png",
      humidity: humidity || 75,
      windKph: roundedWind,
      wind_kph: roundedWind,
      feelsLikeC: roundedFeels,
      feelslike_c: roundedFeels,
      precipitation: Number(precipitation) || 0,
      rainChance: currentHourPrecipitationProbability ?? 20,
      coordinates: { latitude: lat, longitude: lng, location: locName },
      lastUpdated: new Date().toLocaleTimeString("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
    forecast: formattedForecast,
    alerts,
    travelAdvisory: generateAdvisories(
      roundedTemp,
      roundedWind,
      conditionText,
      precipitation,
      currentHourPrecipitationProbability,
      locName,
    ),
  };
};

const buildOpenMeteoUrl = (latitude, longitude) => {
  return `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,apparent_temperature,wind_speed_10m&hourly=precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;
};

const fetchFromOpenMeteo = async (
  latitude = DEFAULT_LAT,
  longitude = DEFAULT_LNG,
  locationName = null,
) => {
  const targetUrl = buildOpenMeteoUrl(latitude, longitude);

  const response = await axios.get(targetUrl, { timeout: 8000 });
  const cur = response.data.current || {};
  const daily = response.data.daily || {};
  const hourly = response.data.hourly || {};
  const wmo = mapWmoCode(cur.weather_code);

  // Extract current hour precipitation probability if hourly data exists
  let currentHourPrecipitationProbability = null;
  if (
    Array.isArray(hourly.time) &&
    Array.isArray(hourly.precipitation_probability)
  ) {
    const nowIso = new Date().toISOString().slice(0, 13); // 'YYYY-MM-DDTHH'
    const matchIdx = hourly.time.findIndex((t) => t.startsWith(nowIso));
    if (matchIdx !== -1) {
      currentHourPrecipitationProbability =
        hourly.precipitation_probability[matchIdx];
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

  const resolvedLocation =
    locationName ||
    (await reverseGeocode(latitude, longitude)) ||
    `${Number(latitude).toFixed(2)}° N, ${Number(longitude).toFixed(2)}° E`;

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
    latitude,
    longitude,
    locationName: resolvedLocation,
  });
};

const fetchWeather = async (latitude = null, longitude = null) => {
  const lat = latitude && !isNaN(latitude) ? parseFloat(latitude) : DEFAULT_LAT;
  const lng =
    longitude && !isNaN(longitude) ? parseFloat(longitude) : DEFAULT_LNG;

  // Use rounded coordinates as cache key for location-based caching
  const cacheKey = `weather_${lat.toFixed(2)}_${lng.toFixed(2)}`;
  const cached = weatherCache.get(cacheKey);
  if (cached) return cached;

  // 1. Try WeatherAPI if user has configured a custom key
  if (
    config.weather?.apiKey &&
    config.weather.apiKey !== "your-weatherapi-key"
  ) {
    try {
      const response = await axios.get(
        "http://api.weatherapi.com/v1/forecast.json",
        {
          params: {
            key: config.weather.apiKey,
            q: `${lat},${lng}`,
            days: 3,
            aqi: "no",
            alerts: "yes",
          },
          timeout: 5000,
        },
      );

      const cur = response.data.current;
      const loc = response.data.location;
      const locationName = loc ? `${loc.name}, ${loc.region}` : null;
      const forecastDays = (response.data.forecast?.forecastday || []).map(
        (day) => ({
          date: day.date,
          maxTempC: day.day.maxtemp_c,
          minTempC: day.day.mintemp_c,
          conditionText: day.day.condition.text,
          icon: day.day.condition.icon,
          chanceOfRain: day.day.daily_chance_of_rain,
        }),
      );

      const data = formatWeatherData({
        tempC: cur.temp_c,
        conditionText: cur.condition.text,
        icon: cur.condition.icon,
        humidity: cur.humidity,
        windKph: cur.wind_kph,
        feelsLikeC: cur.feelslike_c,
        forecastDays,
        alerts: response.data.alerts?.alert || [],
        latitude: lat,
        longitude: lng,
        locationName,
      });

      weatherCache.set(cacheKey, data);
      return data;
    } catch (e) {
      console.warn(
        "WeatherAPI attempt failed, falling back to live Open-Meteo.",
      );
    }
  }

  // 2. Try Open-Meteo for live real-time weather at user's location
  try {
    const liveData = await fetchFromOpenMeteo(lat, lng);
    weatherCache.set(cacheKey, liveData);
    return liveData;
  } catch (openMeteoError) {
    console.warn(
      "Open-Meteo unavailable, returning offline fallback data:",
      openMeteoError.message,
    );
  }

  // 3. Fallback data if completely offline
  const todayStr = new Date().toISOString().split("T")[0];
  const offlineData = formatWeatherData({
    tempC: 30,
    conditionText: "Partly Cloudy",
    icon: "//cdn.weatherapi.com/weather/64x64/day/116.png",
    humidity: 78,
    windKph: 12,
    feelsLikeC: 34,
    latitude: lat,
    longitude: lng,
    locationName: DEFAULT_LOCATION,
    forecastDays: [
      {
        date: todayStr,
        maxTempC: 33,
        minTempC: 26,
        conditionText: "Partly Cloudy",
        icon: "//cdn.weatherapi.com/weather/64x64/day/116.png",
        chanceOfRain: 25,
      },
      {
        date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
        maxTempC: 32,
        minTempC: 25,
        conditionText: "Light Rain Shower",
        icon: "//cdn.weatherapi.com/weather/64x64/day/353.png",
        chanceOfRain: 45,
      },
      {
        date: new Date(Date.now() + 172800000).toISOString().split("T")[0],
        maxTempC: 34,
        minTempC: 26,
        conditionText: "Mainly Clear",
        icon: "//cdn.weatherapi.com/weather/64x64/day/113.png",
        chanceOfRain: 15,
      },
    ],
  });

  weatherCache.set(cacheKey, offlineData);
  return offlineData;
};

module.exports = { fetchWeather, DEFAULT_LAT, DEFAULT_LNG, DEFAULT_LOCATION };
