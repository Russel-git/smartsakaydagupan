# Multi-Role System, Complaint Workflow & UI/UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement granular RBAC (`superadmin`, `admin`, `lgu`, `commuter`, `guest`), report verification/deletion with dropdown reasons, LGU Action Desk, commuter daily limit (5/day) with photo evidence upload, brute-force login lockout (5 failed attempts locks for 15 minutes), name validation with special characters (`.`, `'`, `-`), and responsive UI/UX across mobile and web.

**Architecture:** Backend models (`User`, `Complaint`) and controllers extended with RBAC middleware, Multer storage for complaint photos, login attempt counters, and daily report counts. Admin web app refactored with role-aware sidebar, LGU Action Desk, and Delete Reason modal. Mobile app enhanced with photo picker, daily report limit indicator, guest prompt gates, and name regex updates.

**Tech Stack:** Node.js, Express 5, MongoDB / Mongoose, Joi, Multer, React 19, Vite, React Native / Expo 57, Lucide Icons, MaterialCommunityIcons.

**Spec:** `docs/superpowers/specs/2026-09-26-roles-reports-ux-design.md`

## Global Constraints

- Backend must run on Node.js / Express 5 with Mongoose models.
- All database modifications must maintain backward compatibility with existing seeds and user records.
- Soft-deletion must be used for discarded complaints (`status: 'deleted'`) to preserve audit logging.
- Name regex must strictly match: `/^[A-Za-z][A-Za-z\s.'-]*[A-Za-z.]$/` with length 2–25 characters.
- Commuter report limit is exactly 5 reports per calendar day per commuter.
- Brute-force lockout is exactly 5 failed consecutive attempts locking for 15 minutes.

## Review Focus

1. Commuter reaches 5 complaints and submits a 6th: server must reject with HTTP 429 and informative message.
2. Operator deletes complaint without selecting a reason from dropdown: server must reject with HTTP 400 validation error.
3. Commuter enters valid names with `. ' -` (e.g. `Ma. Cristina`, `D'Angelo`, `Dela Cruz-Santos`): passes both backend Joi and mobile forms without error.
4. User enters 5 incorrect passwords: account locked for 15 minutes; subsequent login before 15 minutes returns HTTP 423 even if password is correct.
5. Non-superadmin (`admin` or `lgu`) attempts to call `/api/users`: rejected with HTTP 403 Forbidden.

---

### Task 1: User Model Roles, Lockout Fields & Name Validation

**Files:**
- Modify: `server/src/models/User.js`
- Modify: `server/src/validators/authValidator.js`
- Create: `server/tests/unit/userValidation.test.js`

**Interfaces:**
- Consumes: Mongoose schema, Joi validation
- Produces: Updated `User` model with roles `['superadmin', 'admin', 'lgu', 'commuter', 'guest']`, `failedLoginAttempts`, `lockUntil`, and relaxed name validation pattern `/^[A-Za-z][A-Za-z\s.'-]*[A-Za-z.]$/`.

- [ ] **Step 1: Write unit tests for User schema roles, lockout fields, and name validation regex**

