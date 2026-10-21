const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Route = require('../models/Route');
const Terminal = require('../models/Terminal');
const User = require('../models/User');

const ROUTE_MUNICIPALITY_MAPPING = {
  CSI_LUCAO: ['Dagupan'],
  DOWNTOWN: ['Dagupan'],
  CALASIAO: ['Dagupan', 'Calasiao'],
  BONUAN_TONDALIGAN: ['Dagupan'],
  BOLOSAN_HIGHWAY: ['Dagupan', 'Mangaldan'],
  SALISAY_BOLOSAN_OLD_ROAD: ['Dagupan'],
  BONUAN_BINLOC: ['Dagupan', 'San Fabian'],
  SAN_FABIAN_MANGALDAN_DAGUPAN: ['Dagupan', 'Mangaldan', 'San Fabian'],
  LINGAYEN_BINMALEY_DAGUPAN: ['Dagupan', 'Binmaley', 'Lingayen'],
  'CALASIAO TO BUENLAG': ['Calasiao'],
};

const MUNICIPAL_TERMINALS = [
  {
    name: 'Mangaldan Public Jeepney & UV Terminal',
    company: 'Mangaldan Transport Federation',
    type: 'jeepney',
    address: 'Rizal Avenue, Poblacion, Mangaldan, Pangasinan',
    lat: 16.0694,
    lng: 120.4022,
    contactNumber: '(075) 540-2100',
    operatingHours: '05:00 AM - 09:00 PM',
    destinations: ['Dagupan City', 'San Fabian', 'Mapandan', 'San Jacinto'],
    amenities: ['Covered Waiting Area', 'Ticketing Booth', 'Restrooms'],
    description: 'Central transit terminal in Mangaldan connecting commuters directly to Dagupan Downtown and neighboring municipalities.',
    municipality: 'Mangaldan',
    isActive: true,
  },
  {
    name: 'Calasiao Public Transport Hub',
    company: 'Calasiao Jeepney Operators & Drivers Association',
    type: 'jeepney',
    address: 'MacArthur Highway near Poblacion, Calasiao, Pangasinan',
    lat: 16.0125,
    lng: 120.3586,
    contactNumber: '(075) 522-7711',
    operatingHours: '05:00 AM - 09:30 PM',
    destinations: ['Dagupan City (Downtown / Perez)', 'Santa Barbara', 'San Carlos City'],
    amenities: ['Covered Loading Shed', 'Restroom', 'Food Kiosks'],
    description: 'Primary passenger hub in Calasiao serving daily commuters travelling to and from Dagupan City commercial centers.',
    municipality: 'Calasiao',
    isActive: true,
  },
  {
    name: 'Binmaley Municipal Jeepney Terminal',
    company: 'Binmaley-Dagupan Transport Service',
    type: 'jeepney',
    address: 'Poblacion, Binmaley, Pangasinan',
    lat: 16.0294,
    lng: 120.2689,
    contactNumber: '(075) 543-3200',
    operatingHours: '05:00 AM - 08:30 PM',
    destinations: ['Dagupan City (Lucao / Downtown)', 'Lingayen Provincial Capitol'],
    amenities: ['Passenger Benches', 'Lighting', 'POSO Assistance Post'],
    description: 'Municipal terminal facilitating smooth transfers between coastal Dagupan, Binmaley town proper, and the provincial capital.',
    municipality: 'Binmaley',
    isActive: true,
  },
  {
    name: 'Lingayen Provincial Capitol Terminal',
    company: 'Lingayen Transit Cooperative',
    type: 'jeepney',
    address: 'Alvear St, Lingayen, Pangasinan',
    lat: 16.0217,
    lng: 120.2319,
    contactNumber: '(075) 542-6100',
    operatingHours: '05:00 AM - 09:00 PM',
    destinations: ['Dagupan City', 'Binmaley', 'Labrador', 'Bugallon', 'Alaminos City'],
    amenities: ['Spacious Waiting Hall', 'Restroom', 'Information Desk'],
    description: 'Capital transport terminal serving government employees, students, and inter-city commuters traveling to Dagupan.',
    municipality: 'Lingayen',
    isActive: true,
  },
];

