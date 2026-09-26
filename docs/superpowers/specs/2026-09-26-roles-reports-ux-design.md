# SmartSakay Dagupan: Multi-Role System, Complaint Workflow & UI/UX Design

**Date:** 2026-09-26  
**Status:** Approved  
**Scope:** Backend (Express/MongoDB), Admin Web Portal (React/Vite), and Mobile App (React Native/Expo)

---

## 1. Overview & Objectives

This design enhances SmartSakay Dagupan with:
1. **Granular Role-Based Access Control (RBAC)** across five distinct roles:
   - `superadmin`: Developer role; manages user accounts and system configuration.
   - `admin`: Operator role; verifies reports, forwards them to the LGU, or deletes them with documented dropdown reasons.
   - `lgu`: Dagupan City transit authorities (POSO / LGU); reviews verified reports, takes administrative/field action, and terminates/closes cases.
   - `commuter`: Registered public commuters; submits rate-limited reports with photo evidence, tracks grievances, and navigates transit.
   - `guest`: Read-only commuter browsing mode without requiring authentication.
2. **Report Deletion with Reason Dropdown**: Operators must select a standardized deletion reason before discarding a report. Reports are soft-deleted and permanently recorded in the system audit log.
3. **Commuter Protections & Restrictions**:
   - Daily rate limit of 5 reports per 24 hours per commuter to curb spam while maintaining open citizen reporting.
   - Evidence photo upload support (camera capture or gallery pick) stored securely on the backend.
   - Brute-force login defense: 5 consecutive failed login attempts locks the account for 15 minutes.
4. **Name Validation Update**: Support Filipino and international naming conventions with special characters (`.`, `'`, `-`) such as *Ma. Cristina*, *D'Angelo*, and *Dela Cruz-Santos*.
5. **Responsive UI/UX**: Device-adaptive typography, alignments, flex wrapping, and modal viewports on both mobile devices (from 320px compact screens to tablets) and the web administration console.

---

## 2. Architecture & Role Permission Matrix

### 2.1 Role Definitions & Capabilities

| Role | Interface | Key Responsibilities | Access Restrictions |
| :--- | :--- | :--- | :--- |
| **`superadmin`** (Developer) | Web Admin Console | Account Management (`/users`), role assignment, system health, audit logs (`/audit-logs`), full platform oversight. | Unrestricted. |
| **`admin`** (Operator) | Web Admin Console | Fares, Routes, Terminals, Announcement Broadcaster, Complaint triage (Verify to LGU, Delete with reason dropdown). | Cannot edit `superadmin` accounts or access system account creation. |
| **`lgu`** (City Authority) | Web Admin Console (LGU Desk) | Reviews verified reports forwarded by operators (`endorsed_to_lgu`), logs official enforcement actions (`action_taken`), terminates/resolves cases (`terminated`). | Read-only to fares/routes; no access to user accounts or operator deletion. |
| **`commuter`** | Mobile App | Route & fare inquiry, terminal locator, grievance reporting with photo evidence (max 5/day), push notifications, profile management. | Locked out for 15 mins after 5 failed logins. |
| **`guest`** | Mobile App | Free public transit browsing (fares, routes, terminals, announcements, schedules). | Cannot submit complaints or access user profile without registering/logging in. |

### 2.2 Route & Middleware RBAC Mapping

```text
/api/users (GET, POST, PUT, DELETE)              -> rbac('superadmin')
/api/admin/audit-logs                            -> rbac('superadmin')
/api/fares, /api/routes, /api/terminals (C/U/D)  -> rbac('superadmin', 'admin')
/api/notifications/broadcast                     -> rbac('superadmin', 'admin')

/api/complaints:
  POST /                                         -> rbac('commuter') [Enforces 5/day limit & photo upload]
  GET /my                                        -> rbac('commuter')
  GET /                                          -> rbac('superadmin', 'admin', 'lgu')
  PUT /:id/verify-lgu                            -> rbac('superadmin', 'admin')
  DELETE /:id                                    -> rbac('superadmin', 'admin') [Requires deletionReason]
  PUT /:id/lgu-action                            -> rbac('superadmin', 'lgu')
  PUT /:id/lgu-terminate                         -> rbac('superadmin', 'lgu')
```