```javascript
// server/tests/unit/userValidation.test.js
const { registerSchema, updateProfileSchema } = require('../../src/validators/authValidator');
const User = require('../../src/models/User');

describe('User Model & Auth Validation', () => {
  describe('Name Validation with Special Characters', () => {
    const validNames = [
      'Juan',
      'Ma. Cristina',
      "D'Angelo",
      'O’Connor',
      'Dela Cruz-Santos',
      'St. John',
      'Mary-Ann',
    ];

    validNames.forEach((name) => {
      it(`accepts valid name: "${name}"`, () => {
        const { error } = registerSchema.validate({
          email: 'test@example.com',
          password: 'Password123!',
          firstName: name,
          lastName: 'Santos',
        });
        expect(error).toBeUndefined();
      });
    });

    it('rejects invalid names with numbers or symbols like @, $, #', () => {
      const { error } = registerSchema.validate({
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Juan123',
        lastName: 'Santos',
      });
      expect(error).toBeDefined();
    });
  });

  describe('User Model Role Enum & Lockout Fields', () => {
    it('defines superadmin and lgu roles', () => {
      const roleEnum = User.schema.path('role').enumValues;
      expect(roleEnum).toContain('superadmin');
      expect(roleEnum).toContain('admin');
      expect(roleEnum).toContain('lgu');
      expect(roleEnum).toContain('commuter');
      expect(roleEnum).toContain('guest');
    });

    it('defines failedLoginAttempts and lockUntil fields', () => {
      expect(User.schema.path('failedLoginAttempts')).toBeDefined();
      expect(User.schema.path('lockUntil')).toBeDefined();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- server/tests/unit/userValidation.test.js`
Expected: FAIL (missing roles, fields, or regex mismatch)

- [ ] **Step 3: Update `User.js` and `authValidator.js`**

In `server/src/models/User.js`:
Add `'superadmin'`, `'lgu'` to `role.enum`.
Add `failedLoginAttempts: { type: Number, default: 0 }`.
Add `lockUntil: { type: Date, default: null }`.

In `server/src/validators/authValidator.js`:
Update `firstName` and `lastName` regex in `registerSchema` and `updateProfileSchema`:
`pattern(/^[A-Za-z][A-Za-z\s.'-]*[A-Za-z.]$/)` with `.min(2).max(25)`.
Update error messages to: `"Name can only contain letters, spaces, and characters: . ' -"`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- server/tests/unit/userValidation.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/models/User.js server/src/validators/authValidator.js server/tests/unit/userValidation.test.js
git commit -m "feat(auth): add superadmin and lgu roles, lockout fields, and special character name regex"
```

---

### Task 2: Brute-Force Login Lockout & Superadmin Account Controller

**Files:**
- Modify: `server/src/controllers/authController.js`
- Modify: `server/src/controllers/userController.js`
- Modify: `server/src/routes/userRoutes.js`
- Modify: `server/src/seeds/index.js`
- Create: `server/tests/unit/authLockout.test.js`

**Interfaces:**
- Consumes: `User` model, `apiResponse`, `logAuditEvent`
- Produces: Lockout logic on login (5 failed attempts -> 15 min lock), superadmin-exclusive endpoints for account management (`createUser`, `updateUserRole`).

- [ ] **Step 1: Write integration tests for login lockout and user management permissions**

```javascript
// server/tests/unit/authLockout.test.js
const { login } = require('../../src/controllers/authController');
const User = require('../../src/models/User');

