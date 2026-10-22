const weatherService = require('../services/weatherService');
const weatherNotificationService = require('../services/weatherNotificationService');
const apiResponse = require('../utils/apiResponse');

const getCurrentWeather = async (req, res, next) => {
  try {
    const lat = req.query.lat || req.query.latitude;
    const lon = req.query.lon || req.query.lng || req.query.longitude;
    const locationName = req.query.locationName || req.query.location;
    const weather = await weatherService.fetchWeather({ lat, lon, locationName });
    return apiResponse.success(res, {
      current: weather.current, alerts: weather.alerts, travelAdvisory: weather.travelAdvisory,
    }, 'Current weather retrieved');
  } catch (error) { next(error); }
};

const getForecast = async (req, res, next) => {
  try {
    const lat = req.query.lat || req.query.latitude;
    const lon = req.query.lon || req.query.lng || req.query.longitude;
    const locationName = req.query.locationName || req.query.location;
    const weather = await weatherService.fetchWeather({ lat, lon, locationName });
    return apiResponse.success(res, {
      forecast: weather.forecast, alerts: weather.alerts, travelAdvisory: weather.travelAdvisory,
    }, 'Forecast retrieved');
  } catch (error) { next(error); }
};

const getWeatherStatus = async (req, res, next) => {
  try {
    const status = weatherNotificationService.getMonitoringStatus();
    return apiResponse.success(res, status, 'Weather monitoring status retrieved');
  } catch (error) { next(error); }
};

const triggerWeatherAlertCheck = async (req, res, next) => {
  try {
    const force = req.query.force === 'true' || req.body?.force === true;
    const result = await weatherNotificationService.checkAndNotifyWeather(force);
    return apiResponse.success(res, result, result.notified ? 'Weather notification dispatched' : result.reason || 'Check complete');
  } catch (error) { next(error); }
};

module.exports = {
  getCurrentWeather,
  getForecast,
  getWeatherStatus,
  triggerWeatherAlertCheck,
};
