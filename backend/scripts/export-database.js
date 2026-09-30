const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { EJSON } = require('bson');
const connectDB = require('../src/config/db');

const exportDir = path.join(__dirname, '..', 'database-export');

const exportDatabase = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();
    const db = mongoose.connection.db;

    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const collections = await db.listCollections().toArray();
    console.log(`\nFound ${collections.length} collections. Starting export to: ${exportDir}\n`);

    const summary = [];

    for (const collInfo of collections) {
      const collName = collInfo.name;
      if (collName.startsWith('system.')) continue;

      const coll = db.collection(collName);
      const docs = await coll.find({}).toArray();

      const filePath = path.join(exportDir, `${collName}.json`);
      const jsonData = EJSON.stringify(docs, { relaxed: true, indent: 2 });
      fs.writeFileSync(filePath, jsonData, 'utf-8');

      const stats = fs.statSync(filePath);
      summary.push({
        Collection: collName,
        Documents: docs.length,
        File: `${collName}.json`,
        Size: `${(stats.size / 1024).toFixed(2)} KB`
      });
    }

    console.table(summary);
    console.log(`\nAll collections successfully exported to: ${exportDir}`);

    // Create a README in the export directory
    const readmeContent = `# SmartSakay Dagupan — Database Export

This directory contains the complete MongoDB database export for SmartSakay Dagupan.

## What is in here?
Each \`.json\` file corresponds to a MongoDB collection:
- **routes.json**: Dagupan transit routes with GPS coordinates and waypoints
- **fares.json**: Official LTFRB and Dagupan City fare parameters
- **farematrixes.json**: Calculated fare matrix entries across all routes and vehicle types
- **terminals.json**: Dagupan transport terminals (bus and jeepney depots)
- **users.json**: All user accounts (superadmin, admin, lgu, commuter) with bcrypt password hashes
- **complaints.json**: Commuter complaints, feedback, and issue tracking records
- **chathistories.json**: SmartSakay Dagupan AI Assistant (SakayBot) chat records
- **notifications.json**: System notices, alerts, and advisories
- **auditlogs.json**: Administrative audit trails and activity logs

---

## How your teammate can import this data

### Method 1: One-Click Terminal Command (Easiest)
In the \`server\` directory, run:
\`\`\`bash
npm run db:import
\`\`\`
*(Or: \`node scripts/import-database.js\`)*

### Method 2: Using MongoDB Compass GUI
1. Open MongoDB Compass and connect to \`mongodb://127.0.0.1:27017\`.
2. Select or create the database named \`smartsakay\`.
3. For each collection:
   - Click **Create Collection** (e.g. \`routes\`, \`fares\`, \`users\`, etc.).
   - Click the **Add Data** dropdown -> select **Import JSON or CSV**.
   - Choose the corresponding \`.json\` file from this folder.
   - Click **Import**.
`;

    fs.writeFileSync(path.join(exportDir, 'README.md'), readmeContent, 'utf-8');
    process.exit(0);
  } catch (error) {
    console.error('Export failed:', error);
    process.exit(1);
  }
};

exportDatabase();
