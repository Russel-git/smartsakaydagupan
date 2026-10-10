# SmartSakay Dagupan: Multi-Tier RBAC & Governance Portal Architecture
## Specification & Architecture Design: Admin, LGU, and POSO Roles

**Date**: 2026-10-10  
**Target Systems**: `backend`, `frontend/admin`, `frontend/mobile`  
**Status**: Approved for Planning  

---

### 1. Executive Summary & Intent
SmartSakay Dagupan requires a structured government and operational hierarchy reflecting real-world public transportation regulation in Dagupan City.
The previous generic `superadmin` / `admin` structure is consolidated into a 3-tier Role-Based Access Control (RBAC) model:
1. **Admin (System Administrator)**: Focuses strictly on platform operations, user account health, and provisioning LGU access.
2. **LGU (Local Government Unit / City Transport Authority)**: Operates the Master Transit Dashboard, controls fares, defines routes/terminals, creates public broadcasts, manages POSO enforcers, and acts on endorsed complaints.
3. **POSO (Public Order and Safety Office / Road Enforcers)**: Field officers on Dagupan roads who directly file traffic reports, triage commuter complaints, and draft road broadcasts for LGU approval.

---

### 2. Role Permissions & Capabilities Matrix

| Feature / Resource | Admin | LGU | POSO | Commuter |
| :--- | :---: | :---: | :---: | :---: |
| **System Admin Dashboard** (Active, Suspended, LGU counts) | ✅ Full | ❌ None | ❌ None | ❌ None |
| **Master Transit Dashboard** (City metrics, charts, operations) | ❌ None | ✅ Full | ❌ None | ❌ None |
| **LGU Account Management** (Create/Suspend/Activate LGU) | ✅ Full | ❌ None | ❌ None | ❌ None |
| **POSO Account Management** (Create/Suspend/Activate POSO) | ❌ None | ✅ Full | ❌ None | ❌ None |
| **Fare Matrix & Rates** (LTFRB base rates & discounts) | ❌ None | ✅ Full | 👁️ Read-Only | 👁️ Read-Only |
| **Route Directory** (Create, edit, manual waypoint builder) | ❌ None | ✅ Full | 👁️ Read-Only | 👁️ Read-Only |
| **Terminal Hubs** (Manage Perez Blvd & downtown terminals) | ❌ None | ✅ Full | 👁️ Read-Only | 👁️ Read-Only |
| **Direct Road Reports** (On-road violation/incident filing) | ❌ None | 👁️ View Reports | ✅ Full Filing | ❌ None |
| **Complaints Triage** (Verify commuter complaints) | ❌ None | ❌ None | ✅ Endorse to LGU | ✍️ Submit Complaint |
| **Complaints Action Desk** (Resolve/sanction endorsed complaints) | ❌ None | ✅ Full Action | 👁️ Read Endorsed | 👁️ View Status |
| **Direct Commuter Broadcast** (Publish push notifications) | ❌ None | ✅ Direct Publish | ❌ None | 📥 Receive |
| **Road Alert Drafting** (Field alerts submitted for review) | ❌ None | ❌ None | ✅ Draft Alerts | ❌ None |
| **Broadcast Verification Desk** (Approve/Reject POSO alerts) | ❌ None | ✅ Approve/Reject | ❌ None | ❌ None |
| **Profile & Settings** | ✅ Full | ✅ Full | ✅ Full | ✅ Full |

---

### 3. Backend Architecture Changes

#### 3.1 User Model (`backend/src/models/User.js`)
* **Role Enum Updated**: `['admin', 'lgu', 'poso', 'commuter', 'guest']`
  * Legacy `'superadmin'` values in existing database automatically normalized to `'admin'`.
* **Field Officer Metadata**:
  * `badgeNumber`: Optional string for POSO officers.
  * `department`: Optional string (e.g., `'POSO Traffic Division'`, `'City Mayor / LGU Transport'`).
  * `assignedZone`: Optional string (e.g., `'Perez Blvd / Downtown'`, `'Lucao / CSI'`).
* **Account Status**:
  * `isActive`: Boolean (`true` = Active, `false` = Suspended).

#### 3.2 Complaint Model (`backend/src/models/Complaint.js`)
* **Status Enum**:
  * `'pending'` ➔ Commuter submitted; visible to POSO for triage.
  * `'endorsed_to_lgu'` ➔ POSO verified facts; forwarded to LGU.
  * `'under_investigation'` ➔ LGU reviewing evidence.
  * `'resolved'` ➔ LGU enacted resolution/sanction.
  * `'dismissed'` ➔ Rejected (invalid complaint).
* **Endorsement Audit Trail**:
  * `endorsedBy`: ObjectId referencing POSO User.
  * `endorsementDate`: Date.
  * `endorsementNotes`: Text remarks from POSO officer.
  * `source`: `'commuter'` or `'poso_field_report'`.
  * `plateNumber`, `jeepneyRoute`, `incidentType`, `photoUrl`.

#### 3.3 Notification / Broadcast Model (`backend/src/models/Notification.js`)
* **Status Enum**:
  * `'draft'` / `'pending_approval'` ➔ Created by POSO from field; awaiting LGU review.
  * `'approved'` / `'published'` ➔ Published to all commuters.
  * `'rejected'` ➔ Denied by LGU with reason.
