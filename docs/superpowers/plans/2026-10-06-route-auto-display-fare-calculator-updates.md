# Route Auto-Display, San Fabian Corridor, and Dynamic Fare Calculator Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (recommended) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the new "San Fabian - Mangaldan - Dagupan" route (29.8 km), purge the obsolete "old devenecia" route, fix the route selection map auto-display and zoom framing so clicking any route card immediately isolates and fits bounds on that route, and update the Fare Calculator with automatic base fare + succeeding km increments and a live "get-off" trip fare calculator.

**Architecture:** 
1. Backend & Data Layer: Seed and upsert the 194-coordinate GPX route for "San Fabian - Mangaldan - Dagupan" (`SAN_FABIAN_MANGALDAN_DAGUPAN`, intercity, 29.8 km), remove the obsolete "old devenecia" route from MongoDB and exported datasets, and recalculate `FareMatrix` rates.
2. Mobile Map Display Layer: Update `RouteMapScreen.js` and Leaflet rendering so that tapping any route card immediately filters to that route alone, centers, and calls `map.fitBounds(routeBounds)` with padding and size invalidation, eliminating any need for commuters to manually zoom out.
3. Fare Calculator Layer: Upgrade `FareCalculatorScreen.js` and backend calculation service to provide an interactive distance/stop-based fare calculation (Base 4 km + succeeding km increments), along with an active ride odometer ("Board Jeepney" -> "Get Off / Alight") that calculates the exact actual fare to pay the driver upon alighting.

**Tech Stack:** React Native (Expo), Leaflet.js, OpenStreetMap, Node.js, Express, MongoDB (Mongoose), Vanilla CSS / React Native StyleSheet.

---

## Global Constraints
- Naming: Route name must be exact: `San Fabian - Mangaldan - Dagupan`.
- Category: `intercity` corridor.
- Purge: Complete deletion of `old devenecia` (`SAN CARLOS`).
- Map Responsiveness: When a route is clicked, no extra button is required to view it. The map must isolate that route and frame its entire bounds immediately.
- LTFRB Compliance: Base fare covers the first 4.0 km (₱14.00 traditional, ₱17.00 modern; ₱12.00 / ₱14.00 discounted). Each succeeding kilometer adds ₱2.00 / km (traditional) or ₱2.40 / km (modern). Fractions are ceiling-rounded to the next whole peso in accordance with LTFRB fare schedules.

---

## Review Focus
1. **Map Bounds Not Framing**: Leaflet inside mobile WebView sizing race condition where `fitBounds` executes before WebView layout completes. Solution: Call `invalidateSize()` and apply `fitBounds` with a safety delay and proper padding.
2. **Clicking Route Card Interaction**: Ensure tapping anywhere on the route card selects it and reflects on the map, without requiring the commuter to hunt for buttons.
3. **Show All Reset**: Ensure commuters can easily return to viewing all city routes via a prominent "Show All" toggle.
4. **Alighting Fare Accuracy**: The fare calculator must compute both fixed base distances (<=4 km) and long distances (>4 km) accurately, and allow commuters to either simulate or track distance to get the exact fare upon alighting.
5. **Database Consistency**: Synchronize both MongoDB active collections and `backend/database-export/routes.json`.

---

## Tasks

### Task 1: Add "San Fabian - Mangaldan - Dagupan" & Remove "old devenecia" in Backend and Seeds

**Files:**
- Modify: `backend/src/seeds/routeSeeds.js`
- Modify: `backend/database-export/routes.json`
- Script: `backend/scripts/update_routes_oct6.js` (scratch script to upsert and purge)

**Interfaces:**
- Produces: `SAN_FABIAN_MANGALDAN_DAGUPAN` route in MongoDB with 194 coordinates, 29.8 km distance, and `FareMatrix` rates.
- Removes: `SAN CARLOS` / `old devenecia` route and associated `FareMatrix` entries.

- [ ] **Step 1: Write migration and seed script**
  Decode OnTheGoMap `r2` polyline points, formulate route definition with terminals and waypoints, remove `old devenecia`, and insert `San Fabian - Mangaldan - Dagupan`.
- [ ] **Step 2: Execute script and update MongoDB + database-export/routes.json**
  Run script to update database and export updated JSON.
- [ ] **Step 3: Update routeSeeds.js**
  Ensure `routeSeeds.js` contains the 7 official routes without `old devenecia`.

