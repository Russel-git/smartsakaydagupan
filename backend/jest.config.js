process.env.NODE_ENV = 'test';
process.env.MONGOMS_MD5_CHECK = '0';
process.env.MONGOMS_VERSION = '7.0.20';

module.exports = {
  testEnvironment: 'node',
  testTimeout: 60000,
  forceExit: true,
  detectOpenHandles: true,
  maxWorkers: 1,
};