describe('Auth Controller Lockout Logic', () => {
  it('correctly tracks failed attempts and locks out at 5 attempts', async () => {
    const user = new User({
      email: 'lockout@example.com',
      passwordHash: 'hashed_pw',
      firstName: 'Lock',
      lastName: 'Out',
      role: 'commuter',
      failedLoginAttempts: 4,
    });
    // Next failed attempt should set lockUntil
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= 5) {
      user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
    }
    expect(user.failedLoginAttempts).toBe(5);
    expect(user.lockUntil.getTime()).toBeGreaterThan(Date.now());
  });
});
```

- [ ] **Step 2: Update `authController.js` login logic**

In `server/src/controllers/authController.js`:
- In `login`:
  - Check `user.lockUntil && user.lockUntil > new Date()`. If true, return HTTP 423:
    `const remainingMinutes = Math.ceil((user.lockUntil - new Date()) / (60 * 1000)); return apiResponse.error(res, \`Account temporarily locked due to multiple failed login attempts. Please try again in \${remainingMinutes} minute(s).\`, 423);`
  - When password does NOT match:
    - Increment `user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;`
    - If `user.failedLoginAttempts >= 5`: `user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);`
    - `await user.save();`
    - Return `Invalid email or password. (${5 - user.failedLoginAttempts > 0 ? (5 - user.failedLoginAttempts) + ' attempts remaining before temporary lockout.' : 'Account locked for 15 minutes.'})` with 401.
  - When password matches:
    - If `user.failedLoginAttempts > 0 || user.lockUntil`:
      - `user.failedLoginAttempts = 0; user.lockUntil = null;`
    - `await user.save();`

- [ ] **Step 3: Update `userController.js` and `userRoutes.js` for Superadmin Account Management**

In `server/src/controllers/userController.js`:
- Add `createUser`: Allows `superadmin` to create admin, lgu, or commuter accounts directly with temporary password, firstName, lastName, suffix, role.
- Add `updateUserRole`: Allows `superadmin` to change role to `'admin'`, `'lgu'`, `'commuter'`.
- In `deleteUser`: Prevent deleting `superadmin` accounts.
- In `server/src/routes/userRoutes.js`: Change user management RBAC from `rbac('admin')` to `rbac('superadmin')`.
- In `server/src/seeds/index.js`: Ensure default developer account has `role: 'superadmin'` (e.g., `developer@smartsakay.ph` / `admin@smartsakay.ph`).

- [ ] **Step 4: Run tests to verify it passes**

Run: `npm test -- server/tests/unit/authLockout.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/controllers/authController.js server/src/controllers/userController.js server/src/routes/userRoutes.js server/src/seeds/index.js server/tests/unit/authLockout.test.js
git commit -m "feat(auth): enforce 5-attempt login lockout and superadmin user management"
```

---

### Task 3: Complaint Model, Multer Upload & Commuter Rate Limiter

**Files:**
- Modify: `server/src/models/Complaint.js`
- Create: `server/src/middleware/upload.js`
- Modify: `server/src/validators/complaintValidator.js`
- Modify: `server/src/controllers/complaintController.js`
- Modify: `server/src/routes/complaintRoutes.js`
- Create: `server/tests/unit/complaintWorkflow.test.js`

**Interfaces:**
- Consumes: `Complaint` model, Multer, Joi validator
- Produces: `uploadEvidence` middleware, daily report rate limit (5/day), dropdown soft-deletion (`DELETE /api/complaints/:id`), LGU verify (`PUT /api/complaints/:id/verify-lgu`), LGU action (`PUT /api/complaints/:id/lgu-action`), LGU terminate (`PUT /api/complaints/:id/lgu-terminate`).

- [ ] **Step 1: Write integration tests for report limit, soft deletion, and LGU workflow**

```javascript
// server/tests/unit/complaintWorkflow.test.js
const Complaint = require('../../src/models/Complaint');

describe('Complaint Schema & Status Transitions', () => {
  it('supports new statuses including endorsed_to_lgu, action_taken, terminated, deleted', () => {
    const statusEnum = Complaint.schema.path('status').enumValues;
    expect(statusEnum).toContain('pending');
    expect(statusEnum).toContain('under_review');
    expect(statusEnum).toContain('endorsed_to_lgu');
    expect(statusEnum).toContain('action_taken');
    expect(statusEnum).toContain('terminated');
    expect(statusEnum).toContain('deleted');
  });

  it('supports deletion reason and LGU tracking fields', () => {
    expect(Complaint.schema.path('deletionReason')).toBeDefined();
    expect(Complaint.schema.path('deletedBy')).toBeDefined();
    expect(Complaint.schema.path('lguActionNotes')).toBeDefined();
    expect(Complaint.schema.path('lguTerminatedAt')).toBeDefined();
  });
});
```

- [ ] **Step 2: Update `Complaint.js` model**

In `server/src/models/Complaint.js`:
- Update `status.enum` to: `['pending', 'under_review', 'endorsed_to_lgu', 'action_taken', 'terminated', 'deleted', 'endorsed_to_ltfrb', 'resolved', 'dismissed']` (preserving legacy aliases for backward compatibility).
- Add `deletionReason`, `deletionNotes`, `deletedBy`, `deletedAt`.
- Add `lguCaseNumber`, `lguEndorsedAt`, `lguActionNotes`, `lguActionTakenAt`, `lguHandledBy`, `lguTerminatedAt`, `lguTerminationNotes`.

- [ ] **Step 3: Create Multer upload middleware `server/src/middleware/upload.js`**

```javascript
// server/src/middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads/complaints');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `evidence-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPEG, PNG, and WebP images are allowed.'), false);
};

