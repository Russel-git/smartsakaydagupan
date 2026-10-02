const app = require('./app');
const connectDB = require('./config/db');
const config = require('./config/env');
const { startWeatherMonitoring } = require('./services/weatherNotificationService');

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[WARN] Unhandled Rejection at:', promise, 'reason:', reason);
});

const startServer = async () => {
  await connectDB();
  const server = app.listen(config.port, () => {
    console.log(`SmartSakay Dagupan API running on port ${config.port} in ${config.nodeEnv} mode`);
    // Start automated weather monitoring for Dagupan City
    startWeatherMonitoring();
  });

  server.on('error', (err) => {
    console.error('[Server Error]:', err);
  });
};

startServer();

