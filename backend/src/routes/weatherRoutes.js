const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

router.get('/status', weatherController.getWeatherStatus);
router.get('/current', weatherController.getCurrentWeather);
router.get('/forecast', weatherController.getForecast);
router.post('/check-alerts', weatherController.triggerWeatherAlertCheck);

module.exports = router;
