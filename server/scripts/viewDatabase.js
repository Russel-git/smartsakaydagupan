const mongoose = require('mongoose');
const connectDB = require('../src/config/db');

const viewDatabase = async () => {
  try {
    console.log('Connecting to database...');
    const conn = await connectDB();
    const db = mongoose.connection.db;

    console.log('\n================================================================================');
    console.log('  TRANSIT & COMMUTER DATABASE STATUS: SMARTSAKAY DAGUPAN');
    console.log(`  Connected Host : ${conn.connection.host}`);
    console.log(`  Database Name  : ${conn.connection.name}`);
    console.log('================================================================================\n');

    const collections = await db.listCollections().toArray();
    const summary = [];

    for (const c of collections) {
      if (c.name.startsWith('system.')) continue;
      const count = await db.collection(c.name).countDocuments();
      summary.push({
        'Collection Name': c.name,
        'Document Count': count,
        'Status': count > 0 ? 'ACTIVE (Has Data)' : 'EMPTY'
      });
    }

    console.table(summary);

    // Show preview of routes
    const routes = await db.collection('routes').find({}, { projection: { name: 1, code: 1, category: 1, distanceKm: 1 } }).limit(10).toArray();
    if (routes.length > 0) {
      console.log('\n--- ACTIVE ROUTES PREVIEW ---');
      console.table(routes.map(r => ({ Name: r.name, Code: r.code, Category: r.category, 'Distance (km)': r.distanceKm })));
    }

    // Show preview of users
    const users = await db.collection('users').find({}, { projection: { email: 1, role: 1, firstName: 1, lastName: 1, isVerified: 1 } }).toArray();
    if (users.length > 0) {
      console.log('\n--- REGISTERED USERS PREVIEW ---');
      console.table(users.map(u => ({ Email: u.email, Role: u.role, Name: `${u.firstName || ''} ${u.lastName || ''}`.trim(), Verified: u.isVerified })));
    }

    // Show preview of terminals
    const terminals = await db.collection('terminals').find({}, { projection: { name: 1, type: 1, address: 1 } }).limit(5).toArray();
    if (terminals.length > 0) {
      console.log('\n--- TRANSPORT TERMINALS PREVIEW ---');
      console.table(terminals.map(t => ({ Name: t.name, Type: t.type, Address: t.address })));
    }

    // Show preview of fares
    const fares = await db.collection('fares').find({}).toArray();
    if (fares.length > 0) {
      console.log('\n--- FARE RATES PREVIEW ---');
      console.table(fares.map(f => ({
        Vehicle: f.vehicleType,
        'Base Fare (PHP)': `₱${f.baseFare}`,
        'Base Dist (km)': `${f.baseDistanceKm} km`,
        'Per Km (PHP)': `₱${f.perKmRate}/km`
      })));
    }

    console.log('\n MongoDB is fully functional and populated for SmartSakay Dagupan!\n');
    process.exit(0);
  } catch (error) {
    console.error('Failed to view database:', error.message);
    process.exit(1);
  }
};

viewDatabase();
