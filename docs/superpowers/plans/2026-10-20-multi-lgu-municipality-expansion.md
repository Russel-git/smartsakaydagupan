# Implementation Plan: Multi-LGU & Commuter Multi-Municipality Expansion

**Goal:** Enable Superadmin to provision separate LGU accounts across neighboring Pangasinan towns (Dagupan City, Calasiao, Binmaley, Lingayen, Mangaldan) and allow commuters to select/switch municipalities during Sign-In and on the live mobile map to view town-specific transit routes, terminals, and information.

---

## 1. Scope & Architecture Changes

### 1.1 Backend
1. **`models/User.js`**: Add `municipality: { type: String, trim: true, default: "Dagupan" }`
2. **`models/Route.js`**: Add `municipalities: [{ type: String, trim: true, index: true }]`
3. **`models/Terminal.js`**: Add `municipality: { type: String, trim: true, default: "Dagupan" }`
4. **`validators/routeValidator.js` & `validators/terminalValidator.js`**:
   - `routeValidator.js`: Accept `municipalities: Joi.array().items(Joi.string().trim()).default(['Dagupan'])`
   - `terminalValidator.js`: Accept `municipality: Joi.string().trim().max(100).default('Dagupan')`
5. **`controllers/routeController.js`**:
   - In `getAllRoutes`: Check `req.query.municipality`. If provided and not `'all'`, filter routes where `municipalities` includes the selected municipality (with fallback for unmigrated Dagupan routes).
6. **`controllers/terminalController.js`**:
   - In `getAllTerminals`: Check `req.query.municipality`. Filter terminals by `municipality`.
7. **`controllers/userController.js`**:
   - In `createUser`: Accept `municipality` from `req.body`, store in user document, and adapt default department string for LGUs.
8. **Migration / Seed Script (`scripts/migrateMultiMunicipality.js`)**:
   - Tag existing routes and terminals with their corresponding municipal coverage tags.

### 1.2 Frontend Admin (`frontend/admin`)
1. **`pages/UsersPage.jsx`**:
   - Add `municipality` field to `createForm` with a dropdown (`Dagupan City`, `Calasiao`, `Binmaley`, `Lingayen`, `Mangaldan`, or Custom).
   - In the user table, show a clear badge `[LGU <Municipality>]` for each LGU account.

### 1.3 Frontend Mobile (`frontend/mobile`)
1. **`utils/storage.js`**:
   - Add `KEYS.MUNICIPALITY: '@smartsakay_municipality'`, `saveMunicipality`, `getMunicipality`.
2. **`api/services.js`**:
   - Update `routesAPI.getAllRoutes` to accept query params: `(params) => apiClient.get('/routes', { params })`.
3. **`screens/auth/LoginScreen.js`**:
   - Add Municipality dropdown before sign-in (`Dagupan`, `Calasiao`, `Binmaley`, `Lingayen`, `Mangaldan`).
   - Save selected municipality into persistent storage upon login / guest mode.
4. **`screens/map/RouteMapScreen.js`**:
   - Add `selectedMunicipality` state initialized from storage/default ('Dagupan').
   - Add a quick-switch municipality selector pill on the map header/overlay.
   - Refetch routes & terminals when municipality changes.
   - Re-center map to the selected municipality centroid (`Dagupan`, `Calasiao`, `Binmaley`, `Lingayen`, `Mangaldan`).

---

## 2. Step-by-Step Implementation

### Step 1: Backend Models and Validators
- Edit `backend/src/models/User.js`
- Edit `backend/src/models/Route.js`
- Edit `backend/src/models/Terminal.js`
- Edit `backend/src/validators/routeValidator.js`
- Edit `backend/src/validators/terminalValidator.js`

### Step 2: Backend Controllers & Data Migration
- Edit `backend/src/controllers/routeController.js`
- Edit `backend/src/controllers/terminalController.js`
- Edit `backend/src/controllers/userController.js`
- Create `backend/src/scripts/migrateMultiMunicipality.js` and run it via node to tag all current routes & terminals.

### Step 3: Frontend Admin Portal
- Edit `frontend/admin/src/pages/UsersPage.jsx` to add Municipality selection to the Add LGU modal and display municipality badges in the table.

### Step 4: Frontend Mobile Services & Storage
- Edit `frontend/mobile/src/utils/storage.js`
- Edit `frontend/mobile/src/api/services.js`

### Step 5: Frontend Mobile UI (LoginScreen & RouteMapScreen)
- Edit `frontend/mobile/src/screens/auth/LoginScreen.js` to add the municipality selection dropdown.
- Edit `frontend/mobile/src/screens/map/RouteMapScreen.js` to add the quick-switch bar, query filtering, and map auto-centering.

### Step 6: Verification
- Run backend unit tests (`npx jest tests/unit/ --forceExit`).
- Test Admin build (`npm run build`).
- Verify API endpoint `GET /api/routes?municipality=Mangaldan` and `GET /api/routes?municipality=Dagupan`.
