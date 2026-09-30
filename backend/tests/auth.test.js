const request = require('supertest');
const mongoose = require('mongoose');
const os = require('os');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    binary: { version: '7.0.20' },
  });
  const uri = mongoServer.getUri();
  console.log('Connecting to:', uri);
  await mongoose.connect(uri, { runtimeAdapters: { os } });
  console.log('Connected! readyState:', mongoose.connection.readyState);
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
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop({ doCleanup: true });
  }
}, 30000);

// Import app and emailService AFTER db connection setup
const app = require('../src/app');
const emailService = require('../src/services/emailService');

describe('Auth Endpoints', () => {
  let lastSentCode = null;

  beforeEach(() => {
    lastSentCode = null;
    jest.spyOn(emailService, 'sendOtp').mockImplementation(async (email, code) => {
      lastSentCode = code;
      return true;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const testUser = {
    email: 'test@example.com',
    password: 'Test@1234',
    firstName: 'Juan',
    lastName: 'Dela Cruz',
  };

  describe('POST /api/auth/register and OTP Verification', () => {
    it('should register a new user pending OTP verification and not create DB user yet', async () => {
      const res = await request(app).post('/api/auth/register').send(testUser);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testUser.email);
      expect(res.body.data.requiresVerification).toBe(true);
      // Ensure devOtp is NEVER exposed in the API response
      expect(res.body.data.devOtp).toBeUndefined();

      // Account MUST NOT be in User collection yet
      const inDb = await mongoose.model('User').findOne({ email: testUser.email });
      expect(inDb).toBeNull();
    });

    it('should create account only when correct OTP code is verified', async () => {
      const regRes = await request(app).post('/api/auth/register').send(testUser);
      expect(regRes.status).toBe(201);
      expect(regRes.body.data.devOtp).toBeUndefined();
      const code = lastSentCode;
      expect(code).toBeDefined();

      // Wrong code -> rejects and user is NOT created
      const badRes = await request(app).post('/api/auth/verify-otp').send({ email: testUser.email, code: '999999' });
      expect(badRes.status).toBe(400);
      let inDb = await mongoose.model('User').findOne({ email: testUser.email });
      expect(inDb).toBeNull();

      // Correct code -> creates account and returns tokens
      const okRes = await request(app).post('/api/auth/verify-otp').send({ email: testUser.email, code });
      expect(okRes.status).toBe(200);
      expect(okRes.body.data.accessToken).toBeDefined();
      expect(okRes.body.data.user.email).toBe(testUser.email);

      inDb = await mongoose.model('User').findOne({ email: testUser.email });
      expect(inDb).not.toBeNull();
      expect(inDb.isVerified).toBe(true);

      // Duplicate registration after verified creation should be 409
      const dupRes = await request(app).post('/api/auth/register').send(testUser);
      expect(dupRes.status).toBe(409);
      expect(dupRes.body.success).toBe(false);
    });

    it('should reject weak password', async () => {
      const res = await request(app).post('/api/auth/register').send({ ...testUser, password: '123' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid email', async () => {
      const res = await request(app).post('/api/auth/register').send({ ...testUser, email: 'notanemail' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should reject unverified user', async () => {
      await request(app).post('/api/auth/register').send(testUser);
      const res = await request(app).post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('not verified');
    });

    it('should allow login once user is verified with OTP', async () => {
      await request(app).post('/api/auth/register').send(testUser);
      const code = lastSentCode;
      await request(app).post('/api/auth/verify-otp').send({ email: testUser.email, code });

      const loginRes = await request(app).post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data.accessToken).toBeDefined();
    });

    it('should reject wrong password for verified user', async () => {
      await request(app).post('/api/auth/register').send(testUser);
      const code = lastSentCode;
      await request(app).post('/api/auth/verify-otp').send({ email: testUser.email, code });

      const res = await request(app).post('/api/auth/login')
        .send({ email: testUser.email, password: 'WrongPass1' });
      expect(res.status).toBe(401);
    });

    it('should reject non-existent email', async () => {
      const res = await request(app).post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'Test@1234' });
      expect(res.status).toBe(401);
    });
  });
});

describe('Health Check', () => {
  it('GET /api/health should return success', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