* **Metadata**:
  * `createdByRole`: `'lgu'` or `'poso'`.
  * `authorUser`: ObjectId referencing User.
  * `approvedBy`: ObjectId referencing LGU User (if originated by POSO).
  * `severity`: `'info'`, `'warning'`, `'alert'`, `'reroute'`, `'flood'`.

#### 3.4 API Endpoints & Authorization Middleware

##### A. Admin Routes (`/api/admin`)
* `GET /api/admin/metrics` ➔ Returns account stats: `{ activeAccounts, suspendedAccounts, lguAccounts, commuterAccounts }`.
* `GET /api/admin/accounts/lgu` ➔ List all LGU accounts.
* `POST /api/admin/accounts/lgu` ➔ Create new LGU account (`admin` only).
* `PATCH /api/admin/accounts/:id/status` ➔ Toggle status: active / suspended.

##### B. LGU Routes (`/api/lgu`)
* `GET /api/lgu/metrics` ➔ Master dashboard stats (routes, fares, terminals, open complaints, broadcasts).
* `GET /api/lgu/accounts/poso` ➔ List all POSO accounts.
* `POST /api/lgu/accounts/poso` ➔ Create new POSO officer account (`lgu` only).
* `PATCH /api/lgu/accounts/:id/status` ➔ Suspend / Activate POSO officer.
* `GET /api/lgu/broadcasts/pending` ➔ List POSO road alert requests awaiting review.
* `PATCH /api/lgu/broadcasts/:id/approve` ➔ Approve & publish alert to mobile commuters.
* `PATCH /api/lgu/broadcasts/:id/reject` ➔ Reject POSO alert.
* `POST /api/notifications/broadcast` ➔ Direct broadcast by LGU.
* `PATCH /api/complaints/:id/resolve` ➔ LGU action desk resolution.

##### C. POSO Routes (`/api/poso`)
* `GET /api/poso/complaints/triage` ➔ Commuter complaints (`pending` and `endorsed_to_lgu`).
* `PATCH /api/poso/complaints/:id/endorse` ➔ Endorse verified complaint to LGU with officer notes.
* `POST /api/poso/reports` ➔ Direct violation filing by POSO field officer.
* `POST /api/poso/broadcasts/request` ➔ Submit field alert for LGU approval.

---

### 4. Frontend Portal Architecture (`frontend/admin`)

#### 4.1 Single Entry Point (`/login`) & Dynamic AuthContext
* Users log in with email and password.
* `AuthContext.jsx` identifies:
  ```javascript
  const isAdmin = admin?.role === 'admin';
  const isLgu = admin?.role === 'lgu';
  const isPoso = admin?.role === 'poso';
  ```

#### 4.2 Sidebar Navigation Hierarchy (`Sidebar.jsx`)

##### For `Admin`:
1. **Systems & Accounts**
   * Dashboard (`/`) ➔ Dedicated Admin Dashboard (Active, Suspended, LGU metrics).
2. **Governance**
   * LGU Account Management (`/users`) ➔ LGU accounts only, "Add LGU Account", Suspend/Activate.
3. **Settings**
   * My Profile (`/profile`).

##### For `LGU`:
1. **City Transit Operations**
   * Master Dashboard (`/`) ➔ Full transit statistics, live metrics, graphs.
   * Fare Management (`/fares`) ➔ LTFRB rates & discount matrix.
   * Route Directory (`/routes`) ➔ All jeepney routes, stops, manual creator.
   * Terminal Hubs (`/terminals`) ➔ Dagupan bus/jeepney terminals.
2. **Citizen Safety & Enforcement**
   * Complaints Action Desk (`/complaints`) ➔ Endorsed complaints from POSO.
   * City Broadcaster (`/notifications`) ➔ Direct broadcasts + POSO approval queue.
3. **Personnel Management**
   * POSO Accounts (`/users`) ➔ POSO enforcers only, "Add POSO Officer", Suspend/Activate.
4. **Settings**
   * My Profile (`/profile`).

##### For `POSO`:
1. **Field Enforcement**
   * POSO Dashboard (`/`) ➔ Quick triage summary (Pending complaints, My filed reports, Active road alerts).
   * File Road Report (`/reports/new`) ➔ Direct violation filing form.
   * Complaints Hub (`/complaints`) ➔ Tab 1: Pending Verification, Tab 2: Endorsed to LGU.
   * Road Broadcaster (`/broadcasts`) ➔ Submit field alerts to LGU.
2. **Reference**
   * Route Directory (`/routes`) ➔ Read-only lookup for road verification.
   * Fare Rates (`/fares`) ➔ Read-only lookup for overcharging checks.
3. **Settings**
   * My Profile (`/profile`).

---

### 5. Seeding & Presentation Demo Data

The seed script will populate 3 distinct demo accounts with default credentials:
* **Admin**: `admin@smartsakay.com` / `Admin@12345` (Role: `admin`)
* **LGU Officer**: `lgu@smartsakay.com` / `Admin@12345` (Role: `lgu`)
* **POSO Field Officer**: `poso@smartsakay.com` / `Admin@12345` (Role: `poso`)

---

### 6. Spec Verification & Self-Review
* **Placeholders**: No TBDs or incomplete sections.
* **Consistency**: Role boundaries match the user request exactly.
* **Scope**: Cleanly structured into backend models/routes and frontend role-conditional components.
* **Ambiguity**: Endorsement flow, broadcast approval workflow, and account scopes explicitly designated.