const uploadEvidence = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter,
});

module.exports = { uploadEvidence };
```

- [ ] **Step 4: Update `complaintValidator.js`**

Add schemas for:
- `deleteComplaintSchema`: `deletionReason` required (valid from predefined list), `deletionNotes` optional.
- `lguActionSchema`: `lguActionNotes` required.
- `lguTerminateSchema`: `lguTerminationNotes` optional.

- [ ] **Step 5: Update `complaintController.js` and `complaintRoutes.js`**

In `complaintController.js`:
- In `createComplaint`:
  - Check commuter daily report count:
    ```javascript
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const countToday = await Complaint.countDocuments({
      userId: req.user._id,
      createdAt: { $gte: startOfDay },
      status: { $ne: 'deleted' },
    });
    if (countToday >= 5) {
      return apiResponse.error(res, 'Daily report limit reached (5 reports per day). Please wait until tomorrow to submit additional reports.', 429);
    }
    ```
- Add `uploadEvidencePhoto`: Upload single evidence photo and return URL `/uploads/complaints/...`.
- Add `verifyAndEndorseToLgu`: Sets `status = 'endorsed_to_lgu'`, generates tracking case # `LGU-DAG-YYYY-XXXXXX`, sends in-app notification to commuter.
- Add `deleteComplaintWithReason`: Soft-deletes complaint: sets `status = 'deleted'`, records `deletionReason`, `deletedBy`, `deletedAt`, logs audit event.
- Add `lguTakeAction`: Sets `status = 'action_taken'`, records `lguActionNotes`, `lguActionTakenAt`, `lguHandledBy`, sends in-app notification.
- Add `lguTerminate`: Sets `status = 'terminated'`, records `lguTerminatedAt`, `lguTerminationNotes`, sends in-app notification.
- Update `getAllComplaints`:
  - If `req.user.role === 'lgu'`: filter complaints to `status: { $in: ['endorsed_to_lgu', 'action_taken', 'terminated'] }`.
  - Exclude `status: 'deleted'` unless explicitly requested by superadmin.

In `complaintRoutes.js`:
- Wire routes with RBAC:
  - `POST /upload-photo`: `rbac('commuter')`, `uploadEvidence.single('photo')`
  - `PUT /:id/verify-lgu`: `rbac('superadmin', 'admin')`
  - `DELETE /:id`: `rbac('superadmin', 'admin')` with `validate(deleteComplaintSchema)`
  - `PUT /:id/lgu-action`: `rbac('superadmin', 'lgu')` with `validate(lguActionSchema)`
  - `PUT /:id/lgu-terminate`: `rbac('superadmin', 'lgu')` with `validate(lguTerminateSchema)`

- [ ] **Step 6: Run tests to verify it passes**

Run: `npm test -- server/tests/unit/complaintWorkflow.test.js`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add server/src/models/Complaint.js server/src/middleware/upload.js server/src/validators/complaintValidator.js server/src/controllers/complaintController.js server/src/routes/complaintRoutes.js server/tests/unit/complaintWorkflow.test.js
git commit -m "feat(complaints): add daily limit, photo upload, soft-delete with dropdown reason, and LGU workflow"
```

---

### Task 4: Web Admin Console Role Navigation & Account Management

