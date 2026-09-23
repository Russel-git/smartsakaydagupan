const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const os = require('os');

const CONFIG_FILE = path.join(os.tmpdir(), 'smartsakay-test-mongo-uri');

const connectTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  const uri = fs.readFileSync(CONFIG_FILE, 'utf-8').trim();
  await mongoose.connect(uri, { runtimeAdapters: { os } });
};

const disconnectTestDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } catch (e) {
    // Ignore disconnect errors
  }
};

const clearTestDB = async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
};

module.exports = { connectTestDB, disconnectTestDB, clearTestDB };