---

## 3. Data Models Specification

### 3.1 `User` Model Schema (`server/src/models/User.js`)

```javascript
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  suffix: { type: String, trim: true, default: '' },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'lgu', 'commuter', 'guest'],
    default: 'commuter',
  },
  isVerified: { type: Boolean, default: true },
  profilePhoto: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: null },
  refreshToken: { type: String, default: null },
  
  // Brute-force defense
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
}, { timestamps: true });
```

### 3.2 `Complaint` Model Schema (`server/src/models/Complaint.js`)

```javascript
const complaintSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: {
    type: String,
    enum: ['overcharging', 'reckless_driving', 'harassment', 'route_deviation', 'vehicle_condition', 'other'],
    required: true,
  },
  subject: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', default: null },
  vehiclePlateNumber: { type: String, default: '', trim: true },
  location: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    address: { type: String, default: '' },
  },
  attachments: [{ type: String }], // Array of uploaded image URLs
  status: {
    type: String,
    enum: [
      'pending',          // Submitted by commuter
      'under_review',     // Operator evaluating report
      'endorsed_to_lgu',  // Verified by operator, sent to LGU
      'action_taken',     // LGU intervened / summons issued
      'terminated',       // Case resolved & officially closed
      'deleted',          // Operator rejected/soft-deleted
    ],
    default: 'pending',
  },
  
  // Operator Triage Fields
  adminNotes: { type: String, default: '' },
  lguCaseNumber: { type: String, default: '' },
  lguEndorsedAt: { type: Date, default: null },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // Deletion tracking
  deletionReason: {
    type: String,
    enum: [
      'Spam / False Information',
      'Duplicate Complaint',
      'Inappropriate / Abusive Content',
      'Insufficient Evidence / Details',
      'Resolved Informally',
      'Other',
      '',
    ],
    default: '',
  },
  deletionNotes: { type: String, default: '' },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  deletedAt: { type: Date, default: null },

  // LGU Enforcement Fields
  lguActionNotes: { type: String, default: '' },
  lguActionTakenAt: { type: Date, default: null },
  lguHandledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  lguTerminatedAt: { type: Date, default: null },
  lguTerminationNotes: { type: String, default: '' },
}, { timestamps: true });
```

---

## 4. Workflows & State Transitions

### 4.1 Complaint State Machine Diagram

```text
[ Commuter Submits Report (Photo Attached) ]
                    │
                    ▼
               ┌─────────┐
               │ pending │
               └────┬────┘
                    │ Operator Reviews
                    ▼
             ┌──────────────┐
             │ under_review │
             └───┬───────┬──┘
                 │       │
    Admin Verifies       │ Admin Deletes (Selects Reason Dropdown)
                 │       ▼
                 │   ┌─────────┐
                 │   │ deleted │ (Soft-deleted with reason & audit log)
                 │   └─────────┘
                 ▼
       ┌─────────────────┐
       │ endorsed_to_lgu │  ──> [Push Notification to Commuter: Case # Assigned]
       └────────┬────────┘
                │ LGU Takes Field Action
                ▼
       ┌────────────────┐
       │  action_taken  │  ──> [Push Notification: Action Taken by City Authorities]
       └────────┬───────┘
                │ LGU Resolves Grievance
                ▼
       ┌────────────────┐
       │   terminated   │  ──> [Push Notification: Case Closed & Resolved]
       └────────────────┘
```

---

## 5. Feature Implementation Details

### 5.1 Commuter Report Rate Limit (5 Reports / Day)
- In `complaintController.createComplaint`:
  - Calculate `startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);`
  - Query non-deleted complaints for `req.user._id` created `>= startOfDay`.
  - If `count >= 5`: return HTTP 429:
    `{ success: false, message: 'Daily report limit reached (5 reports per day). Please try again tomorrow.' }`
- In mobile `SubmitComplaintScreen.js`:
  - Display badge: `"Daily Reports: X/5 used"`.
  - Pre-validate and prevent form submission when quota is exhausted.

