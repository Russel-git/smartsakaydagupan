const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const User = require("../src/models/User");

const targetAccounts = [
  {
    email: "admin@smartsakay.com",
    password: "Admin@12345",
    firstName: "Developer",
    lastName: "Superadmin",
    role: "admin",
    department: "Management Information Systems",
    isVerified: true,
    isActive: true,
  },
  {
    email: "admin@gmail.com",
    password: "Admin@12345",
    firstName: "Developer",
    lastName: "Jhazper",
    role: "admin",
    department: "System Administration",
    isVerified: true,
    isActive: true,
  },
  {
    email: "rmanangan283@gmail.com",
    password: "Admin@12345",
    firstName: "Mr. Jake",
    lastName: "Mendoza",
    role: "admin",
    department: "Executive Administration",
    isVerified: true,
    isActive: true,
  },
  {
    email: "lgu@smartsakay.com",
    password: "Admin@12345",
    firstName: "City Transport",
    lastName: "Officer",
    role: "lgu",
    department: "City Transport & Public Safety Office (CTPSO)",
    isVerified: true,
    isActive: true,
  },
  {
    email: "poso@smartsakay.com",
    password: "Admin@12345",
    firstName: "Road Enforcer",
    lastName: "Officer",
    role: "poso",
    badgeNumber: "POSO-DAG-01",
    department: "Public Order & Safety Office (POSO)",
    assignedZone: "Poblacion / Lucao Sector",
    isVerified: true,
    isActive: true,
  },
];

async function sync() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(mongoUri);
    console.log("Connected successfully.");

    for (const acc of targetAccounts) {
      let user = await User.findOne({ email: acc.email });
      if (user) {
        user.firstName = acc.firstName || user.firstName;
        user.lastName = acc.lastName || user.lastName;
        user.role = acc.role;
        user.isVerified = true;
        user.isActive = true;
        user.failedLoginAttempts = 0;
        user.lockUntil = null;
        user.passwordHash = acc.password; // pre('save') hashes this
        if (acc.department) user.department = acc.department;
        if (acc.badgeNumber) user.badgeNumber = acc.badgeNumber;
        if (acc.assignedZone) user.assignedZone = acc.assignedZone;
        await user.save();
        console.log(`[UPDATED & SYNCED] ${acc.email} -> Role: ${acc.role}, Pwd: "${acc.password}"`);
      } else {
        user = new User({
          email: acc.email,
          passwordHash: acc.password, // pre('save') hashes this
          firstName: acc.firstName,
          lastName: acc.lastName,
          role: acc.role,
          department: acc.department || "",
          badgeNumber: acc.badgeNumber || "",
          assignedZone: acc.assignedZone || "",
          isVerified: true,
          isActive: true,
          failedLoginAttempts: 0,
          lockUntil: null,
        });
        await user.save();
        console.log(`[CREATED] ${acc.email} -> Role: ${acc.role}, Pwd: "${acc.password}"`);
      }
    }

    console.log("\n=== Verifying All Admin / Staff Accounts ===");
    const users = await User.find({ role: { $in: ["admin", "lgu", "poso"] } }).lean();
    for (const u of users) {
      console.log(`Role: ${u.role.padEnd(6)} | Email: ${u.email.padEnd(26)} | Active: ${u.isActive} | Verified: ${u.isVerified}`);
    }

    process.exit(0);
  } catch (err) {
    console.error("Sync error:", err);
    process.exit(1);
  }
}

sync();
