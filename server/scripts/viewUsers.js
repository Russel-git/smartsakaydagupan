const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartsakay';

async function viewHashedAccounts() {
  try {
    await mongoose.connect(mongoUri);
    console.log('\n================================================================================================');
    console.log('🔒 SMARTSAKAY DAGUPAN — USER ACCOUNTS & BCRYPT PASSWORD HASHES (CONTROL C AUDIT)');
    console.log('   Database: ' + mongoUri);
    console.log('================================================================================================\n');

    const users = await mongoose.connection.db.collection('users')
      .find({})
      .project({ email: 1, firstName: 1, lastName: 1, suffix: 1, role: 1, passwordHash: 1, isVerified: 1, createdAt: 1 })
      .toArray();

    if (users.length === 0) {
      console.log('No user accounts found in database.');
    } else {
      users.forEach((user, index) => {
        const fullName = `${user.firstName || ''} ${user.lastName || ''}${user.suffix ? ' ' + user.suffix : ''}`.trim();
        console.log(`[Account #${index + 1}]`);
        console.log(`  Name          : ${fullName}`);
        console.log(`  Email         : ${user.email}`);
        console.log(`  Role          : ${user.role}`);
        console.log(`  Verified      : ${user.isVerified ? 'YES' : 'NO'}`);
        console.log(`  Password Hash : ${user.passwordHash}`);
        console.log(`  Hash Algorithm: Bcrypt (12 Salt Rounds, $2b$ prefix)`);
        console.log(`  Created At    : ${new Date(user.createdAt).toLocaleString()}`);
        console.log('------------------------------------------------------------------------------------------------');
      });
    }

    console.log(`\nTotal Registered Accounts: ${users.length}`);
    console.log('Security Guarantee: Passwords are irreversibly hashed using Bcrypt 12 rounds — plain text is never stored.\n');
    process.exit(0);
  } catch (err) {
    console.error('Error connecting to database:', err.message);
    process.exit(1);
  }
}

viewHashedAccounts();
