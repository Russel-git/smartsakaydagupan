process.env.MONGOMS_VERSION = '7.0.20';

module.exports = {
  testEnvironment: 'node',
  testTimeout: 60000,
  forceExit: true,
  detectOpenHandles: true,
  maxWorkers: 1,
};
