const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Fare = require('../models/Fare');
const Route = require('../models/Route');
const FareMatrix = require('../models/FareMatrix');
const fareCalculator = require('../services/fareCalculator');
const config = require('../config/env');
const fareSeedData = require('./fareSeeds');
const routeSeedData = require('./routeSeeds');

const seed = async () => {
  try {
    await connectDB();
    console.log('Connected to database. Starting seed...');

    // Clear existing data
    await User.deleteMany({});
    await Fare.deleteMany({});
    await Route.deleteMany({});
    await FareMatrix.deleteMany({});
    console.log('Cleared existing data.');

    // Seed admin user
    const admin = await User.create({
      email: config.admin.email,
      passwordHash: config.admin.defaultPassword,
      firstName: 'System',
      lastName: 'Admin',
      role: 'admin',
      isVerified: true,
      isActive: true,
    });
    console.log(`Admin created: ${admin.email}`);

    // Seed fares
    const fares = await Fare.insertMany(fareSeedData);
    console.log(`Seeded ${fares.length} fare records.`);

    // Seed routes
    const routes = await Route.insertMany(routeSeedData);
    console.log(`Seeded ${routes.length} routes.`);

    // Generate fare matrix
    let matrixCount = 0;
    for (const route of routes) {
      for (const fare of fares) {
        const regResult = fareCalculator.calculate(
          route.distanceKm, fare.baseFare, fare.baseDistanceKm, fare.perKmRate
        );
        const discResult = fareCalculator.calculate(
          route.distanceKm, fare.baseFare, fare.baseDistanceKm, fare.perKmRate, 'student'
        );
        await FareMatrix.create({
          routeId: route._id, fareId: fare._id, vehicleType: fare.vehicleType,
          regularFare: regResult.regularFare, discountedFare: discResult.discountedFare,
          distanceKm: route.distanceKm, isActive: true,
        });
        matrixCount++;
      }
    }
    console.log(`Generated ${matrixCount} fare matrix entries.`);

    console.log('\n=== Seed completed successfully! ===');
    console.log(`Admin login: ${config.admin.email} / ${config.admin.defaultPassword}`);

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
