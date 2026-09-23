const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');
const fs = require('fs');

const os = require('os');
const CONFIG_FILE = path.join(os.tmpdir(), 'smartsakay-test-mongo-uri');

module.exports = async function globalSetup() {
  const mongoServer = await MongoMemoryServer.create({
    binary: { version: '7.0.20' },
  });
  const uri = mongoServer.getUri();
  // Write URI to file so test workers can read it
  fs.writeFileSync(CONFIG_FILE, uri);
  // Store server ref on global for teardown
  globalThis.__MONGOSERVER__ = mongoServer;
  console.log(`\nTest MongoDB 7.0 started at: ${uri}`);
};