**Files:**
- Modify: `admin/src/contexts/AuthContext.jsx`
- Modify: `admin/src/components/layout/AdminLayout.jsx`
- Modify: `admin/src/pages/UsersPage.jsx`

**Interfaces:**
- Consumes: `/api/auth/login`, `/api/users`
- Produces: Role-aware navigation (`superadmin`, `admin`, `lgu`), account creation & role management modal for superadmin.

- [ ] **Step 1: Update `AuthContext.jsx`**

Allow login for `admin`, `superadmin`, and `lgu` roles (reject only `commuter` and `guest` from admin console).
Store user role and provide helper flags: `isSuperAdmin`, `isAdmin`, `isLgu`.

- [ ] **Step 2: Update `AdminLayout.jsx`**

Conditionally display navigation items based on role:
- `superadmin`: All items (Dashboard, Fares, Routes, Terminals, Complaints, Broadcaster, User Directory, Audit Logs).
- `admin` (Operator): Dashboard, Fares, Routes, Terminals, Complaints, Broadcaster.
- `lgu`: Dashboard, LGU Action Desk (`/complaints`).
Display role badge in user profile drawer: "Superadmin (Developer)", "Operator (Admin)", or "LGU Authority".

- [ ] **Step 3: Update `UsersPage.jsx` for Superadmin Account Management**

Add an "Add New Staff Account" modal allowing the Superadmin to create accounts with:
- First Name, Last Name, Suffix
- Email, Temporary Password
- Role Selector dropdown: `['admin', 'lgu', 'superadmin']`
Add role badge in table with color coding:
- `superadmin`: Royal purple
- `admin`: Amber / Teal
- `lgu`: Emerald green
- `commuter`: Sky blue
Allow Superadmin to edit roles and toggle active status.

- [ ] **Step 4: Commit**

```bash
git add admin/src/contexts/AuthContext.jsx admin/src/components/layout/AdminLayout.jsx admin/src/pages/UsersPage.jsx
git commit -m "feat(admin): implement role-aware layout and superadmin account management"
```

---

### Task 5: Web Admin Complaints Triage & LGU Action Desk

**Files:**
- Modify: `admin/src/pages/ComplaintsPage.jsx`
- Create: `admin/src/components/complaints/DeleteReasonModal.jsx`
- Create: `admin/src/components/complaints/LguActionModal.jsx`

**Interfaces:**
- Consumes: `/api/complaints/*` endpoints
- Produces: "Verify & Send to LGU" action, "Delete Report" modal with reason dropdown, "LGU Action Desk" action modals, and evidence photo lightbox.

- [ ] **Step 1: Create `DeleteReasonModal.jsx`**

Modal with dropdown options:
- `Spam / False Information`
- `Duplicate Complaint`
- `Inappropriate / Abusive Content`
- `Insufficient Evidence / Details`
- `Resolved Informally`
- `Other`
Optional notes textarea, confirm button "Delete Report" (danger styling), and cancel button.

- [ ] **Step 2: Create `LguActionModal.jsx`**

Modal with two tabs or modes:
1. "Record Enforcement Action" (input: action taken details, e.g. summons, citation).
2. "Terminate / Close Case" (input: final closure summary and resolution findings).

- [ ] **Step 3: Refactor `ComplaintsPage.jsx`**

- For `admin`:
  - Show "Verify & Send to LGU" button on pending/under-review reports.
  - Show "Delete Report" button triggering `DeleteReasonModal`.
- For `lgu`:
  - Label view as "LGU Action Desk - City of Dagupan".
  - Filter view by default to verified cases (`endorsed_to_lgu`, `action_taken`, `terminated`).
  - Provide "Take Action" and "Terminate Case" buttons on active complaints.
- For all:
  - Display evidence photo attachments with thumbnail gallery and click-to-expand lightbox preview.

- [ ] **Step 4: Commit**

