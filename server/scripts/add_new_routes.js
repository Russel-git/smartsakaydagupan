const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Connect DB config
const connectDB = require('../src/config/db');
const Route = require('../src/models/Route');
const Fare = require('../src/models/Fare');
const FareMatrix = require('../src/models/FareMatrix');
const fareCalculator = require('../src/services/fareCalculator');

const scratchDir = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\05de6fbf-3bcf-4d6b-90e9-4f8e2a6e7305\\scratch';
const r1 = JSON.parse(fs.readFileSync(path.join(scratchDir, 'r1_bolosan_highway.json')));
const r2 = JSON.parse(fs.readFileSync(path.join(scratchDir, 'r2_salisay_bolosan_oldroad.json')));
const w1 = JSON.parse(fs.readFileSync(path.join(scratchDir, 'w1.json')));
const w2 = JSON.parse(fs.readFileSync(path.join(scratchDir, 'w2.json')));

// Snap r1 end point to exact start point for 0.00m gap
r1.path[r1.path.length - 1] = { lat: 16.04673, lng: 120.36467 };
w1[w1.length - 1].lat = 16.04673;
w1[w1.length - 1].lng = 120.36467;

const route1 = {
  name: "Bolosan (Highway) - Tambac - Downtown",
  code: "BOLOSAN_HIGHWAY",
  category: "city",
  description: "Fixed loop corridor connecting Bolosan via Dagupan-San Fabian Highway, Tambac, Perez Blvd, A.B. Fernandez, and Downtown commercial center.",
  corridor: "Bolosan Highway — Tambac — Perez Blvd — A.B. Fernandez — Downtown Loop",
  distanceKm: 7.5,
  isLoop: true,
  startPoint: {
    name: "Bolosan Highway Waiting Shed / Terminal",
    lat: 16.04673,
    lng: 120.36467
  },
  endPoint: {
    name: "Bolosan Highway Waiting Shed / Terminal",
    lat: 16.04673,
    lng: 120.36467
  },
  terminalLocation: {
    name: "Bolosan Highway Terminal Depot",
    address: "Dagupan-San Fabian Highway, Brgy. Bolosan, Dagupan City",
    lat: 16.04673,
    lng: 120.36467
  },
  operatingHours: {
    start: "05:00",
    end: "21:00"
  },
  waypoints: w1,
  path: r1.path
};

const route2 = {
  name: "Salisay - Bolosan (Old Road) - Tambac - Downtown",
  code: "SALISAY_BOLOSAN_OLD_ROAD",
  category: "city",
  description: "Fixed loop corridor connecting Salisay, Bolosan via Old Road, Tambac, Perez Blvd, M.H. Del Pilar, and Downtown commercial core.",
  corridor: "Salisay — Bolosan Old Road — Tambac — Perez Blvd — Downtown Loop",
  distanceKm: 9.2,
  isLoop: true,
  startPoint: {
    name: "Salisay Barangay Plaza / Terminal",
    lat: 16.04195,
    lng: 120.37146
  },
  endPoint: {
    name: "Salisay Barangay Plaza / Terminal",
    lat: 16.04195,
    lng: 120.37146
  },
  terminalLocation: {
    name: "Salisay Jeepney Terminal Depot",
    address: "Salisay Road, Brgy. Salisay, Dagupan City",
    lat: 16.04195,
    lng: 120.37146
  },
  operatingHours: {
    start: "05:00",
    end: "21:00"
  },
  waypoints: w2,
  path: r2.path
};

async function run() {
  const routeSeedsPath = path.join(__dirname, '../src/seeds/routeSeeds.js');
  let currentSeeds = require(routeSeedsPath);

  // Filter out any previous existing versions of these two codes if present
  currentSeeds = currentSeeds.filter(r => r.code !== 'BOLOSAN_HIGHWAY' && r.code !== 'SALISAY_BOLOSAN_OLD_ROAD');
  currentSeeds.push(route1);
  currentSeeds.push(route2);

  const fileContent = `// SmartSakay Dagupan — Verified Static Jeepney Routes (GPX Mapped)\nconst routeSeedData = ${JSON.stringify(currentSeeds, null, 2)};\n\nmodule.exports = routeSeedData;\n`;
  fs.writeFileSync(routeSeedsPath, fileContent, 'utf8');
  console.log(`Updated routeSeeds.js with ${currentSeeds.length} total routes.`);

  // Connect to DB and upsert routes + fare matrix
  await connectDB();
  console.log('Connected to MongoDB.');

  const fares = await Fare.find({ isActive: true });
  console.log(`Found ${fares.length} active fare structures.`);

  for (const rData of [route1, route2]) {
    const updatedRoute = await Route.findOneAndUpdate(
      { code: rData.code },
      rData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`Upserted route: ${updatedRoute.name} (${updatedRoute.code}) - ${updatedRoute.distanceKm} km, ${updatedRoute.path.length} path pts`);

    // Remove old fare matrix entries for this route
    await FareMatrix.deleteMany({ routeId: updatedRoute._id });

    // Generate new fare matrix entries
    for (const fare of fares) {
      const regResult = fareCalculator.calculate(
        updatedRoute.distanceKm, fare.baseFare, fare.baseDistanceKm, fare.perKmRate
      );
      const discResult = fareCalculator.calculate(
        updatedRoute.distanceKm, fare.baseFare, fare.baseDistanceKm, fare.perKmRate, 'discounted'
      );
      await FareMatrix.create({
        routeId: updatedRoute._id,
        fareId: fare._id,
        vehicleType: fare.vehicleType,
        regularFare: regResult.regularFare,
        discountedFare: discResult.discountedFare,
        distanceKm: updatedRoute.distanceKm,
        isActive: true
      });
      console.log(`  Created FareMatrix [${fare.vehicleType}]: Reg ₱${regResult.regularFare}, Disc ₱${discResult.discountedFare}`);
    }
  }

  const allRoutes = await Route.find({});
  console.log('\n=== CURRENT DATABASE ROUTES ===');
  allRoutes.forEach(r => {
    console.log(`- ${r.name} (${r.code}) | ${r.distanceKm} km | Loop: ${r.isLoop} | Path points: ${r.path.length}`);
  });

  process.exit(0);
}

run().catch(err => {
  console.error('Error adding routes:', err);
  process.exit(1);
});
