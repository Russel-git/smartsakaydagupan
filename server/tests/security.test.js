const request = require('supertest');
const mongoose = require('mongoose');
const os = require('os');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcryptjs');

beforeAll(async () => {
  const uri = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/smartsakay_test';
  await mongoose.connect(uri, { driverInfo: { name: 'nodejs', version: 'unknown' } });
}, 60000);

afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
}, 30000);

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
}, 30000);

const app = require('../src/app');
const User = require('../src/models/User');
const { generateAccessToken } = require('../src/utils/tokenUtils');

describe('ITE 314 Checkpoint 02 - Security Testing Suite', () => {
  let commuterUser;
  let adminUser;
  let commuterToken;
  let adminToken;

  beforeEach(async () => {
    // Seed test commuter
    commuterUser = await User.create({
      email: 'commuter@smartsakay.ph',
      passwordHash: 'Commuter@12345', // pre-save hook will hash this
      firstName: 'Maria',
      lastName: 'Santos',
      role: 'commuter',
      isVerified: true,
      isActive: true,
    });
    commuterToken = generateAccessToken(commuterUser);

    // Seed test admin
    adminUser = await User.create({
      email: 'admin@smartsakay.ph',
      passwordHash: 'Admin@Secure999', // pre-save hook will hash this
      firstName: 'Admin',
      lastName: 'Officer',
      role: 'admin',
      isVerified: true,
      isActive: true,
    });
    adminToken = generateAccessToken(adminUser);
  });

  // Test Case 1: Invalid Login
  test('Test Case 1: Invalid Login - Rejects incorrect password with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'commuter@smartsakay.ph',
        password: 'WrongPassword@999',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid.*(password|credentials)/i);
  });

  // Test Case 2: Unauthorized Route
  test('Test Case 2: Unauthorized Route - Denies unauthenticated access to complaints', async () => {
    const res = await request(app).get('/api/complaints/my');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/access denied|no token provided/i);
  });

  // Test Case 3: Role Restriction
  test('Test Case 3: Role Restriction - Forbids commuter from accessing admin-only audit logs', async () => {
    const res = await request(app)
      .get('/api/admin/audit-logs')
      .set('Authorization', `Bearer ${commuterToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/permission/i);
  });

  // Test Case 4: Invalid Input
  test('Test Case 4: Invalid Input - Fails Joi validation for malformed registration payload', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'not-an-email',
        password: '123', // fails complexity & minlength
        firstName: '',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/validation failed/i);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  // Test Case 5: Protected API Without Token
  test('Test Case 5: Protected API Without Token - Blocks /api/users/me without Bearer header', async () => {
    const res = await request(app).get('/api/users/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // Test Case 6: Password Storage Check
  test('Test Case 6: Password Storage Check - Verifies bcrypt hashing in database', async () => {
    const userInDb = await User.findOne({ email: 'commuter@smartsakay.ph' }).select('+passwordHash');
    expect(userInDb).toBeDefined();
    expect(userInDb.passwordHash).not.toBe('Commuter@12345');
    expect(userInDb.passwordHash.startsWith('$2')).toBe(true); // bcrypt signature
    const isMatch = await bcrypt.compare('Commuter@12345', userInDb.passwordHash);
    expect(isMatch).toBe(true);
  });

  // Test Case 7: Secure Error Response
  test('Test Case 7: Secure Error Response - Handles CastError safely without crashing or exposing internals', async () => {
    const res = await request(app).get('/api/routes/invalid-mongo-id-12345');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid ID format');
  });

  // Test Case 8: HTTPS & Security Headers Check
  test('Test Case 8: HTTPS & Security Headers Check - Verifies Helmet security headers', async () => {
    const res = await request(app).get('/api/health');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers).toHaveProperty('content-security-policy');
  });

  // Test Case 9: Rate Limit Test
  test('Test Case 9: Rate Limit Test - Verifies rate limit headers are attached', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.headers['ratelimit-limit']).toBeDefined();
    expect(res.headers['ratelimit-remaining']).toBeDefined();
  });

  // Test Case 10: Database Access Check
  test('Test Case 10: Database Access Check - Blocks NoSQL injection attempt', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: { $gt: '' },
        password: 'password123',
      });

    // Sanitizer and/or Joi schema rejects non-string email with 400 Bad Request
    expect([400, 401]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });
});
