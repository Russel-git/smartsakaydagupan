# Multi-LGU & Commuter Multi-Municipality Expansion Design

## 1. Executive Summary
This design scales SmartSakay from a single-city focus (Dagupan City) into a multi-municipality platform across neighboring Pangasinan towns (Dagupan, Calasiao, Binmaley, Lingayen, Mangaldan). It enables the Superadmin to provision distinct LGU municipal accounts with localized jurisdictions and provides commuters with a town selector both at Sign-In and as an in-app Quick-Switch bar to dynamically filter routes, terminals, and fare tariffs.

---

## 2. Target Municipalities & Geospatial Anchors
The system officially supports 5 initial municipal transit hubs in Pangasinan:
1. **Dagupan City** (Center: `16.0433° N, 120.3397° E`)
2. **Calasiao** (Center: `16.0125° N, 120.3586° E`)
3. **Binmaley** (Center: `16.0294° N, 120.2689° E`)
4. **Lingayen** (Center: `16.0217° N, 120.2319° E`)
5. **Mangaldan** (Center: `16.0694° N, 120.4022° E`)

---

## 3. Data Models & Database Schema

### 3.1 User Model (`models/User.js`)
* `municipality`: `{ type: String, trim: true, default: "Dagupan" }`
  * For `lgu` role: Represents their assigned government jurisdiction (e.g. `LGU Calasiao`).
  * For `poso` role: Represents their operating traffic unit.
  * For `commuter` role: Represents their preferred home/active municipality.

### 3.2 Route Model (`models/Route.js`)
* `municipalities`: `[{ type: String, trim: true, index: true }]`
* Enables multi-town coverage tagging:
  * Local routes (e.g. `BONUAN_TONDALIGAN`, `DOWNTOWN`) $\rightarrow$ `['Dagupan']`.
  * Intercity routes (e.g. `CALASIAO`) $\rightarrow$ `['Dagupan', 'Calasiao']`.
  * Intercity routes (e.g. `SAN_FABIAN_MANGALDAN_DAGUPAN`) $\rightarrow$ `['Dagupan', 'Mangaldan', 'San Fabian']`.
  * Intercity routes (e.g. `LINGAYEN_BINMALEY_DAGUPAN`) $\rightarrow$ `['Dagupan', 'Binmaley', 'Lingayen']`.

### 3.3 Terminal Model (`models/Terminal.js`)
* `municipality`: `{ type: String, trim: true, default: "Dagupan" }`

---

## 4. API & Controller Enhancements
* `GET /api/routes?municipality=Mangaldan`: Filters routes that include `"Mangaldan"` in their `municipalities` array.
* `GET /api/terminals?municipality=Mangaldan`: Filters terminals located within Mangaldan.
* `POST /api/users` (Provision LGU): Accepts `municipality` from Admin to create localized LGU accounts.

---

## 5. Frontend Admin Portal: Provisioning Different LGUs
* In `frontend/admin/src/pages/UsersPage.jsx`:
  * Add LGU modal features a **"Municipality / City Jurisdiction"** dropdown.
  * Automatically sets department string based on town.
  * User table displays a distinctive badge: `[LGU Dagupan]`, `[LGU Calasiao]`, `[LGU Mangaldan]`, etc.

---

## 6. Frontend Mobile App: Commuter Town Selection
* In `frontend/mobile/src/screens/auth/LoginScreen.js`:
  * Commuters can select their active municipality on sign in.
* In `frontend/mobile/src/screens/map/MapScreen.js` & Header:
  * A **Quick-Switch Municipality Pill** allows commuters to switch between towns in real time with 1 tap.
  * Switching to a town automatically animates map camera to that town's coordinates and reloads the filtered routes and terminals.
