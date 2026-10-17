# Map Search, Peer Location Sharing, Secure Upload, Admin/POSO/LGU Dark Theme & Role Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 7 key enhancements across SmartSakay Dagupan:
1. Map Search Bar for specific locations and landmarks in Dagupan City with auto-pan and search pins.
2. Peer Location Sharing: request location access by User ID, accept/decline/block controls, maximum limit of 10 users, and live profile avatar markers on the map for mutual permissions.
3. Secure Commuter Profile Picture Upload with anti-malware protections (MIME check, binary magic bytes validation, random UUID naming, size limits, and script execution prevention).
4. Commuter Complaint Trash Permanent Delete button with safety confirmation modal.
5. Admin Portal Dark Theme fix with high-contrast, crystal-clear readability.
6. POSO Complaint Actions: "Reject Complaint" (with structured reason) and "Verify & Endorse to LGU", with POSO dark theme fix.
7. LGU Action Desk Dark Theme fix and immediate session termination / auto-logout when LGU suspends a POSO account.

**Architecture:** 
- **Peer Location & Tracking:** MongoDB `LocationSharing` model tracking permissions (`pending`, `accepted`, `declined`, `blocked`, `inactive`) with a 10-target limit. Live positions communicated via REST sync / WebSockets, and dynamically rendered onto Leaflet map via custom HTML DivIcons with circular commuter avatars.
- **Security for Uploads:** Multer with memory buffer, validating real image magic bytes (`FF D8 FF` for JPEG, `89 50 4E 47` for PNG, `RIFF...WEBP` for WebP), renaming files with `crypto.randomUUID()`, blocking SVG/HTML/PHP/executable extensions, restricting max 2MB, and serving with `nosniff` headers.
- **Admin/POSO/LGU Theming:** Inject full CSS variable tokens for `[data-theme="dark"]` in `frontend/admin/src/index.css` and ensure `ThemeContext.jsx` synchronizes root attributes and contrast colors.
- **Suspension Invalidation:** Backend updates user status, revokes tokens, emits `account:suspended` via Socket.io, and admin `client.js` response interceptor intercepts 401/403 deactivations to instantly clear storage and redirect to login.

**Tech Stack:** React Native (Expo), React (Vite), Leaflet.js, Node.js / Express, MongoDB / Mongoose, Socket.io, Multer.

---

## Global Constraints

- Never allow file uploads without validating binary magic numbers to prevent malicious code execution.
- Hard limit on location access requests: A user cannot have more than 10 active or pending outgoing location access requests.
- Privacy first: User location is never exposed to another user unless the status is strictly `'accepted'` and active sharing is turned ON by both or granting party.
- Preserve all existing routes, LTFRB fare calculation logic, and commuter rights protections.

---

## Review Focus

1. **Malicious upload attempts:** Renamed executable files (e.g. `exploit.php.jpg` or SVGs containing `<script>` tags) must be rejected with 400 Bad Request.
2. **Location sharing request flood:** Attempting to request an 11th user's location must be rejected with 400 Bad Request and friendly UI error message.
3. **Mutual privacy revocation:** If User B blocks User A or turns off location sharing, User A's map must immediately remove User B's marker and revoke GPS coordinates.
4. **Instant suspension enforcement:** When LGU clicks "Suspend" on a POSO user, the POSO user's active session must terminate immediately without needing a page refresh.
5. **Dark theme contrast:** Text on tables, modals, badges, inputs, and sidebar in dark mode must meet WCAG AAA/AA readability standards without unreadable dark-on-dark text.

---

### Task 1: Map Specific Location Search Bar

**Files:**
- Modify: `frontend/mobile/src/screens/map/RouteMapScreen.js`
- Create: `frontend/mobile/src/utils/dagupanLandmarks.js`

**Interfaces:**
- Input: Text query (e.g. "Nepo Mall", "CSI City Mall", "Perez Blvd", "Lucao", "Bonuan Tondalig")
- Output: Matching location coordinates `{ name, lat, lng, type }`, Leaflet map message `{ type: 'FLY_TO_LOCATION', lat, lng, label }`

- [ ] **Step 1: Create Dagupan curated landmark and POI database**
  - Implement comprehensive Dagupan landmarks database covering malls, universities, hospitals, markets, government centers, and major junctions.
  - Add fallback to OpenStreetMap Nominatim geocoder API bounded to Dagupan City coordinates `(15.98 to 16.10 Lat, 120.28 to 120.40 Lng)`.

- [ ] **Step 2: Add Location Search Bar UI to RouteMapScreen**
  - Add search input right on or above the map view with clear/search icons and instant search dropdown results.
  - Distinguish route/bus filter search from specific location pin search.

- [ ] **Step 3: Integrate Leaflet Map Pin & Fly-to Animation**
  - When user selects a searched location, post message to Leaflet WebView to fly to coordinates, drop an animated marker pin with place name popup, and provide "Clear Search Pin" button.

- [ ] **Step 4: Verify on local mobile web**
  - Search "Nepo Mall", verify pin drops on coordinates and map centers smoothly.

