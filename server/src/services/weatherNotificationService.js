const weatherService = require('./weatherService');
const Notification = require('../models/Notification');
const User = require('../models/User');

let lastWeatherCheckTime = null;
let lastWeatherAlertSent = null;
let cronTimer = null;

/**
 * Evaluates current weather in Dagupan City and broadcasts automated notifications
 * to commuters when advisories or significant weather changes occur.
 * 
 * @param {boolean} force - If true, bypasses the 4-hour cooldown check.
 * @returns {Promise<{notified: boolean, title?: string, message?: string, reason?: string}>}
 */
const checkAndNotifyWeather = async (force = false) => {
  try {
    lastWeatherCheckTime = new Date();
    const weatherData = await weatherService.fetchWeather();
    if (!weatherData || !weatherData.current) {
      return { notified: false, reason: 'Unable to retrieve Dagupan weather data' };
    }

    const { current, forecast = [] } = weatherData;
    const tempC = current.tempC ?? current.temp_c ?? 30;
    const feelsLikeC = current.feelsLikeC ?? current.feelslike_c ?? tempC;
    const windKph = current.windKph ?? current.wind_kph ?? 10;
    const condition = (current.conditionText || current.condition || '').toLowerCase();
    const todayForecast = forecast[0] || {};
    const rainChance = todayForecast.chanceOfRain ?? 20;

    let alertTitle = null;
    let alertMessage = null;
    let alertSeverity = 'info'; // 'info', 'warning', 'severe'

    // 1. Check for Thunderstorm / Severe Weather
    if (condition.includes('thunder') || condition.includes('storm')) {
      alertTitle = '⛈️ Dagupan Weather Alert: Thunderstorm Warning';
      alertMessage = `Thunderstorms detected over Dagupan City (${tempC}°C). Wet roadways and possible localized street flooding expected near Lucao & Downtown. Commuters are advised to take covered waiting areas.`;
      alertSeverity = 'severe';
    }
    // 2. Check for Active Rain or High Rain Chance
    else if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('shower') || rainChance >= 70) {
      alertTitle = '🌧️ Dagupan Rain Advisory: Wet Road Conditions';
      alertMessage = `Rain showers in Dagupan City with ${rainChance}% precipitation probability (${tempC}°C). Expect moderate jeepney delays along Perez Blvd and Bonuan routes. Keep umbrellas ready.`;
      alertSeverity = 'warning';
    }
    // 3. Check for Extreme Heat Index
    else if (tempC >= 35 || feelsLikeC >= 38) {
      alertTitle = '☀️ Dagupan Heat Advisory: High Heat Index';
      alertMessage = `Dangerous heat index of ${feelsLikeC}°C recorded in Dagupan City. Commuters are urged to stay hydrated, carry water, and minimize direct sun exposure at PUV terminals.`;
      alertSeverity = 'warning';
    }
    // 4. Check for Strong Coastal Winds
    else if (windKph >= 35) {
      alertTitle = '💨 Dagupan Coastal Wind Advisory';
      alertMessage = `Sustained coastal winds of ${windKph} km/h detected in Dagupan coastal corridors. Secure loose belongings and ride with caution on open tricycles.`;
      alertSeverity = 'warning';
    }
    // 5. Daily Morning Commuter Bulletin (Favorable conditions between 6 AM and 9 AM)
    else {
      const currentHour = new Date().getHours();
      if (currentHour >= 6 && currentHour <= 9) {
        alertTitle = '🌤️ Dagupan Morning Commuter Weather';
        alertMessage = `Good morning Dagupan commuters! Current weather is ${current.conditionText || 'Partly Cloudy'}, ${tempC}°C with ${windKph} km/h winds. Clear roads and favorable commuting conditions across city routes.`;
        alertSeverity = 'info';
      }
    }

    if (!alertTitle) {
      return { notified: false, reason: 'Weather conditions are normal, no advisory required.' };
    }

    // Cooldown check: Avoid sending the same alert type within 4 hours unless forced
    if (!force) {
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
      const recentAlert = await Notification.findOne({
        type: 'weather_alert',
        title: alertTitle,
        createdAt: { $gte: fourHoursAgo },
      });

      if (recentAlert) {
        return {
          notified: false,
          reason: `Advisory already active (last sent at ${recentAlert.createdAt.toLocaleTimeString()}). Cooldown active to avoid duplicate notifications.`,
        };
      }
    }

    // 1. Create broadcast notification (userId: null)
    await Notification.create({
      userId: null,
      title: alertTitle,
      message: alertMessage,
      type: 'weather_alert',
      metadata: {
        tempC,
        feelsLikeC,
        windKph,
        condition: current.conditionText || current.condition,
        rainChance,
        severity: alertSeverity,
        dagupanCoordinates: { lat: 16.0433, lng: 120.3397 },
        source: 'Open-Meteo Dagupan Telemetry (16.0433° N, 120.3397° E)',
      },
    });

    // 2. Deliver individualized notifications to all registered commuters for unread counter badge
    const commuters = await User.find({ role: 'commuter', isActive: true }).select('_id');
    if (commuters.length > 0) {
      const userNotifications = commuters.map((commuter) => ({
        userId: commuter._id,
        title: alertTitle,
        message: alertMessage,
        type: 'weather_alert',
        metadata: {
          tempC,
          feelsLikeC,
          windKph,
          condition: current.conditionText || current.condition,
          rainChance,
          precipitation: current.precipitation ?? 0,
          severity: alertSeverity,
          dagupanCoordinates: { lat: 16.0433, lng: 120.3397 },
        },
      }));
      await Notification.insertMany(userNotifications);
    }

    lastWeatherAlertSent = {
      title: alertTitle,
      message: alertMessage,
      sentAt: new Date(),
      recipients: commuters.length,
    };

    console.log(`[WeatherAutoNotifier] Broadcasted automated weather notification: "${alertTitle}" to ${commuters.length} commuters.`);

    return {
      notified: true,
      title: alertTitle,
      message: alertMessage,
      recipients: commuters.length,
    };
  } catch (error) {
    console.error('[WeatherAutoNotifier] Error checking weather alerts:', error.message);
    return { notified: false, reason: error.message };
  }
};

