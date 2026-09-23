const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/smartsakay',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',
  jwtAccessExpiry: '15m',
  jwtRefreshExpiry: '7d',
  gmail: {
    user: process.env.GMAIL_USER,
    appPassword: process.env.GMAIL_APP_PASSWORD,
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },

  gemini: {
    apiKey: (process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY || process.env.GOOGLE_API_KEY || '').trim(),
    model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY,
  },
  weather: {
    apiKey: process.env.WEATHER_API_KEY,
    apiUrl: process.env.WEATHER_API_URL || 'https://api.open-meteo.com/v1/forecast?latitude=16.0433&longitude=120.3397&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,apparent_temperature,wind_speed_10m&hourly=precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FManila',
  },
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@smartsakay.com',
    defaultPassword: process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@12345',
  },
};

module.exports = config;
