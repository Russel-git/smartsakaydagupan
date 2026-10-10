const dns = require('dns');
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const mongoose = require('mongoose');
const config = require('../src/config/env');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');

const seedAccounts = [
  {
    email: 'admin@smartsakay.com',
    password: 'Admin@12345',
    firstName: 'System',
    lastName: 'Administrator',
    role: 'admin',
    department: 'Management Information Systems',
    isVerified: true,
    isActive: true,
  },
  {
    email: 'lgu@smartsakay.com',
    password: 'Admin@12345',
    firstName: 'City Transport',
    lastName: 'Officer',
    role: 'lgu',
    department: 'City Transport & Public Safety Office (CTPSO)',
    isVerified: true,
    isActive: true,
  },
  {
    email: 'poso@smartsakay.com',
    password: 'Admin@12345',
    firstName: 'Road Enforcer',
    lastName: 'Officer',
    role: 'poso',
    badgeNumber: 'POSO-DAG-01',
    department: 'Public Order & Safety Office (POSO)',
    assignedZone: 'Poblacion / Lucao Sector',
    isVerified: true,
    isActive: true,
  },
];

async function migrateAndSeed() {
  try {
    console.log('Connecting to database...');
    await connectDB();

    console.log('\n--- 1. Migrating legacy superadmin accounts to admin ---');
    const updateResult = await User.updateMany(
      { role: 'superadmin' },
      { $set: { role: 'admin' } }
    );
    console.log(`Migrated ${updateResult.modifiedCount} accounts from 'superadmin' to 'admin'.`);

    console.log('\n--- 2. Upserting Demo Presentation Accounts ---');
    for (const acc of seedAccounts) {
      let user = await User.findOne({ email: acc.email });
      if (user) {
        user.firstName = acc.firstName;
        user.lastName = acc.lastName;
        user.role = acc.role;
        user.department = acc.department || '';
        user.badgeNumber = acc.badgeNumber || '';
        user.assignedZone = acc.assignedZone || '';
        user.isVerified = true;
        user.isActive = true;
        user.passwordHash = acc.password; // pre('save') hook will hash this
        await user.save();
        console.log(`Updated account: ${acc.email} [${acc.role}]`);
      } else {
        user = new User({
          email: acc.email,
          passwordHash: acc.password, // pre('save') hook will hash this
          firstName: acc.firstName,
          lastName: acc.lastName,
          role: acc.role,
          department: acc.department || '',
          badgeNumber: acc.badgeNumber || '',
          assignedZone: acc.assignedZone || '',
          isVerified: true,
          isActive: true,
        });
        await user.save();
        console.log(`Created account: ${acc.email} [${acc.role}]`);
      }
    }

    console.log('\n--- 3. Verifying Accounts in Database ---');
    const allAdmins = await User.find({ role: { $in: ['admin', 'lgu', 'poso'] } }).select('email role firstName lastName isActive badgeNumber');
    console.table(allAdmins.map(u => ({
      email: u.email,
      role: u.role,
      name: `${u.firstName} ${u.lastName}`,
      isActive: u.isActive,
      badge: u.badgeNumber || 'N/A'
    })));

    console.log('\nMigration and seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateAndSeed();
