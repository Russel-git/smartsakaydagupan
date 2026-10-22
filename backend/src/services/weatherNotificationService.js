const weatherService = require("./weatherService");
const Notification = require("../models/Notification");
const User = require("../models/User");

let lastWeatherCheckTime = null;
let lastWeatherAlertSent = null;
let dailyTimer = null;

const DAILY_CHECK_HOUR = 8; // 8:00 AM Philippine Time
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24-hour cooldown

const checkAndNotifyWeather = async (force = false) => {
  try {
    lastWeatherCheckTime = new Date();
    const weatherData = await weatherService.fetchWeather();
    if (!weatherData || !weatherData.current) {
      return { notified: false, reason: "Unable to retrieve weather data" };
    }

    const { current, forecast = [] } = weatherData;
    const tempC = current.tempC ?? current.temp_c ?? 30;
    const feelsLikeC = current.feelsLikeC ?? current.feelslike_c ?? tempC;
    const windKph = current.windKph ?? current.wind_kph ?? 10;
    const condition = (
      current.conditionText ||
      current.condition ||
      ""
    ).toLowerCase();
    const todayForecast = forecast[0] || {};
    const rainChance = todayForecast.chanceOfRain ?? 20;
    const locationName =
      current.coordinates?.location || weatherService.DEFAULT_LOCATION;
    const coords = current.coordinates || {
      latitude: weatherService.DEFAULT_LAT,
      longitude: weatherService.DEFAULT_LNG,
    };

    let alertTitle = null;
    let alertMessage = null;
    let alertSeverity = "info";

    // 1. Check for Thunderstorm / Severe Weather
    if (condition.includes("thunder") || condition.includes("storm")) {
      alertTitle = `⛈️ Weather Alert: Thunderstorm Warning`;
      alertMessage = `Thunderstorms detected over ${locationName} (${tempC}°C). Wet roadways and possible localized street flooding expected. Commuters are advised to take covered waiting areas.`;
      alertSeverity = "severe";
    }
    // 2. Check for Active Rain or High Rain Chance
    else if (
      condition.includes("rain") ||
      condition.includes("drizzle") ||
      condition.includes("shower") ||
      rainChance >= 70
    ) {
      alertTitle = `🌧️ Rain Advisory: Wet Road Conditions`;
      alertMessage = `Rain showers in ${locationName} with ${rainChance}% precipitation probability (${tempC}°C). Expect moderate jeepney delays. Keep umbrellas ready.`;
      alertSeverity = "warning";
    }
    // 3. Check for Extreme Heat Index
    else if (tempC >= 35 || feelsLikeC >= 38) {
      alertTitle = `☀️ Heat Advisory: High Heat Index`;
      alertMessage = `Dangerous heat index of ${feelsLikeC}°C recorded in ${locationName}. Commuters are urged to stay hydrated, carry water, and minimize direct sun exposure at PUV terminals.`;
      alertSeverity = "warning";
    }
    // 4. Check for Strong Coastal Winds
    else if (windKph >= 35) {
      alertTitle = `💨 Wind Advisory`;
      alertMessage = `Sustained winds of ${windKph} km/h detected in ${locationName}. Secure loose belongings and ride with caution on open tricycles.`;
      alertSeverity = "warning";
    }
    // 5. Daily Morning Commuter Bulletin (favorable conditions)
    else {
      alertTitle = `🌤️ Morning Commuter Weather`;
      alertMessage = `Good morning commuters! Current weather in ${locationName} is ${current.conditionText || "Partly Cloudy"}, ${tempC}°C with ${windKph} km/h winds. Favorable commuting conditions across city routes.`;
      alertSeverity = "info";
    }

    // Cooldown check: Avoid sending the same alert type within 24 hours unless forced
    if (!force) {
      const cooldownAgo = new Date(Date.now() - COOLDOWN_MS);
      const recentAlert = await Notification.findOne({
        type: "weather_alert",
        title: alertTitle,
        createdAt: { $gte: cooldownAgo },
      });

      if (recentAlert) {
        return {
          notified: false,
          reason: `Advisory already sent today (last sent at ${recentAlert.createdAt.toLocaleTimeString()}). 24-hour cooldown active.`,
        };
      }
    }

    // Automatic 3-day expiration date
    const WEATHER_EXPIRY_MS = 3 * 24 * 60 * 60 * 1000;
    const weatherExpiresAt = new Date(Date.now() + WEATHER_EXPIRY_MS);

    // Purge any weather notifications older than 3 days from database
    await Notification.deleteMany({
      $or: [{ type: "weather_alert" }, { category: "weather_updates" }],
      createdAt: { $lt: new Date(Date.now() - WEATHER_EXPIRY_MS) },
    }).catch((e) =>
      console.warn("[WeatherAutoNotifier] Auto-cleanup warning:", e.message),
    );

    await Notification.create({
      userId: null,
      title: alertTitle,
      message: alertMessage,
      type: "weather_alert",
      category: "weather_updates",
      expiresAt: weatherExpiresAt,
      metadata: {
        tempC,
        feelsLikeC,
        windKph,
        condition: current.conditionText || current.condition,
        rainChance,
        precipitation: current.precipitation ?? 0,
        severity: alertSeverity,
        coordinates: { lat: coords.latitude, lng: coords.longitude },
        location: locationName,
        source: `Open-Meteo Telemetry (${Number(coords.latitude).toFixed(4)}° N, ${Number(coords.longitude).toFixed(4)}° E)`,
      },
    });

    lastWeatherAlertSent = {
      title: alertTitle,
      message: alertMessage,
      sentAt: new Date(),
    };

    console.log(
      `[WeatherAutoNotifier] ✅ Daily 8AM weather notification sent: "${alertTitle}" for ${locationName}.`,
    );

    return {
      notified: true,
      title: alertTitle,
      message: alertMessage,
    };
  } catch (error) {
    console.error(
      "[WeatherAutoNotifier] Error checking weather alerts:",
      error.message,
    );
    return { notified: false, reason: error.message };
  }
};