---

### Task 2: Peer Location Access Request & Sharing System

**Files:**
- Create: `backend/src/models/LocationSharing.js`
- Create: `backend/src/controllers/locationSharingController.js`
- Create: `backend/src/routes/locationSharingRoutes.js`
- Modify: `backend/src/app.js`
- Modify: `frontend/mobile/src/api/services.js`
- Create: `frontend/mobile/src/screens/map/LocationSharingModal.js`
- Modify: `frontend/mobile/src/screens/map/RouteMapScreen.js`

**Interfaces:**
- `POST /api/location-sharing/request`: `{ targetUserIdentifier }` (User ID, email, or badge/phone) -> validates target exists, requester != target, count of active requests <= 10.
- `GET /api/location-sharing/my-connections`: Returns incoming requests, outgoing requests, and active connections.
- `PUT /api/location-sharing/:id/respond`: `{ action: 'accept' | 'decline' }`
- `PATCH /api/location-sharing/:id/toggle`: `{ isSharingEnabled: Boolean, isBlocked: Boolean }`
- `POST /api/location-sharing/ping-location`: `{ lat, lng }` (updates location for approved peers)
- `GET /api/location-sharing/peer-locations`: Returns `{ userId, firstName, lastName, profilePhoto, lat, lng, updatedAt }` for authorized peers only.

- [ ] **Step 1: Create LocationSharing model with 10-user validation**
  - Mongoose schema with `requester`, `recipient`, `status` (`'pending' | 'accepted' | 'declined' | 'blocked'`), `requesterSharingActive`, `recipientSharingActive`, timestamps.
  - Add unique compound index `[requester, recipient]` and pre-save validation for 10-target limit.

- [ ] **Step 2: Implement LocationSharing controller and routes**
  - Full CRUD with authentication, self-request prevention, block/unblock toggles, and privacy filtering.

- [ ] **Step 3: Create Mobile Location Sharing Management Modal**
  - UI in `LocationSharingModal.js`:
    - Shows "Connected Commuters (X/10)"
    - "Request Location Access" input for searching user by ID / email / Commuter ID
    - Incoming requests tab with "Accept" and "Decline" buttons
    - Active connections list with Toggle Sharing switch and "Block / Disconnect" button

- [ ] **Step 4: Render Peer Avatars on Leaflet Map**
  - In `RouteMapScreen.js`, poll or receive peer locations from `peer-locations` API.
  - Render custom Leaflet DivIcons with commuter profile photo / avatar initials and name banner.
  - Automatically remove markers when access is turned off or blocked.

---

### Task 3: Secure Commuter Profile Picture Upload

**Files:**
- Create: `backend/src/utils/fileSecurity.js`
- Modify: `backend/src/middleware/upload.js`
- Modify: `backend/src/controllers/userController.js`
- Modify: `backend/src/routes/userRoutes.js`
- Modify: `frontend/mobile/src/screens/profile/ProfileScreen.js`

**Security Protections:**
1. **Magic Bytes Validation:** Inspect file buffer headers (`FF D8 FF` for JPEG, `89 50 4E 47` for PNG, `52 49 46 46` ... `57 45 42 50` for WebP).
2. **Whitelist Extensions:** Strictly allow `.jpg`, `.jpeg`, `.png`, `.webp`. Reject all others (.svg, .html, .php, .js, .exe).
3. **Random UUID Filenames:** Prevent directory traversal attacks like `../../` by saving files strictly as `avatar-${crypto.randomUUID()}.${ext}`.
4. **Max Size Limit:** 2MB hard limit enforced at Multer and Express middleware.
5. **Static File Serving Protection:** Set `X-Content-Type-Options: nosniff` header on `/uploads` endpoint.

- [ ] **Step 1: Implement binary magic bytes inspection in fileSecurity.js**
  - Write helper function that reads the first 12 bytes of a file buffer to verify authentic image signatures.

- [ ] **Step 2: Create secure avatar upload middleware & controller**
  - In `userController.js`, implement `uploadProfilePhoto` that saves the sanitized image and updates `user.profilePhoto`.

- [ ] **Step 3: Update ProfileScreen.js with camera/upload button & preview**
  - Add upload button overlay on avatar circle using `expo-image-picker`.
  - Preview selected photo, handle upload with progress indicator, and refresh profile upon success.

---

### Task 4: Commuter Complaints Trash Permanent Delete

**Files:**
- Modify: `backend/src/controllers/complaintController.js`
- Modify: `backend/src/routes/complaintRoutes.js`
- Modify: `frontend/mobile/src/api/services.js`
- Modify: `frontend/mobile/src/screens/complaints/ComplaintsListScreen.js`

- [ ] **Step 1: Ensure backend supports permanent delete for commuter's own deleted complaints**
  - `DELETE /api/complaints/:id/permanent` allows commuter to permanently remove a complaint that is already in `status: 'deleted'`.