const migrate = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB. Running Multi-Municipality Migration...');

    // 1. Update Routes with coverage tags
    const routes = await Route.find({});
    console.log(`Found ${routes.length} existing routes.`);
    for (const route of routes) {
      const mapped = ROUTE_MUNICIPALITY_MAPPING[route.code] || ['Dagupan'];
      route.municipalities = mapped;
      await route.save();
      console.log(`Updated route ${route.code} (${route.name}) with municipalities: ${mapped.join(', ')}`);
    }

    // 2. Ensure existing terminals have municipality defaulted to Dagupan
    const terminals = await Terminal.find({});
    console.log(`Found ${terminals.length} existing terminals.`);
    for (const t of terminals) {
      if (!t.municipality) {
        t.municipality = 'Dagupan';
        await t.save();
        console.log(`Set municipality='Dagupan' for terminal ${t.name}`);
      }
    }

    // 3. Seed municipal terminals for Calasiao, Binmaley, Lingayen, Mangaldan if not yet created
    for (const mTerm of MUNICIPAL_TERMINALS) {
      const exists = await Terminal.findOne({ name: mTerm.name });
      if (!exists) {
        await Terminal.create(mTerm);
        console.log(`Created municipal terminal for ${mTerm.municipality}: ${mTerm.name}`);
      } else {
        exists.municipality = mTerm.municipality;
        await exists.save();
        console.log(`Updated terminal ${mTerm.name} with municipality ${mTerm.municipality}`);
      }
    }

    // 4. Update Users: default missing municipality to 'Dagupan'
    const users = await User.find({ municipality: { $exists: false } });
    for (const u of users) {
      u.municipality = 'Dagupan';
      await u.save();
    }
    console.log(`Updated ${users.length} users with default municipality 'Dagupan'.`);

    // 5. Update Complaints: default missing municipality to 'Dagupan'
    const Complaint = require('../models/Complaint');
    const compResult = await Complaint.updateMany(
      { municipality: { $exists: false } },
      { $set: { municipality: 'Dagupan' } }
    );
    console.log(`Tagged legacy complaints with municipality 'Dagupan' (matched: ${compResult.matchedCount || compResult.n || 0}).`);

    // 6. Ensure sample complaint for Calasiao exists
    const calasiaoComp = await Complaint.findOne({ municipality: 'Calasiao' });
    if (!calasiaoComp) {
      const commuterUser = await User.findOne({ role: 'commuter' }) || await User.findOne();
      const calasiaoRoute = await Route.findOne({ code: 'CALASIAO' });
      if (commuterUser) {
        await Complaint.create({
          userId: commuterUser._id,
          category: 'overcharging',
          subject: 'Unauthorized Fare Overcharge along MacArthur Highway Calasiao',
          description: 'Jeepney driver demanded 25 pesos minimum regular fare instead of standard LTFRB matrix near Calasiao Plaza.',
          vehiclePlateNumber: 'ABC 5421',
          routeId: calasiaoRoute ? calasiaoRoute._id : null,
          location: { address: 'Poblacion, Calasiao, Pangasinan', lat: 16.0125, lng: 120.3586 },
          status: 'endorsed_to_lgu',
          municipality: 'Calasiao',
          lguCaseNumber: 'CAL-2026-0042',
        });
        console.log('Created sample Calasiao complaint for LGU Calasiao testing.');
      }
    }

    // 7. Update Notifications: default missing municipality to 'Dagupan'
    const Notification = require('../models/Notification');
    const notifResult = await Notification.updateMany(
      { municipality: { $exists: false } },
      { $set: { municipality: 'Dagupan' } }
    );
    console.log(`Tagged legacy notifications with municipality 'Dagupan' (matched: ${notifResult.matchedCount || notifResult.n || 0}).`);

    // Ensure sample notification for Calasiao exists
    const calasiaoNotif = await Notification.findOne({ municipality: 'Calasiao' });
    if (!calasiaoNotif) {
      const calasiaoLgu = await User.findOne({ role: 'lgu', municipality: 'Calasiao' });
      await Notification.create({
        userId: null,
        title: 'Calasiao Poblacion Transit Rerouting Advisory',
        message: 'All PUVs traveling along MacArthur Highway approaching Calasiao Plaza are advised to use the bypass road due to scheduled municipal road maintenance.',
        type: 'broadcast',
        category: 'broadcast_by_admin',
        severity: 'warning',
        locationArea: 'MacArthur Highway, Calasiao',
        municipality: 'Calasiao',
        status: 'published',
        createdByRole: 'lgu',
        authorUser: calasiaoLgu ? calasiaoLgu._id : null,
      });
      console.log('Created sample Calasiao road notification.');
    }

    console.log('Multi-Municipality Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
