const request = require('supertest');
const mongoose = require('mongoose');
const os = require('os');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Fare = require('../src/models/Fare');
const fareCalculator = require('../src/services/fareCalculator');

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    binary: { version: '7.0.20' },
  });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { runtimeAdapters: { os } });
  app = require('../src/app');
}, 60000);

afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop({ doCleanup: true });
  }
});

describe('Fare Calculator Engine', () => {
  it('should calculate base fare correctly for traditional jeepney within 4km', () => {
    const result = fareCalculator.calculate(3.5, 13, 4, 1.8, 'student');
    expect(result.regularFare).toBe(13);
    expect(result.discountedFare).toBe(11); // Math.ceil(13 * 0.8 = 10.4) = 11
  });

  it('should calculate succeeding km rate beyond base distance', () => {
    // 10km total - 4km base = 6km succeeding * 1.80 = 10.80 + 13 = 23.80 -> Math.ceil = 24
    const result = fareCalculator.calculate(10, 13, 4, 1.8, 'senior');
    expect(result.regularFare).toBe(24);
    expect(result.discountedFare).toBe(20); // Math.ceil(23.8 * 0.8 = 19.04) = 20
  });

  it('should calculate modern jeepney rate properly', () => {
    // 15 base + (6 * 2.2) = 15 + 13.2 = 28.2 -> Math.ceil = 29
    const result = fareCalculator.calculate(10, 15, 4, 2.2);
    expect(result.regularFare).toBe(29);
    expect(result.discountedFare).toBe(29); // no discount specified
  });
});

describe('Fare Endpoints', () => {
  beforeEach(async () => {
    await Fare.create([
      {
        vehicleType: 'traditional',
        baseFare: 13,
        baseDistanceKm: 4,
        perKmRate: 1.8,
        effectiveDate: new Date(),
        isActive: true,
      },
      {
        vehicleType: 'modern',
        baseFare: 15,
        baseDistanceKm: 4,
        perKmRate: 2.2,
        effectiveDate: new Date(),
        isActive: true,
      },
    ]);
  });

  it('GET /api/fares should return active fares', async () => {
    const res = await request(app).get('/api/fares');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  it('GET /api/fares/calculate should calculate fare for query params', async () => {
    const res = await request(app)
      .get('/api/fares/calculate')
      .query({ distanceKm: 8, vehicleType: 'traditional', discountType: 'student' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.regularFare).toBeGreaterThan(0);
    expect(res.body.data.discountedFare).toBeLessThan(res.body.data.regularFare);
  });
});