const msUntilNext8AM = () => {
  const now = new Date();
  const next = new Date(now);
  next.setHours(DAILY_CHECK_HOUR, 0, 0, 0);

  if (now >= next) {
    next.setDate(next.getDate() + 1);
  }

  return next.getTime() - now.getTime();
};

const startWeatherMonitoring = () => {
  if (dailyTimer) clearTimeout(dailyTimer);

  const msToNext = msUntilNext8AM();
  const hoursUntil = (msToNext / 3600000).toFixed(1);

  console.log(
    `[WeatherAutoNotifier] 🕗 Daily weather check scheduled for 8:00 AM (in ${hoursUntil} hours).`,
  );

  dailyTimer = setTimeout(() => {
    checkAndNotifyWeather(false).catch((err) =>
      console.warn("[WeatherAutoNotifier] Daily check error:", err.message),
    );

    dailyTimer = setInterval(
      () => {
        checkAndNotifyWeather(false).catch((err) =>
          console.warn("[WeatherAutoNotifier] Daily check error:", err.message),
        );
      },
      24 * 60 * 60 * 1000,
    );

    console.log("[WeatherAutoNotifier] 🔁 24-hour recurring schedule active.");
  }, msToNext);
};

const getMonitoringStatus = () => {
  const msToNext = msUntilNext8AM();
  const nextRun = new Date(Date.now() + msToNext);

  return {
    active: true,
    schedule: "Daily at 8:00 AM",
    nextScheduledCheck: nextRun.toLocaleString("en-PH", {
      timeZone: "Asia/Manila",
    }),
    location: weatherService.DEFAULT_LOCATION,
    coordinates: {
      lat: weatherService.DEFAULT_LAT,
      lng: weatherService.DEFAULT_LNG,
    },
    provider: "Open-Meteo Forecast API (Free Open-Access)",
    cooldownHours: 24,
    lastCheckTime: lastWeatherCheckTime,
    lastAlertSent: lastWeatherAlertSent,
  };
};

module.exports = {
  checkAndNotifyWeather,
  startWeatherMonitoring,
  getMonitoringStatus,
};
