const dotenv = require("dotenv");
const path = require("path");

const envPath = path.resolve(__dirname, "../../../.env");

const result = dotenv.config({
  path: envPath,
});

if (result.error) {
  throw new Error(`❌ Could not load .env file: ${envPath}`);
}

console.log("✅ .env loaded successfully");

const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtAccessExpiry: "15m",
  jwtRefreshExpiry: "7d",
  gmail: {
    user: process.env.GMAIL_USER,
    appPassword: process.env.GMAIL_APP_PASSWORD,
  },
  smtp: {
    host: process.env.GMAIL_HOST,
    port: process.env.GMAIL_PORT,
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY,
  },
  weather: {
    apiKey: process.env.WEATHER_API_KEY,
  },
  admin: {
    email: process.env.ADMIN_EMAIL,
    defaultPassword: process.env.ADMIN_DEFAULT_PASSWORD,
  },
};

module.exports = config;
