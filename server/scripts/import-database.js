const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { EJSON } = require('bson');
const connectDB = require('../src/config/db');

const exportDir = path.join(__dirname, '..', 'database-export');

const importDatabase = async () => {
  try {
    if (!fs.existsSync(exportDir)) {
      console.error(`Export directory not found at: ${exportDir}`);
      process.exit(1);
    }

    console.log('Connecting to database...');
    await connectDB();
    const db = mongoose.connection.db;

    const files = fs.readdirSync(exportDir).filter(f => f.endsWith('.json'));
    if (files.length === 0) {
      console.warn('No .json files found in database-export directory.');
      process.exit(0);
    }

    console.log(`\nFound ${files.length} collection dump files. Starting import...\n`);
    const summary = [];

    for (const file of files) {
      const collName = path.basename(file, '.json');
      const filePath = path.join(exportDir, file);
      const rawContent = fs.readFileSync(filePath, 'utf-8');

      if (!rawContent.trim()) {
        continue;
      }

      const docs = EJSON.parse(rawContent);

      if (Array.isArray(docs) && docs.length > 0) {
        const coll = db.collection(collName);

        // Clear existing data in collection before importing
        await coll.deleteMany({});

        // Insert documents
        const result = await coll.insertMany(docs);
        summary.push({
          Collection: collName,
          Imported: result.insertedCount,
          SourceFile: file,
          Status: 'SUCCESS'
        });
      } else {
        summary.push({
          Collection: collName,
          Imported: 0,
          SourceFile: file,
          Status: 'EMPTY'
        });
      }
    }

    console.table(summary);
    console.log('\n=== Database import completed successfully! ===\n');
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
};

importDatabase();
