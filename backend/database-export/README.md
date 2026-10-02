# SmartSakay Dagupan — Database Export

This directory contains the complete MongoDB database export for SmartSakay Dagupan.

## What is in here?
Each `.json` file corresponds to a MongoDB collection:
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
In the `server` directory, run:
```bash
npm run db:import
```
*(Or: `node scripts/import-database.js`)*

### Method 2: Using MongoDB Compass GUI
1. Open MongoDB Compass and connect to `mongodb://127.0.0.1:27017`.
2. Select or create the database named `smartsakay`.
3. For each collection:
   - Click **Create Collection** (e.g. `routes`, `fares`, `users`, etc.).
   - Click the **Add Data** dropdown -> select **Import JSON or CSV**.
   - Choose the corresponding `.json` file from this folder.
   - Click **Import**.
