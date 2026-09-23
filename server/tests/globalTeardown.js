const path = require('path');
const fs = require('fs');

const os = require('os');
const CONFIG_FILE = path.join(os.tmpdir(), 'smartsakay-test-mongo-uri');

module.exports = async function globalTeardown() {
  if (globalThis.__MONGOSERVER__) {
    await globalThis.__MONGOSERVER__.stop({ doCleanup: true });
    console.log('\nTest MongoDB stopped.');
  }
  // Clean up the URI file
  try { fs.unlinkSync(CONFIG_FILE); } catch (e) { /* ignore */ }
};