```bash
git add admin/src/pages/ComplaintsPage.jsx admin/src/components/complaints/DeleteReasonModal.jsx admin/src/components/complaints/LguActionModal.jsx
git commit -m "feat(complaints): add operator verification, reason dropdown deletion, and LGU action desk"
```

---

### Task 6: Mobile Commuter Updates (Photo Picker, Daily Limit & Name Validation)

**Files:**
- Modify: `mobile/src/screens/auth/RegisterScreen.js`
- Modify: `mobile/src/screens/profile/ProfileScreen.js`
- Modify: `mobile/src/screens/complaints/SubmitComplaintScreen.js`
- Modify: `mobile/src/screens/complaints/ComplaintDetailScreen.js`

**Interfaces:**
- Consumes: `expo-image-picker`, `/api/complaints/upload-photo`, `/api/complaints`
- Produces: Photo attachment support in report form, 5-report daily limit badge, relaxed name validation for special characters (`. ' -`).

- [ ] **Step 1: Update name validation in `RegisterScreen.js` and `ProfileScreen.js`**

Update `cleanFirst` and `cleanLast` regex from `/^[A-Za-z]+(\s[A-Za-z]+)*$/` to `/^[A-Za-z][A-Za-z\s.'-]*[A-Za-z.]$/`.
Update error helper text: `"First name can only contain letters, spaces, and characters: . ' -"`.

- [ ] **Step 2: Update `SubmitComplaintScreen.js`**

- Add photo picker with `expo-image-picker`:
  - `launchCameraAsync` ("Take Photo")
  - `launchImageLibraryAsync` ("Choose from Gallery")
  - Display selected image preview with a remove icon.
- Add daily report limit indicator:
  - Fetch count of user's reports today from `/api/complaints/my`.
  - Display badge: `"Daily Reports: X/5 used today"`.
  - If 5 reached, disable submit button with warning text.
- Upload photo upon submission to `/api/complaints/upload-photo` and attach URL to `attachments`.

- [ ] **Step 3: Update `ComplaintDetailScreen.js`**

Render evidence photos in the report details view with zoomable image modal.
Show updated status badge: `Endorsed to LGU`, `Action Taken by LGU`, `Terminated / Resolved`.

- [ ] **Step 4: Commit**

```bash
git add mobile/src/screens/auth/RegisterScreen.js mobile/src/screens/profile/ProfileScreen.js mobile/src/screens/complaints/SubmitComplaintScreen.js mobile/src/screens/complaints/ComplaintDetailScreen.js
git commit -m "feat(mobile): add photo evidence picker, daily report limit indicator, and special character names"
```

---

### Task 7: UI/UX Responsiveness Polish & End-to-End Verification

**Files:**
- Modify: `admin/src/index.css`
- Modify: `mobile/src/screens/home/HomeScreen.js`
- Modify: `mobile/src/screens/routes/RoutesListScreen.js`

**Interfaces:**
- Consumes: Layout components and styles
- Produces: Fluid device-responsive layout adjustments, flexible text wraps, and passing integration verification.

- [ ] **Step 1: Web Admin CSS responsiveness polish**

In `admin/src/index.css`:
- Ensure tables scroll smoothly horizontally on tablet screens.
- Modals wrap gracefully with `max-height: 85vh` and auto-scrolling body.
- Dropdowns and status pills maintain proper alignment across all viewports.

- [ ] **Step 2: Mobile text wrapping and layout adaptability**

In `HomeScreen.js` and `RoutesListScreen.js`:
- Add `flexShrink: 1` and `flexWrap: 'wrap'` to prevent title truncation on compact phones.
- Ensure buttons and cards scale properly regardless of device font scaling settings.

- [ ] **Step 3: Run security and verification test suite**

Run: `npm test` in `server`
Verify all unit and security tests pass with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add admin/src/index.css mobile/src/screens/home/HomeScreen.js mobile/src/screens/routes/RoutesListScreen.js
git commit -m "feat(ui): refine device responsiveness, text alignment, and verify test suite"
```