/**
 * Initializes the automated weather background monitoring daemon.
 * Runs an initial check shortly after startup, then checks every 60 minutes.
 */
const startWeatherMonitoring = () => {
  if (cronTimer) clearInterval(cronTimer);

  // Initial check after 8 seconds of server startup
  setTimeout(() => {
    checkAndNotifyWeather(false).catch((err) =>
      console.warn('[WeatherAutoNotifier] Startup check error:', err.message)
    );
  }, 8000);

  // Recurring check every 60 minutes (3,600,000 ms)
  cronTimer = setInterval(() => {
    checkAndNotifyWeather(false).catch((err) =>
      console.warn('[WeatherAutoNotifier] Scheduled check error:', err.message)
    );
  }, 60 * 60 * 1000);

  console.log('[WeatherAutoNotifier] Automated Dagupan City weather monitor daemon active (Interval: 60m).');
};

const getMonitoringStatus = () => {
  return {
    active: true,
    location: 'Dagupan City, Pangasinan',
    coordinates: { lat: 16.0433, lng: 120.3397 },
    provider: 'Open-Meteo Forecast URL (Free Open-Access)',
    apiUrl: 'https://api.open-meteo.com/v1/forecast?latitude=16.0433&longitude=120.3397&current=temperature_2m,relative_humidity_2m,precipitation,weather_code&hourly=precipitation_probability&timezone=Asia%2FManila',
    intervalMinutes: 60,
    lastCheckTime: lastWeatherCheckTime,
    lastAlertSent: lastWeatherAlertSent,
  };
};

module.exports = {
  checkAndNotifyWeather,
  startWeatherMonitoring,
  getMonitoringStatus,
};