- [ ] **Step 2: Add "Delete Permanently" button in ComplaintsListScreen**
  - In the Trash tab (`activeTab === 'deleted'`), display both:
    - "Undo / Restore" button (green)
    - "Delete Permanently" button (red with trash-can-alert icon)
  - When pressed, show confirmation modal: *"Are you sure you want to permanently delete this report? This action cannot be undone."*
  - On confirm, call API, remove from list, and update badge counts.

---

### Task 5: Admin Portal Dark Theme Fix

**Files:**
- Modify: `frontend/admin/src/index.css`
- Modify: `frontend/admin/src/contexts/theme/ThemeContext.jsx`

- [ ] **Step 1: Add high-contrast `[data-theme="dark"]` CSS variables in `index.css`**
  - Define `--bg-main: #0B1120;`, `--bg-surface: #1E293B;`, `--bg-surface-elevated: #334155;`, `--bg-sidebar: #0F172A;`
  - Define `--text-main: #F8FAFC;`, `--text-secondary: #E2E8F0;`, `--text-muted: #94A3B8;`
  - Define `--border: #334155;`, `--border-hover: #475569;`
  - Add dark rules for tables, cards, inputs, dropdowns, badges, and modals.

- [ ] **Step 2: Update ThemeContext.jsx to synchronize document attributes**
  - In `ThemeContext.jsx`, add `useEffect` syncing `document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')` and `document.documentElement.classList.toggle('dark', isDark)`.

---

### Task 6: POSO Complaint Actions (Reject & Endorse) & POSO Dark Theme

**Files:**
- Modify: `frontend/admin/src/pages/ComplaintsPage.jsx`
- Create: `frontend/admin/src/components/complaints/PosoRejectModal.jsx`
- Modify: `backend/src/controllers/complaintController.js`
- Modify: `backend/src/routes/complaintRoutes.js`

- [ ] **Step 1: Add backend reject endpoint for complaints**
  - `PUT /api/complaints/:id/reject`: POSO can reject with reason (`'insufficient_evidence'`, `'invalid_vehicle_plate'`, `'non_jurisdiction'`, `'other'`) and remarks. Sets status to `'rejected'`.

- [ ] **Step 2: Create PosoRejectModal component**
  - Modal with reason dropdown, remarks textarea, and confirmation button.

- [ ] **Step 3: Add "Reject Complaint" button alongside "Verify & Endorse" in ComplaintsPage.jsx**
  - In ComplaintsPage for POSO, show both "Verify & Endorse" and "Reject Report" buttons.
  - Verify that POSO dark theme displays with crisp readability.

---

### Task 7: LGU Dark Theme Readability & Immediate POSO Account Logout on Suspension

**Files:**
- Modify: `backend/src/controllers/userController.js`
- Modify: `backend/src/middleware/auth.js`
- Modify: `frontend/admin/src/api/client.js`
- Modify: `frontend/admin/src/contexts/AuthContext.jsx`
- Modify: `frontend/admin/src/App.jsx`

- [ ] **Step 1: Enhance backend suspension enforcement in userController.js**
  - When LGU or Admin suspends a user (`isActive: false`):
    - Invalidate `refreshToken`.
    - Emit Socket.io event `user:suspended` with `{ userId: user._id }`.
  - In `auth.js`, return explicit error `{ error: 'ACCOUNT_SUSPENDED', message: 'Your account has been suspended by LGU.' }` with 403 status.

- [ ] **Step 2: Add immediate logout interceptor in frontend/admin client.js**
  - Intercept 403 `ACCOUNT_SUSPENDED` and immediately purge tokens and redirect to `/login?reason=suspended`.

- [ ] **Step 3: Listen for realtime suspension socket event in AuthContext.jsx**
  - If current logged-in user receives `user:suspended` for their own ID, immediately clear localStorage, show alert, and redirect to login without delay.

- [ ] **Step 4: Verify LGU dark theme styling**
  - Verify all LGU Action Desk cards, tables, statistics, modals, and resolution inputs have dark styling and high-contrast text.

---

## Verification Plan

1. **Map Search:** Type "Nepo Mall" in mobile map search -> verify search pin drops and map centers.
2. **Peer Location Sharing:** Request location of user -> accept on other device -> verify both users see each other's profile pin on the map. Test blocking -> verify pin vanishes instantly. Try requesting an 11th user -> verify 10-user limit block.
3. **Secure Upload:** Upload valid JPG/PNG -> verify saved. Test uploading malicious/fake file (e.g., text file renamed to .jpg) -> verify rejected by magic bytes inspection.
4. **Permanent Delete:** Go to Trash tab in commuter complaints -> click "Delete Permanently" -> verify permanently removed.
5. **Admin / POSO / LGU Dark Theme:** Toggle dark theme in admin portal -> verify all pages, tables, and modals transition to dark theme with legible text.
6. **POSO Reject / Endorse:** Open pending complaint as POSO -> test "Reject Complaint" and "Verify & Endorse" -> verify state updates correctly.
7. **LGU Suspension Auto-Logout:** Log in as POSO in one window, log in as LGU in another -> LGU suspends POSO -> POSO window instantly logs out.
