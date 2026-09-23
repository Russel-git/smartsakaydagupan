# SmartSakay Dagupan

A modern, cross-platform commuter transit system for Dagupan City and neighboring Pangasinan municipalities.

## 🚀 Key Capabilities

- **Fare Verification & Tariff Calculator:** Verified LTFRB base fares and succeeding kilometer rates for Traditional & Modern Jeepneys, with automatic 20% statutory discounts for Students, Senior Citizens, and PWDs.
- **Route & Terminal Locator:** Interactive directory of Dagupan PUV corridors (Downtown Dagupan to Bonuan Tondaligan Beach, Calasiao, San Fabian, Lingayen Capitol via Binmaley), terminal depots, and waypoint stops.
- **AI Commuter Assistant:** Intelligent transit advisor for local routes, fare computation, commuter rights, and safety advisories with resilient offline local fallback.
- **Weather & Commuter Advisories:** Dagupan weather conditions, forecasts, and transit delay advisories.
- **Grievance & Complaint Reporting:** Commuter reporting system for PUV overcharging, reckless driving, and route deviation with admin investigation workflow.
- **Admin Command Center (Web):** Full React + Vite dashboard running on port 3001 for managing LTFRB fare rates, routes, complaints, announcements, and commuter accounts.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Mobile App** | React Native / Expo SDK 57 (iOS, Android, Web) |
| **Admin Dashboard** | React 18 + Vite (SPA on Port 3001) |
| **Backend API** | Node.js + Express 5 (REST API on Port 5000) |
| **Database** | MongoDB + Mongoose 9 |
| **Icons & Design** | Lucide React / Material Community Icons / Vanilla CSS Design System |

---

## 🏁 Quickstart Guide

### 1. Backend Server Setup (`server/`)
```bash
cd server
npm install
npm test             # Run automated test suites (Auth, Fares, Routes)
node src/server.js   # Start server on http://localhost:5000
```
*To seed default Dagupan routes, LTFRB fares, and admin credentials:*
```bash
npm run seed
```
> **Default Admin Account:** `admin@smartsakay.com` / `Admin@12345`

### 2. Admin Web Dashboard (`admin/`)
```bash
cd admin
npm install
npm run dev          # Launches Vite dev server at http://localhost:3001
```
*To test production build:*
```bash
npm run build
```

### 3. Mobile Commuter App (`mobile/`)
```bash
cd mobile
npm install
npm start            # Starts Expo development server
```

---

## 🧪 Testing & Verification

Run the comprehensive test suite in `server/`:
```bash
cd server
npm test
```
- `auth.test.js`: Registration, duplicate prevention, verification, login, and health check
- `fare.test.js`: Tariff calculations, succeeding km rates, discounts, and fare endpoints
- `route.test.js`: Route catalog, waypoints, and route details
