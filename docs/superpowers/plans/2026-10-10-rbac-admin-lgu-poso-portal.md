# Multi-Tier RBAC & Governance Portal (Admin, LGU, POSO) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a 3-tier government and field enforcement portal hierarchy (Admin, LGU, POSO) in SmartSakay Dagupan, replacing superadmin with admin, and establishing role-scoped dashboards, complaint triage/endorsement workflows, road alert verification, and role-restricted account management.

**Architecture:** 
- Unified backend authentication with role-based middleware (`'admin'`, `'lgu'`, `'poso'`).
- Endorsement pipeline: Commuter complaints ➔ POSO road triage & endorsement ➔ LGU resolution.
- Verification pipeline: POSO road alert drafts ➔ LGU approval & commuter broadcast.
- Single web portal (`frontend/admin`) dynamically mounting role-tailored sidebar navigation, metric dashboards, and scoped account management.

**Tech Stack:** Node.js, Express, MongoDB/Mongoose, React 18, React Router v6, Tailwind CSS, Lucide React icons, Axios.

**Spec:** [`docs/superpowers/specs/2026-10-10-rbac-admin-lgu-poso-portal-design.md`](file:///c:/Users/RUSSEL/Downloads/smartsakaydagupan/smartsakay%20dagupan/docs/superpowers/specs/2026-10-10-rbac-admin-lgu-poso-portal-design.md)

## Global Constraints
- Roles are strictly: `'admin'`, `'lgu'`, `'poso'`, `'commuter'`, `'guest'`. Legacy `'superadmin'` is removed and normalized to `'admin'`.
- Admin can only provision and manage `'lgu'` accounts.
- LGU can only provision and manage `'poso'` accounts.
- POSO cannot access system metrics, fare modification, or route deletion.
- POSO road alerts must undergo LGU approval before broadcasting to commuter mobile apps.
- Existing routes, fares, and commuter mobile app compatibility must remain 100% intact.

---

### Task 1: Backend User Model, Seed Accounts & Legacy Superadmin Normalization

**Files:**
- Modify: `backend/src/models/User.js`
- Modify: `backend/src/seeds/routeSeeds.js` (or user seeds)
- Create: `backend/scripts/migrateRolesAndSeed.js`

- [ ] **Step 1: Update User Model**
  Update `role` enum in `backend/src/models/User.js` to `['admin', 'lgu', 'poso', 'commuter', 'guest']` and add officer metadata fields (`badgeNumber`, `department`, `assignedZone`).
- [ ] **Step 2: Create Role Migration & Seeding Script**
  Write `backend/scripts/migrateRolesAndSeed.js` to:
  1. Convert any user with `role: 'superadmin'` to `role: 'admin'`.
  2. Upsert the 3 presentation accounts with `Admin@12345`:
     - `admin@smartsakay.com` (`role: 'admin'`, `firstName: 'System'`, `lastName: 'Administrator'`)
     - `lgu@smartsakay.com` (`role: 'lgu'`, `firstName: 'City Transport'`, `lastName: 'Officer'`)
     - `poso@smartsakay.com` (`role: 'poso'`, `firstName: 'Road Enforcer'`, `lastName: 'Officer'`, `badgeNumber: 'POSO-DAG-01'`)
- [ ] **Step 3: Run Migration & Verify Accounts**
  Execute: `node backend/scripts/migrateRolesAndSeed.js`
  Expected: All 3 accounts created/updated in MongoDB Atlas with hashed passwords.
- [ ] **Step 4: Commit**
  `git add backend/src/models/User.js backend/scripts/migrateRolesAndSeed.js`
  `git commit -m "feat(auth): update User role enum and seed Admin, LGU, and POSO accounts"`

---

### Task 2: Backend Complaint Endorsement & Road Violation Filing

**Files:**
- Modify: `backend/src/models/Complaint.js`
- Modify: `backend/src/routes/complaintRoutes.js`
- Modify: `backend/src/controllers/complaintController.js`

- [ ] **Step 1: Extend Complaint Model**
  Add status `'endorsed_to_lgu'` and fields `endorsedBy`, `endorsementDate`, `endorsementNotes`, `source` (`'commuter'` | `'poso_field_report'`).
- [ ] **Step 2: Implement POSO Endorsement Endpoint**
  Add `PATCH /api/complaints/:id/endorse` in `complaintController.js`:
  - Requires `role === 'poso' || role === 'admin'`.
  - Sets `status = 'endorsed_to_lgu'`, logs POSO officer ID and notes.
- [ ] **Step 3: Implement POSO Direct Road Report Endpoint**
  Add `POST /api/complaints/field-report` in `complaintController.js`:
  - Accepts `plateNumber`, `jeepneyRoute`, `incidentType`, `location`, `description`, `photoUrl`.
  - Sets `source = 'poso_field_report'`, `status = 'endorsed_to_lgu'`.
- [ ] **Step 4: Implement LGU Resolution Endpoint**
  Add `PATCH /api/complaints/:id/resolve` in `complaintController.js`:
  - Requires `role === 'lgu' || role === 'admin'`.
  - Sets `status = 'resolved'`, updates `resolutionNotes`, `resolvedBy`.
- [ ] **Step 5: Verify Endpoints with Node Fetch Script**
  Run quick verification test in `scratch/test_complaint_workflow.js`.
- [ ] **Step 6: Commit**
  `git add backend/src/models/Complaint.js backend/src/routes/complaintRoutes.js backend/src/controllers/complaintController.js`
  `git commit -m "feat(complaints): add POSO triage endorsement and direct road report endpoints"`

---

### Task 3: Backend POSO Road Alerts & LGU Verification Workflow

**Files:**
- Modify: `backend/src/models/Notification.js`
- Modify: `backend/src/routes/notificationRoutes.js`
- Modify: `backend/src/controllers/notificationController.js`

- [ ] **Step 1: Extend Notification Model**
  Add `status` (`'pending_approval'`, `'published'`, `'rejected'`), `approvedBy`, `authorUser`, `createdByRole`.
- [ ] **Step 2: Implement POSO Road Alert Request Endpoint**
  Add `POST /api/notifications/request` in `notificationController.js`:
  - Requires `role === 'poso'`.
  - Sets `status = 'pending_approval'`, `createdByRole = 'poso'`.
- [ ] **Step 3: Implement LGU Pending Road Alerts & Approval Endpoint**
  Add `GET /api/notifications/pending`: lists alerts awaiting review.
  Add `PATCH /api/notifications/:id/approve`: marks status as `'published'`, triggers broadcast to commuters.
  Add `PATCH /api/notifications/:id/reject`: marks status as `'rejected'`.
- [ ] **Step 4: Verify Broadcast Approval Workflow**
  Run quick script testing alert creation by POSO and approval by LGU.
- [ ] **Step 5: Commit**
  `git add backend/src/models/Notification.js backend/src/routes/notificationRoutes.js backend/src/controllers/notificationController.js`
  `git commit -m "feat(notifications): add POSO road alert draft and LGU verification approval endpoints"`

---

### Task 4: Backend Role-Scoped Account Management API

**Files:**
- Modify: `backend/src/routes/adminRoutes.js`
- Modify: `backend/src/controllers/adminController.js`
- Modify: `backend/src/controllers/userController.js`

- [ ] **Step 1: Implement Admin Account Metrics**
  Add `GET /api/admin/metrics` returning `{ activeAccounts, suspendedAccounts, lguAccounts, posoAccounts, commuterAccounts }`.
- [ ] **Step 2: Implement Scoped Creation Endpoints**
  Add `POST /api/admin/accounts/lgu`: Admin creates LGU accounts only.
  Add `POST /api/admin/accounts/poso`: LGU creates POSO accounts only.
- [ ] **Step 3: Implement Account Suspension / Activation**
  Add `PATCH /api/users/:id/status`: toggles `isActive: true/false`.
  - Admin can toggle LGU and commuter accounts.
  - LGU can toggle POSO accounts.
- [ ] **Step 4: Commit**
  `git add backend/src/routes/adminRoutes.js backend/src/controllers/adminController.js backend/src/controllers/userController.js`
  `git commit -m "feat(users): add role-scoped account creation and suspension endpoints"`

---

### Task 5: Frontend AuthContext & Dynamic Role Sidebar Navigation

**Files:**
- Modify: `frontend/admin/src/contexts/AuthContext.jsx`
- Modify: `frontend/admin/src/components/layout/sidebar/Sidebar.jsx`
- Modify: `frontend/admin/src/components/layout/header/Header.jsx`

- [ ] **Step 1: Update AuthContext Roles**
  Update `AuthContext.jsx` to recognize `role === 'admin'`, `role === 'lgu'`, `role === 'poso'`. Provide `isAdmin`, `isLgu`, `isPoso`. Allow `'poso'` in login permissions.
- [ ] **Step 2: Configure Role-Specific Sidebar Sections**
  In `Sidebar.jsx`:
  - `isAdmin`:
    - Dashboard (`/`)
    - LGU Account Management (`/users`)
    - My Profile (`/profile`)
  - `isLgu`:
    - Master Dashboard (`/`)
    - Fare Management (`/fares`)
    - Route Directory (`/routes`)
    - Terminal Hubs (`/terminals`)
    - Complaints Action Desk (`/complaints`)
    - City Broadcaster (`/notifications`)
    - POSO Account Management (`/users`)
    - My Profile (`/profile`)
  - `isPoso`:
    - Field Dashboard (`/`)
    - File Road Report (`/reports/new` or modal)
    - Complaints Hub (`/complaints`)
    - Road Broadcaster (`/notifications`)
    - Route Directory Lookup (`/routes`)
    - Fare Rates Lookup (`/fares`)
    - My Profile (`/profile`)
- [ ] **Step 3: Update Header Badge**
  Display role badge in Header: `"SYSTEM ADMIN"`, `"LGU TRANSPORT AUTHORITY"`, `"POSO FIELD ENFORCER"`.
- [ ] **Step 4: Commit**
  `git add frontend/admin/src/contexts/AuthContext.jsx frontend/admin/src/components/layout/sidebar/Sidebar.jsx frontend/admin/src/components/layout/header/Header.jsx`
  `git commit -m "feat(ui): dynamic role navigation and badges for Admin, LGU, and POSO"`

---

### Task 6: Frontend Dedicated Dashboards (Admin vs. LGU vs. POSO)

**Files:**
- Modify: `frontend/admin/src/pages/DashboardPage.jsx`
- Create: `frontend/admin/src/components/dashboard/AdminDashboardView.jsx`
- Create: `frontend/admin/src/components/dashboard/PosoDashboardView.jsx`

- [ ] **Step 1: Create Admin Dashboard View**
  Build `AdminDashboardView.jsx` featuring:
  - 3 primary metric cards: **Active Accounts**, **Suspended Accounts**, **LGU Accounts**.
  - Quick action: "Provision New LGU Account".
  - Quick overview table of registered LGU officers.
- [ ] **Step 2: Create POSO Field Dashboard View**
  Build `PosoDashboardView.jsx` featuring:
  - 3 field cards: **Pending Complaints to Verify**, **Endorsed to LGU**, **Active Road Alerts**.
  - Quick action button: "File On-Road Violation".
  - Quick summary table of recent commuter complaints awaiting road check.
- [ ] **Step 3: Update DashboardPage Routing**
  In `DashboardPage.jsx`, conditionally render `AdminDashboardView` for Admin, `PosoDashboardView` for POSO, and keep existing comprehensive Master Dashboard for LGU.
- [ ] **Step 4: Commit**
  `git add frontend/admin/src/pages/DashboardPage.jsx frontend/admin/src/components/dashboard/AdminDashboardView.jsx frontend/admin/src/components/dashboard/PosoDashboardView.jsx`
  `git commit -m "feat(dashboard): dedicated dashboard views for Admin, LGU, and POSO"`

---

### Task 7: Frontend Scoped Account Management (`UsersPage.jsx`)

**Files:**
- Modify: `frontend/admin/src/pages/UsersPage.jsx`

- [ ] **Step 1: Adapt UsersPage for Admin**
  When viewed by `isAdmin`:
  - Title: "LGU Account Management".
  - Displays LGU accounts only.
  - "Add LGU Account" modal (Full name, Email, Initial password, Department).
  - Actions: Suspend Account / Activate Account.
- [ ] **Step 2: Adapt UsersPage for LGU**
  When viewed by `isLgu`:
  - Title: "POSO Field Enforcers Management".
  - Displays POSO officer accounts only.
  - "Add POSO Officer" modal (Full name, Email, Badge number, Assigned zone, Password).
  - Actions: Suspend Officer / Activate Officer.
- [ ] **Step 3: Commit**
  `git add frontend/admin/src/pages/UsersPage.jsx`
  `git commit -m "feat(users): role-scoped user management for Admin (LGU only) and LGU (POSO only)"`

---

### Task 8: Frontend Complaints Hub (POSO Triage & Endorsement vs. LGU Action Desk)

**Files:**
- Modify: `frontend/admin/src/pages/ComplaintsPage.jsx`

- [ ] **Step 1: POSO Complaints Hub**
  When viewed by `isPoso`:
  - Header: "POSO Complaints Triage & Field Verification".
  - Two Tabs:
    - **Pending Road Verification**: Commuter complaints awaiting inspection.
    - **Endorsed to LGU**: Verified complaints forwarded to City Hall.
  - Action button: **"Endorse to LGU"** with modal for Officer Remarks / Findings.
  - Button: **"File Direct Report"** opening form (Plate number, Route, Violation type, Location, Remarks, Photo).
- [ ] **Step 2: LGU Action Desk**
  When viewed by `isLgu`:
  - Header: "LGU Transport Action Desk".
  - Highlights complaints endorsed by POSO with officer notes.
  - Action buttons: Resolve, Issue Operator Sanction, Dismiss.
- [ ] **Step 3: Commit**
  `git add frontend/admin/src/pages/ComplaintsPage.jsx`
  `git commit -m "feat(complaints): POSO field verification/endorsement and direct report filing UI"`

---

### Task 9: Frontend Road Broadcaster & Verification Workflow

**Files:**
- Modify: `frontend/admin/src/pages/NotificationsPage.jsx`

- [ ] **Step 1: POSO Road Alert Request Form**
  When viewed by `isPoso`:
  - Form: "Draft Road Alert for LGU Verification" (Title, Message, Severity: Traffic/Flood/Accident/Reroute, Location).
  - Status list: Shows previously submitted alerts with badge (*Pending LGU Review*, *Approved & Published*, *Rejected*).
- [ ] **Step 2: LGU Approval Desk & Direct Broadcaster**
  When viewed by `isLgu`:
  - Top Section: "Pending POSO Road Alerts (Approval Required)".
    - Card for each alert from POSO with buttons: **"Approve & Broadcast to Commuters"** and **"Reject"**.
  - Bottom Section: "Direct City Broadcaster" (instant publish).
- [ ] **Step 3: Commit**
  `git add frontend/admin/src/pages/NotificationsPage.jsx`
  `git commit -m "feat(notifications): POSO road alert draft and LGU verification desk UI"`

---

### Task 10: Full Verification & Cloud Deployment

- [ ] **Step 1: Execute Migration & Seed Script**
  Run `node backend/scripts/migrateRolesAndSeed.js` to ensure Atlas and local DB have all 3 accounts.
- [ ] **Step 2: Test Login & Functionality in All 3 Roles**
  1. Login as `admin@smartsakay.com` ➔ Verify Admin Dashboard (Active, Suspended, LGU counts) & LGU account creation.
  2. Login as `lgu@smartsakay.com` ➔ Verify Master Dashboard, Fare matrix, POSO account creation, and Broadcast approval desk.
  3. Login as `poso@smartsakay.com` ➔ Verify Field Dashboard, Direct report filing, Complaints triage & Endorsement, and Road alert drafting.
- [ ] **Step 3: Push to GitHub Remote**
  `git push origin main`
  Verify Render and Vercel automatically redeploy with the full RBAC system.
