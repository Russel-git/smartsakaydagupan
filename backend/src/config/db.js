const mongoose = require("mongoose");
const dns = require("dns");
const os = require("os");
const config = require("./env");

const connectDB = async () => {
  try {
    try {
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
    } catch (_) {}

    const uri = config.mongoUri;

    console.log("MongoDB URI type:", typeof uri);
    console.log("MongoDB URI length:", uri?.length);
    console.log("MongoDB URI prefix:", JSON.stringify(uri?.slice(0, 20)));
    const conn = await mongoose.connect(config.mongoUri, {
      runtimeAdapters: { os },
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    if (
      config.nodeEnv === "development" &&
      !config.mongoUri.includes("127.0.0.1") &&
      !config.mongoUri.includes("localhost")
    ) {
      try {
        console.log(
          "[FALLBACK] Attempting connection to local MongoDB at mongodb://127.0.0.1:27017/smartsakay...",
        );
        const localConn = await mongoose.connect(
          "mongodb://127.0.0.1:27017/smartsakay",
          {
            runtimeAdapters: { os },
            serverSelectionTimeoutMS: 4000,
          },
        );
        console.log(
          `Connected to local MongoDB fallback: ${localConn.connection.host}`,
        );
        return localConn;
      } catch (localErr) {
        console.error(
          `Local MongoDB fallback also failed: ${localErr.message}`,
        );
      }
    }
    if (
      config.mongoUri.includes("localhost") ||
      config.mongoUri.includes("127.0.0.1")
    ) {
      console.error(
        "[CONFIG NOTICE] The server is trying to connect to localhost:27017.",
      );
      console.error(
        "[CONFIG NOTICE] For cloud deployment (Render, Vercel, Railway), please configure the MONGODB_URI environment variable with your MongoDB Atlas connection string (e.g., mongodb+srv://<user>:<password>@cluster.mongodb.net/smartsakay).",
      );
    }
    process.exit(1);
  }
};

module.exports = connectDB;
