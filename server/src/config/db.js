const mongoose = require('mongoose');
const os = require('os');
const config = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri, {
      runtimeAdapters: { os },
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    if (config.nodeEnv === 'development' && !config.mongoUri.includes('127.0.0.1') && !config.mongoUri.includes('localhost')) {
      try {
        console.log('[FALLBACK] Attempting connection to local MongoDB at mongodb://127.0.0.1:27017/smartsakay...');
        const localConn = await mongoose.connect('mongodb://127.0.0.1:27017/smartsakay', {
          runtimeAdapters: { os },
          serverSelectionTimeoutMS: 4000,
        });
        console.log(`Connected to local MongoDB fallback: ${localConn.connection.host}`);
        return localConn;
      } catch (localErr) {
        console.error(`Local MongoDB fallback also failed: ${localErr.message}`);
      }
    }
    if (config.mongoUri.includes('localhost') || config.mongoUri.includes('127.0.0.1')) {
      console.error('[CONFIG NOTICE] The server is trying to connect to localhost:27017.');
      console.error('[CONFIG NOTICE] For cloud deployment (Render, Vercel, Railway), please configure the MONGODB_URI environment variable with your MongoDB Atlas connection string (e.g., mongodb+srv://<user>:<password>@cluster.mongodb.net/smartsakay).');
    }
    process.exit(1);
  }
};

module.exports = connectDB;

