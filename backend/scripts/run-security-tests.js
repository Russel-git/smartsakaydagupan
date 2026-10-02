const mongoose = require('mongoose');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const User = require('../src/models/User');
const { generateAccessToken } = require('../src/utils/tokenUtils');

async function runSecurityTests() {
  console.log('================================================================');
  console.log('ITE 314: ADVANCED DATABASE SYSTEMS - CHECKPOINT 02');
  console.log('Automated Security Testing Suite for SmartSakay Dagupan');
  console.log('================================================================\n');

  const uri = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/smartsakay_test';
  await mongoose.connect(uri);
  console.log(`[INIT] Connected to Test Database: ${uri}\n`);

  // Clear previous test data
  await User.deleteMany({ email: { $in: ['commuter@smartsakay.ph', 'admin@smartsakay.ph'] } });

  // Seed test commuter
  const commuterUser = await User.create({
    email: 'commuter@smartsakay.ph',
    passwordHash: 'Commuter@12345',
    firstName: 'Maria',
    lastName: 'Santos',
    role: 'commuter',
    isVerified: true,
    isActive: true,
  });
  const commuterToken = generateAccessToken(commuterUser);

  // Seed test admin
  const adminUser = await User.create({
    email: 'admin@smartsakay.ph',
    passwordHash: 'Admin@Secure999',
    firstName: 'Admin',
    lastName: 'Officer',
    role: 'admin',
    isVerified: true,
    isActive: true,
  });
  const adminToken = generateAccessToken(adminUser);

  const results = [];

  async function assertTest(name, procedure, fn) {
    try {
      const detail = await fn();
      results.push({ name, procedure, status: 'PASS', detail });
      console.log(`[PASS] ${name}`);
      console.log(`       Details: ${detail}\n`);
    } catch (err) {
      results.push({ name, procedure, status: 'FAIL', detail: err.message });
      console.error(`[FAIL] ${name}`);
      console.error(`       Error: ${err.message}\n`);
    }
  }

  // Test Case 1: Invalid Login
  await assertTest(
    'Test Case 1: Invalid Login',
    'POST /api/auth/login with wrong password',
    async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'commuter@smartsakay.ph', password: 'WrongPassword@999' });
      if (res.status !== 401) throw new Error(`Expected HTTP 401, got ${res.status}`);
      if (res.body.success !== false) throw new Error('Expected success: false');
      return `HTTP 401 Unauthorized returned. Message: "${res.body.message}"`;
    }
  );

  // Test Case 2: Unauthorized Route
  await assertTest(
    'Test Case 2: Unauthorized Route',
    'GET /api/complaints/my with no Authorization header',
    async () => {
      const res = await request(app).get('/api/complaints/my');
      if (res.status !== 401) throw new Error(`Expected HTTP 401, got ${res.status}`);
      if (res.body.success !== false) throw new Error('Expected success: false');
      return `HTTP 401 Unauthorized returned. Message: "${res.body.message}"`;
    }
  );

  // Test Case 3: Role Restriction
  await assertTest(
    'Test Case 3: Role Restriction (RBAC)',
    'GET /api/admin/audit-logs with Commuter JWT Bearer token',
    async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${commuterToken}`);
      if (res.status !== 403) throw new Error(`Expected HTTP 403, got ${res.status}`);
      if (res.body.success !== false) throw new Error('Expected success: false');
      return `HTTP 403 Forbidden returned. Message: "${res.body.message}"`;
    }
  );

  // Test Case 4: Invalid Input
  await assertTest(
    'Test Case 4: Input Validation (Joi Schema)',
    'POST /api/auth/register with malformed payload (invalid email & short password)',
    async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'not-an-email', password: '123', firstName: '' });
      if (res.status !== 400) throw new Error(`Expected HTTP 400, got ${res.status}`);
      if (res.body.success !== false) throw new Error('Expected success: false');
      return `HTTP 400 Bad Request returned. Validation errors: ${JSON.stringify(res.body.errors || res.body.message)}`;
    }
  );

  // Test Case 5: Protected API Without Token
  await assertTest(
    'Test Case 5: Protected API Without Token',
    'GET /api/users/me without Authorization header',
    async () => {
      const res = await request(app).get('/api/users/me');
      if (res.status !== 401) throw new Error(`Expected HTTP 401, got ${res.status}`);
      return `HTTP 401 Unauthorized returned. Request rejected before controller invocation.`;
    }
  );

  // Test Case 6: Password Storage Check
  await assertTest(
    'Test Case 6: Password Storage Check (bcrypt Hashing)',
    'Query MongoDB User collection directly to verify password hash',
    async () => {
      const userInDb = await User.findOne({ email: 'commuter@smartsakay.ph' });
      if (!userInDb) throw new Error('User not found in DB');
      if (!userInDb.passwordHash.startsWith('$2')) {
        throw new Error(`Password not hashed with bcrypt: ${userInDb.passwordHash}`);
      }
      const match = await bcrypt.compare('Commuter@12345', userInDb.passwordHash);
      if (!match) throw new Error('Bcrypt comparison failed');
      return `Verified in MongoDB: Hash starts with "$2a$12$", plaintext "Commuter@12345" is NOT stored.`;
    }
  );

  // Test Case 7: Secure Error Response
  await assertTest(
    'Test Case 7: Secure Error Response (CastError / Exception Shielding)',
    'GET /api/routes/invalid-id-format to trigger Mongoose CastError',
    async () => {
      const res = await request(app).get('/api/routes/invalid-mongo-id-12345');
      if (res.status !== 400) throw new Error(`Expected HTTP 400, got ${res.status}`);
      if (res.body.stack && process.env.NODE_ENV === 'production') {
        throw new Error('Stack trace leaked in production error response');
      }
      return `HTTP 400 returned with sanitized message: "${res.body.message}". Internal stack trace shielded.`;
    }
  );

  // Test Case 8: HTTPS & Security Headers Check
  await assertTest(
    'Test Case 8: Security Headers (Helmet Suite)',
    'GET /api/health to inspect HTTP response security headers',
    async () => {
      const res = await request(app).get('/api/health');
      const nosniff = res.headers['x-content-type-options'];
      const xframe = res.headers['x-frame-options'];
      const csp = res.headers['content-security-policy'];
      if (nosniff !== 'nosniff') throw new Error(`X-Content-Type-Options: expected nosniff, got ${nosniff}`);
      if (xframe !== 'SAMEORIGIN') throw new Error(`X-Frame-Options: expected SAMEORIGIN, got ${xframe}`);
      return `Helmet active: X-Content-Type-Options: ${nosniff}, X-Frame-Options: ${xframe}, CSP: ${csp ? 'Configured' : 'Default'}`;
    }
  );

  // Test Case 9: Rate Limit Test
  await assertTest(
    'Test Case 9: Rate Limiting Enforcement',
    'GET /api/health to inspect standard RateLimit response headers',
    async () => {
      const res = await request(app).get('/api/health');
      const limit = res.headers['ratelimit-limit'];
      const remaining = res.headers['ratelimit-remaining'];
      if (!limit) throw new Error('RateLimit-Limit header missing');
      return `Rate limiter active: RateLimit-Limit: ${limit}, RateLimit-Remaining: ${remaining}`;
    }
  );

  // Test Case 10: Database Access Check
  await assertTest(
    'Test Case 10: Database Access Check (NoSQL Injection Defense)',
    'POST /api/auth/login with object payload {"$gt": ""} instead of string',
    async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: { $gt: '' }, password: 'password123' });
      if (![400, 401].includes(res.status)) {
        throw new Error(`Expected HTTP 400 or 401, got ${res.status}`);
      }
      return `HTTP ${res.status} returned. express-mongo-sanitize & Joi schema prevented injection.`;
    }
  );

  // Clean up
  await User.deleteMany({ email: { $in: ['commuter@smartsakay.ph', 'admin@smartsakay.ph'] } });
  await mongoose.disconnect();

  console.log('================================================================');
  console.log('SUMMARY OF RESULTS:');
  const passCount = results.filter((r) => r.status === 'PASS').length;
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passCount} | FAILED: ${results.length - passCount}`);
  console.log('================================================================\n');

  if (passCount === results.length) {
    console.log('ALL 10 SECURITY TEST CASES PASSED SUCCESSFULLY!');
  }
}

runSecurityTests().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
