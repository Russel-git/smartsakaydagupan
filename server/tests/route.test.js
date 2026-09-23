const request = require('supertest');
const mongoose = require('mongoose');
const os = require('os');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Route = require('../src/models/Route');

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

describe('Route Endpoints', () => {
  let createdRoute;

  beforeEach(async () => {
    createdRoute = await Route.create({
      name: 'Downtown - Bonuan Tondaligan',
      code: 'DAG-BON',
      category: 'city',
      distanceKm: 7.2,
      startPoint: { name: 'Perez Market Terminal', lat: 16.0433, lng: 120.3342 },
      endPoint: { name: 'Tondaligan Beach Park', lat: 16.0822, lng: 120.3475 },
      waypoints: [
        { name: 'Perez Blvd', lat: 16.045, lng: 120.335, order: 1 },
        { name: 'Dawel Bridge', lat: 16.058, lng: 120.341, order: 2 },
      ],
      terminalLocation: {
        name: 'Downtown Terminal',
        address: 'Perez Blvd, Dagupan City',
        lat: 16.0433,
        lng: 120.3342,
      },
      operatingHours: { start: '05:00', end: '21:00' },
      isActive: true,
    });
  });

  it('GET /api/routes should return list of active routes', async () => {
    const res = await request(app).get('/api/routes');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].code).toBe('DAG-BON');
  });

  it('GET /api/routes/:id should return single route detail', async () => {
    const res = await request(app).get(`/api/routes/${createdRoute._id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Downtown - Bonuan Tondaligan');
    expect(res.body.data.waypoints.length).toBe(2);
  });

  it('GET /api/routes/invalid-id should return 400 or 404', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/routes/${fakeId}`);
    expect(res.status).toBe(404);
  });
});