### 5.2 Evidence Photo Upload
- **Backend**:
  - Middleware `upload.js` utilizing `multer.diskStorage`.
  - Upload destination: `server/uploads/complaints/`.
  - Validates file type: `image/jpeg`, `image/png`, `image/webp`.
  - Max file size: `5MB`.
  - Endpoints:
    - Dedicated upload: `POST /api/complaints/upload-evidence` returning `{ url: '/uploads/complaints/filename.jpg' }`.
    - Or multipart body directly on `POST /api/complaints`.
- **Mobile**:
  - Uses `expo-image-picker` with Camera and Photo Library permissions.
  - Option 1: "Take Photo with Camera".
  - Option 2: "Choose from Photo Gallery".
  - Live thumbnail preview with remove button.
- **Web Admin/LGU**:
  - Evidence gallery in `ComplaintsPage.jsx` with full lightbox modal preview.

### 5.3 Brute-Force Login Lockout (5 Failed Attempts / 15 Minutes)
- In `authController.login`:
  - Check if `user.lockUntil && user.lockUntil > new Date()`.
    - If locked: calculate remaining minutes and reject with HTTP 423 Locked:
      `"Account temporarily locked due to multiple failed login attempts. Please try again in X minute(s)."`
  - If password fails:
    - Increment `user.failedLoginAttempts += 1`.
    - If `user.failedLoginAttempts >= 5`:
      - Set `user.lockUntil = new Date(Date.now() + 15 * 60 * 1000)`.
    - Save user and return HTTP 401 with remaining attempts warning.
  - If password succeeds:
    - Reset `user.failedLoginAttempts = 0` and `user.lockUntil = null`.

### 5.4 Name Validation with Special Characters (`.`, `'`, `-`)
- Pattern: `/^[A-Za-z][A-Za-z\s.'-]*[A-Za-z.]$/` with length 2–25 characters.
- Backend:
  - Updated in `server/src/validators/authValidator.js` (`registerSchema`, `updateProfileSchema`).
- Mobile:
  - Updated in `mobile/src/screens/auth/RegisterScreen.js` and `mobile/src/screens/profile/ProfileScreen.js`.
  - Descriptive user error: *"Name can only contain letters, spaces, and characters: . ' -"*

### 5.5 UI/UX Device Responsiveness & Layout Adaptations
- **Mobile (`react-native`)**:
  - Replace static widths with flex layouts, `flexShrink: 1`, and `flexWrap: 'wrap'`.
  - Safe-area insets padding across various notches and bottom home indicators.
  - Text auto-wrapping for long Dagupan terminal and route names.
- **Web Admin Console (`admin`)**:
  - Responsive tables with horizontal scroll and responsive card view on tablets (`< 1024px`).
  - Scoped sidebar navigation adapting to user role (`superadmin`, `admin`, `lgu`).
  - Mobile/tablet friendly modals with viewport bounded scrolling (`max-height: 85vh`).

---

## 6. Verification & Testing Strategy

1. **RBAC & Role Access Verification**:
   - `superadmin`: Access `/users`, create/edit accounts, view audit logs.
   - `admin`: Triage complaints (verify to LGU, delete with dropdown reason); access to `/users` denied.
   - `lgu`: Access only verified complaints (`endorsed_to_lgu`, `action_taken`, `terminated`), record action, terminate; route/fare editing denied.
2. **Report Deletion Verification**:
   - Operator selects reason from dropdown.
   - Soft-delete verified in DB (`status: 'deleted'`).
   - AuditLog record created with reason and operator ID.
3. **Rate Limiting & Lockout Verification**:
   - Commuter submits 5 reports; 6th report returns HTTP 429.
   - 5 failed login attempts triggers 15-minute lock.
4. **Photo Upload Verification**:
   - Commuter attaches photo; verified in `uploads/complaints/` and visible in admin lightbox.
5. **Name Validation Verification**:
   - Names like `Ma. Cristina`, `D'Angelo`, `Dela Cruz-Santos` pass registration and profile update without errors.