---

### Task 2: Fix Map Auto-Display & Zoom Framing on Route Selection in Mobile and Admin

**Files:**
- Modify: `frontend/mobile/src/screens/map/RouteMapScreen.js`
- Modify: `frontend/mobile/src/components/common/HomeMapWidget.js`
- Modify: `frontend/admin/src/components/common/LeafletMap.jsx`

**Key Changes:**
1. In `RouteMapScreen.js`:
   - When any route card is pressed, set `selectedItem`.
   - Update `generateLeafletHtml()`:
     - When `selectedId` is set, only render that specific route polyline, start terminal marker, and end terminal marker.
     - Automatically calculate `poly.getBounds()`.
     - Do NOT let default `setView([userLat, userLng], 14)` override the route view! Instead, immediately execute `map.fitBounds(selectedBounds, { padding: [40, 40], maxZoom: 15 });`.
     - Add double-timeout safety (`setTimeout(..., 100)` and `setTimeout(..., 350)`) after `map.invalidateSize()` to guarantee Leaflet refits even if WebView layout is deferred on Android devices.
   - Register route color for `SAN_FABIAN_MANGALDAN_DAGUPAN`: `#0284C7` (Sky Blue / Coastal Blue).
2. In `HomeMapWidget.js`:
   - Add `SAN_FABIAN_MANGALDAN_DAGUPAN` color mapping and fit bounds on click.
3. In `LeafletMap.jsx`:
   - Add `SAN_FABIAN_MANGALDAN_DAGUPAN` color mapping and auto-fit bounds on selection.

- [ ] **Step 1: Update RouteMapScreen.js Leaflet rendering logic**
- [ ] **Step 2: Update HomeMapWidget.js and LeafletMap.jsx**
- [ ] **Step 3: Verify route card selection triggers immediate visual update**

---

### Task 3: Upgrade Fare Calculator with Automatic Base Fare + Succeeding Km & Live Get-Off Meter

**Files:**
- Modify: `frontend/mobile/src/screens/fare/FareCalculatorScreen.js`
- Modify: `backend/src/services/fareCalculator.js`

**Key Changes:**
1. In `FareCalculatorScreen.js`:
   - Add an **Interactive Trip Distance Controller**:
     - Allows commuters to adjust their ride distance via slider / stepper / direct km input or quick distance buttons (e.g. `2 km (Base)`, `5 km`, `8 km`, `12 km`, `Full Route`).
     - Or select Boarding Point & Alighting Point along the route to compute exact distance.
   - Display a transparent, live calculation breakdown:
     - **Base Fare**: ₱14 (Traditional) / ₱17 (Modern) covering the first 4.0 km.
     - **Succeeding Distance**: `+₱2.00/km` (Traditional) or `+₱2.40/km` (Modern) for every kilometer beyond 4.0 km.
     - **20% Statutory Discount**: Automatically deducted for Student, Senior, and PWD.
     - **Actual Fare Upon Alighting**: Prominently displayed as the exact amount to hand to the driver when getting off the jeepney.
   - Add a **Live Alight Meter Mode** ("Board Jeepney" -> "Get Off / Alight"):
     - Commuter can tap "Board Jeepney Now" when entering.
     - Live GPS tracks distance traveled while riding.
     - When commuter gets off the jeepney, tap "Arrived / Get Off" -> instantly displays the final actual fare for the traveled distance.

- [ ] **Step 1: Update fareCalculator.js to support arbitrary distance and stop breakdown**
- [ ] **Step 2: Overhaul FareCalculatorScreen.js with the new base + succeeding km breakdown, distance selector, and live ride meter**
- [ ] **Step 3: Test calculations across traditional (₱14 base + ₱2/km) and modern (₱17 base + ₱2.40/km) with standard and discounted rates**

---

### Task 4: Verification and Testing

**Files:**
- Run: `node` validation scripts on routes and fare calculation
- Test: Route rendering and selection bounds in mobile environment

- [ ] **Step 1: Verify all 7 routes in MongoDB and routes.json (confirming old devenecia is gone and San Fabian is present)**
- [ ] **Step 2: Validate fare calculations for 2 km, 4 km, 7 km, 15 km, and 29.8 km**
- [ ] **Step 3: Verify mobile screen syntax and bundle validity**
