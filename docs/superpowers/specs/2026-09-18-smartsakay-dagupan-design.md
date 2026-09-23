# SmartSakay Dagupan — Design Specification

A cross-platform commuter application for Dagupan City and neighboring municipalities, providing fare verification, route guidance, real-time location tracking, AI-powered assistance, weather updates, and a complaint/feedback system.

---

## 1. Project Overview

### 1.1 Purpose
SmartSakay Dagupan empowers commuters in Dagupan City and surrounding Pangasinan municipalities with verified fare information, route maps, an AI assistant knowledgeable about commuter rights and local routes, and tools to report complaints — all in a single mobile application.

### 1.2 Target Users
- **Guests** — Can view fare information and routes only. No account required.
- **Commuters** — Registered users with full access to all features including reporting, AI assistant, real-time tracking, and notifications.
- **Admins** — Manage fare rates, routes, users, complaints, and system content via web dashboard and mobile app.

### 1.3 Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Mobile App | React Native CLI (bare workflow) | Full native control, cross-platform iOS + Android |
| Admin Dashboard | React.js SPA | Web-accessible admin panel |
| Backend | Node.js + Express.js | REST API server |
| Database | MongoDB + Mongoose | Flexible document store for all data |
| Maps | react-native-maps + OpenStreetMap tiles | Free, native performance |
| AI Assistant | Google Gemini API (primary) + Groq/Llama 3.1 (fallback) | Free tiers, excellent quality |
| Weather | WeatherAPI.com | 1M calls/month free tier |
| Auth | JWT + bcrypt + Nodemailer (Gmail SMTP OTP) | Free email-based verification |
| Notifications | In-app (MongoDB-backed) | Notification bell UI, no external service |
| Version Control | GitHub | Code management and collaboration |

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                         │
│  ┌──────────────────┐    ┌───────────────────────────┐  │
│  │  React Native    │    │   React.js Admin          │  │
│  │  Mobile App      │    │   Web Dashboard           │  │
│  │  (iOS + Android) │    │   (Browser)               │  │
│  └────────┬─────────┘    └─────────────┬─────────────┘  │
└───────────┼────────────────────────────┼────────────────┘
            │          HTTPS/REST        │
            ▼                            ▼
┌─────────────────────────────────────────────────────────┐
│                   API LAYER                             │
│  ┌──────────────────────────────────────────────────┐   │
│  │           Node.js + Express.js Server            │   │
│  │                                                  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌─────────────────┐  │   │
│  │  │ Auth     │ │ Fare     │ │ AI Assistant    │  │   │
│  │  │ Module   │ │ Module   │ │ Module          │  │   │
│  │  └──────────┘ └──────────┘ └─────────────────┘  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌─────────────────┐  │   │
│  │  │ Route    │ │ Weather  │ │ Complaint       │  │   │
│  │  │ Module   │ │ Module   │ │ Module          │  │   │
│  │  └──────────┘ └──────────┘ └─────────────────┘  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌─────────────────┐  │   │
│  │  │ Notif.   │ │ Admin    │ │ User            │  │   │
│  │  │ Module   │ │ Module   │ │ Module          │  │   │
│  │  └──────────┘ └──────────┘ └─────────────────┘  │   │
│  └──────────────────────┬───────────────────────────┘   │
└─────────────────────────┼───────────────────────────────┘
                          │
            ┌─────────────▼──────────────┐
            │       DATA LAYER           │
            │  ┌──────────────────────┐  │
            │  │      MongoDB         │  │
            │  │  (Atlas / Local)     │  │
            │  └──────────────────────┘  │
            └────────────────────────────┘

External Services:
  ├── Google Gemini API (AI primary)
  ├── Groq API (AI fallback)
  ├── WeatherAPI.com (weather data)
  ├── Gmail SMTP (OTP emails)
  └── OpenStreetMap (map tiles)
```

### 2.2 Monorepo Structure

```
smartsakay-dagupan/
├── mobile/                    # React Native CLI app
│   ├── android/
│   ├── ios/
│   ├── src/
│   │   ├── api/              # API client (axios)
│   │   ├── assets/           # Images, fonts, icons
│   │   ├── components/       # Reusable UI components
│   │   │   ├── common/       # Buttons, inputs, cards
│   │   │   ├── maps/         # Map components
│   │   │   ├── chat/         # AI assistant UI
│   │   │   └── fare/         # Fare calculator UI
│   │   ├── contexts/         # React Context providers
│   │   ├── hooks/            # Custom hooks
│   │   ├── navigation/       # React Navigation config
│   │   ├── screens/          # Screen components
│   │   │   ├── auth/         # Login, Register, OTP
│   │   │   ├── home/         # Home / Dashboard
│   │   │   ├── fare/         # Fare calculator
│   │   │   ├── map/          # Map / Route locator
│   │   │   ├── assistant/    # AI chatbot
│   │   │   ├── weather/      # Weather updates
│   │   │   ├── complaints/   # Report & feedback
│   │   │   ├── notifications/# Notification center
│   │   │   ├── profile/      # User profile
│   │   │   └── admin/        # Basic admin screens
│   │   ├── services/         # Business logic
│   │   ├── utils/            # Helpers, constants
│   │   └── App.tsx
│   ├── package.json
│   └── tsconfig.json
│
├── admin/                     # React.js admin dashboard
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   │   ├── layout/       # Sidebar, header, footer
│   │   │   ├── dashboard/    # Stats, charts
│   │   │   ├── users/        # User management
│   │   │   ├── fares/        # Fare CRUD
│   │   │   ├── routes/       # Route management
│   │   │   ├── complaints/   # Complaint review
│   │   │   └── notifications/# Send notifications
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   ├── package.json
│   └── vite.config.js
│
├── server/                    # Node.js + Express backend
│   ├── src/
│   │   ├── config/           # DB, env, constants
│   │   ├── controllers/      # Request handlers
│   │   ├── middleware/       # Auth, validation, error handling, rate limiting
│   │   ├── models/           # Mongoose schemas
│   │   ├── routes/           # Express route definitions
│   │   ├── services/         # Business logic (AI, weather, email)
│   │   ├── utils/            # Helpers, validators
│   │   ├── seeds/            # Initial data (routes, fares)
│   │   └── app.js            # Express app setup
│   ├── package.json
│   └── .env.example
│
├── shared/                    # Shared types, constants
│   ├── constants/
│   └── types/
│
├── docs/                      # Documentation
├── .gitignore
├── package.json               # Root package.json (workspaces)
└── README.md
```

---

## 3. Database Schema Design

### 3.1 Users Collection

```javascript
{
  _id: ObjectId,
  email: String,              // unique, required
  passwordHash: String,       // bcrypt hashed
  firstName: String,
  lastName: String,
  role: String,               // "guest" | "commuter" | "admin"
  isVerified: Boolean,        // email OTP verified
  profilePhoto: String,       // URL or base64
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date,
  isActive: Boolean           // soft delete / ban
}
```

### 3.2 OTP Collection

```javascript
{
  _id: ObjectId,
  email: String,
  code: String,               // 6-digit code (hashed)
  type: String,               // "registration" | "password_reset" | "login"
  expiresAt: Date,            // TTL index, auto-delete
  attempts: Number,           // max 5 attempts
  createdAt: Date
}
```

### 3.3 Routes Collection

```javascript
{
  _id: ObjectId,
  name: String,               // "Bonuan Tondaligan"
  code: String,               // "BONUAN_TONDALIGAN"
  category: String,           // "city" | "intercity"
  description: String,
  distanceKm: Number,         // estimated distance from Downtown
  startPoint: {
    name: String,
    lat: Number,
    lng: Number
  },
  endPoint: {
    name: String,
    lat: Number,
    lng: Number
  },
  waypoints: [{               // intermediate stops
    name: String,
    lat: Number,
    lng: Number,
    order: Number
  }],
  terminalLocation: {
    name: String,
    address: String,
    lat: Number,
    lng: Number
  },
  operatingHours: {
    start: String,            // "04:00"
    end: String               // "21:00"
  },
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 3.4 Fares Collection

```javascript
{
  _id: ObjectId,
  vehicleType: String,        // "traditional" | "modern"
  baseFare: Number,           // ₱14.00 or ₱17.00
  baseDistanceKm: Number,     // 4 km
  perKmRate: Number,          // ₱2.00 or ₱2.40
  discounts: {
    student: Number,          // 0.20 (20%)
    seniorCitizen: Number,    // 0.20
    pwd: Number               // 0.20
  },
  effectiveDate: Date,        // "2026-03-19"
  memorandumRef: String,      // "LTFRB MC 2026-XXX"
  source: String,             // "LTFRB"
  isActive: Boolean,          // only one active per vehicleType
  createdAt: Date,
  updatedAt: Date
}
```

### 3.5 Fare Matrix Collection (Pre-calculated per route)

```javascript
{
  _id: ObjectId,
  routeId: ObjectId,          // ref: Routes
  fareId: ObjectId,           // ref: Fares
  vehicleType: String,
  regularFare: Number,        // calculated fare
  discountedFare: Number,     // after 20% discount
  distanceKm: Number,
  isActive: Boolean,
  updatedAt: Date
}
```

### 3.6 Complaints Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId,           // ref: Users (commuter)
  category: String,           // "overcharging" | "reckless_driving" | "harassment"
                              // | "route_deviation" | "vehicle_condition" | "other"
  subject: String,
  description: String,
  routeId: ObjectId,          // ref: Routes (optional)
  vehiclePlateNumber: String, // optional
  location: {
    lat: Number,
    lng: Number,
    address: String
  },
  attachments: [String],      // image URLs
  status: String,             // "pending" | "under_review" | "resolved" | "dismissed"
  adminNotes: String,
  resolvedBy: ObjectId,       // ref: Users (admin)
  resolvedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 3.7 Notifications Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId,           // ref: Users (null = broadcast)
  title: String,
  message: String,
  type: String,               // "fare_update" | "weather_alert" | "complaint_update"
                              // | "system" | "broadcast"
  isRead: Boolean,
  metadata: Object,           // flexible extra data
  createdAt: Date,
  expiresAt: Date             // TTL for auto-cleanup
}
```

### 3.8 Chat History Collection (AI Assistant)

```javascript
{
  _id: ObjectId,
  userId: ObjectId,           // ref: Users
  sessionId: String,          // groups a conversation
  messages: [{
    role: String,             // "user" | "assistant"
    content: String,
    timestamp: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

---

## 4. Feature Specifications

### 4.1 Authentication & Account Management

**Registration Flow:**
1. User enters email + password + name
2. Backend validates input, checks email uniqueness
3. Generates 6-digit OTP, hashes it, stores in OTP collection with 5-minute TTL
4. Sends OTP via Nodemailer → Gmail SMTP to user's email
5. User enters OTP in the app
6. Backend verifies OTP (max 5 attempts), marks user as verified
7. Issues JWT access token (15-min expiry) + refresh token (7-day expiry)

**Login Flow:**
1. User enters email + password
2. Backend verifies credentials with bcrypt.compare()
3. Issues JWT access token + refresh token
4. Stores refresh token in httpOnly cookie (web) / secure storage (mobile)

**Security Controls:**
- **A. Input Validation**: joi/express-validator on all endpoints — email format, password strength (min 8 chars, 1 uppercase, 1 number), name sanitization
- **C. Password Hashing**: bcrypt with 12 salt rounds
- **D. Authentication**: JWT with access/refresh token rotation
- **E. RBAC**: Middleware checks `req.user.role` against route permissions
- **F. Encryption**: HTTPS in transit, passwords hashed at rest
- **G. Secure API**: Rate limiting (100 req/15min per IP on auth routes), helmet headers, CORS whitelist

**Guest Mode:**
- No registration required
- Can access: fare information, route viewer, fare calculator
- Cannot access: reporting/complaints, AI assistant, notifications, profile
- Prompted to register when accessing restricted features

### 4.2 Fare Verification & Calculator

**Core Functionality:**
- Select origin and destination from dropdown (route list)
- Choose vehicle type (traditional/modern)
- Apply discount if applicable (student/senior/PWD)
- Calculate and display fare based on LTFRB-approved rates
- Show fare breakdown: base fare + per-km charge − discount

**Fare Formula:**
```
if distance <= baseDistanceKm:
    fare = baseFare
else:
    fare = baseFare + (distance - baseDistanceKm) × perKmRate

if discount applies:
    fare = fare × (1 - discountRate)

fare = Math.ceil(fare)  // round up to nearest peso
```

**Admin-Editable Fare Rates:**
- Admin can update baseFare, perKmRate, baseDistanceKm via admin dashboard
- Changes are stored in MongoDB — no source code changes needed
- Fare history preserved (previous rates marked `isActive: false`)
- When admin updates fare, a broadcast notification is sent to all commuters

**LTFRB Fare Data (Seeded on Initial Setup):**

| Type | Base Fare (first 4 km) | Per Succeeding km | Source |
|---|---|---|---|
| Traditional Jeepney | ₱14.00 | ₱2.00 | LTFRB Order, March 13, 2026 |
| Modern Jeepney | ₱17.00 | ₱2.40 | LTFRB Order, March 13, 2026 |

**Pre-calculated Route Fares (Seeded):**

| # | Route | Category | Est. Distance | Trad. Fare | Modern Fare |
|---|---|---|---|---|---|
| 1 | Bonuan Tondaligan | City | ~4 km | ₱14 | ₱17 |
| 2 | Bonuan Binloc | City | ~5 km | ₱16 | ₱19 |
| 3 | Bonuan Boquig | City | ~5 km | ₱16 | ₱19 |
| 4 | Mangin | City | ~3 km | ₱14 | ₱17 |
| 5 | Downtown | City | ~2 km | ₱14 | ₱17 |
| 6 | CSI Lucao | City | ~3 km | ₱14 | ₱17 |
| 7 | Tambac-Bolosan Dalisay | City | ~6 km | ₱18 | ₱22 |
| 8 | Binmaley | Intercity | ~7 km | ₱20 | ₱24 |
| 9 | Calasiao | Intercity | ~6 km | ₱18 | ₱22 |
| 10 | Mangaldan | Intercity | ~7 km | ₱20 | ₱24 |
| 11 | San Fabian | Intercity | ~19 km | ₱44 | ₱52 |
| 12 | Sta. Barbara | Intercity | ~15 km | ₱36 | ₱42 |
| 13 | Lingayen | Intercity | ~13 km | ₱32 | ₱38 |
| 14 | San Carlos | Intercity | ~22 km | ₱50 | ₱58 |
| 15 | Malasiqui-Bayambang | Intercity | ~35 km | ₱76 | ₱88 |

**Discount Applied Amounts (20% off):**
Students, senior citizens, and PWDs receive 20% discount per LTFRB regulations.

**Commuter Rights Links (displayed in fare section):**
- LTO: https://lto.gov.ph
- LTFRB: https://ltfrb.gov.ph

### 4.3 Real-Time Location Tracking

**Scope:** Commuter-only GPS tracking (no driver tracking).

**Functionality:**
- Shows commuter's current GPS position on the map
- Overlays selected route path on the map
- Displays nearby stops/terminals relative to commuter's position
- Calculates estimated distance to destination
- Shows estimated remaining fare from current position
- Background location updates while app is active

**Technical Implementation:**
- `@react-native-community/geolocation` for GPS access
- react-native-maps `<Marker>` for user position
- react-native-maps `<Polyline>` for route visualization
- Location permissions handled gracefully (request → explain → fallback)

### 4.4 AI Assistant

**Purpose:** A chatbot knowledgeable about:
- Commuter rights (Philippine laws, LTFRB regulations)
- Local jeepney routes within Dagupan and neighboring municipalities
- Fare information and how to calculate fares
- How to file complaints with LTFRB
- General commuter safety tips

**System Prompt (Injected):**
The AI assistant receives a system prompt containing:
- All route data from the database
- Current fare rates
- Key commuter rights information (Republic Act 7394 - Consumer Act, RA 9208, LTFRB Memorandum Circulars)
- Links to LTO and LTFRB websites
- Instructions to stay on-topic (commuter assistance only)

**Technical Implementation:**
- Primary: Google Gemini API (`gemini-2.0-flash` model)
- Fallback: Groq API (Llama 3.1 70B) — triggered when Gemini returns rate-limit error
- Chat history stored in MongoDB per user session
- Backend proxies all AI requests (API keys never exposed to client)
- Rate limiting: 20 messages per hour per user

**Access Control:** Commuter role only (guests see a prompt to register).

### 4.5 Route & Terminal Locator

**Map Features:**
- Interactive map centered on Dagupan City (16.0433°N, 120.3342°E)
- Route lines drawn as polylines on the map
- Terminal markers with info popups (name, address, operating hours)
- Tap a route to see its full path, stops, and fare
- Search/filter routes by name or destination
- "Near Me" button to find closest terminal to current position

**Route Data:**
- Each route has start point, end point, and waypoints with GPS coordinates
- Coordinates seeded from OpenStreetMap/Google Maps references
- Admin can add/edit/delete routes and waypoints via dashboard

### 4.6 Weather Updates

**Data Source:** WeatherAPI.com (free tier — 1,000,000 calls/month)

**Features:**
- Current weather conditions for Dagupan City
- 3-day weather forecast
- Weather alerts/warnings (typhoon, heavy rain)
- Travel advisory based on weather (e.g., "Heavy rain expected — plan for delays")
- Auto-refresh every 30 minutes
- Cached on backend to minimize API calls

**API Integration:**
- Backend fetches weather data and caches in memory (node-cache, 30-min TTL)
- Single endpoint: `GET /api/weather/dagupan`
- Location hardcoded: Dagupan City, Pangasinan, Philippines

### 4.7 Complaint & Feedback System

**Access Control:** Commuter role only (guests cannot report).

**Complaint Categories:**
- Overcharging
- Reckless driving
- Harassment / unsafe behavior
- Route deviation
- Poor vehicle condition
- Other

**Submission Flow:**
1. Commuter selects category
2. Fills in subject, description
3. Optionally selects route and enters vehicle plate number
4. Optionally attaches photo evidence (max 3 images, max 5MB each)
5. Optionally includes current GPS location
6. Submits → stored in MongoDB with status "pending"

**Admin Review Flow:**
1. Admin sees complaint list in dashboard, filterable by status/category/date
2. Admin can update status: pending → under_review → resolved / dismissed
3. Admin can add internal notes
4. Status changes trigger in-app notification to the commuter

**Image Upload:**
- Images stored as base64 in MongoDB (for simplicity, suitable for thesis scale)
- Alternative: local file storage on the server's `uploads/` directory with multer

### 4.8 Admin Dashboard (Web)

**Accessible at:** `http://localhost:3001` (or deployed URL)

**Dashboard Home:**
- Total registered users (commuters)
- Total complaints (by status breakdown)
- Recent activity feed
- Quick stats cards

**Fare Management:**
- View current active fare rates
- Edit base fare, per-km rate, base distance
- Fare change history log
- When saved, auto-recalculates all route fare matrices
- Sends broadcast notification to all commuters

**Route Management:**
- CRUD for routes (add/edit/delete)
- Edit waypoints on a map interface
- Toggle route active/inactive

**User Management:**
- View all users, filter by role
- Activate/deactivate accounts
- View user complaint history

**Complaint Management:**
- List all complaints with filters (status, category, date range)
- Detail view with images and location
- Update status and add admin notes

**Notification Broadcaster:**
- Send broadcast notifications to all commuters
- Send targeted notifications to specific users
- View notification history

### 4.9 Admin Features in Mobile App

**Subset of web dashboard functionality:**
- View and respond to complaints
- Quick fare rate updates
- Send broadcast notifications
- View basic stats (user count, complaint count)

### 4.10 In-App Notifications

**Notification Types:**
- `fare_update` — When admin updates fare rates
- `weather_alert` — Severe weather warnings
- `complaint_update` — When complaint status changes
- `system` — System announcements
- `broadcast` — Admin broadcast messages

**UI:**
- Bell icon in header with unread count badge
- Notification list screen (most recent first)
- Tap to view detail, marks as read
- "Mark all as read" action
- Auto-cleanup: notifications expire after 30 days (TTL index)

---

## 5. Backend API Design

### 5.1 API Endpoints

**Auth Routes** (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Register new commuter |
| POST | `/verify-otp` | Public | Verify email OTP |
| POST | `/resend-otp` | Public | Resend verification OTP |
| POST | `/login` | Public | Login with email/password |
| POST | `/refresh-token` | Public | Refresh access token |
| POST | `/forgot-password` | Public | Send password reset OTP |
| POST | `/reset-password` | Public | Reset password with OTP |
| POST | `/logout` | Auth | Invalidate refresh token |

**User Routes** (`/api/users`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/me` | Auth | Get current user profile |
| PUT | `/me` | Auth | Update profile |
| PUT | `/me/password` | Auth | Change password |
| GET | `/` | Admin | List all users |
| PUT | `/:id/status` | Admin | Activate/deactivate user |

**Fare Routes** (`/api/fares`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Public | Get active fare rates |
| GET | `/calculate` | Public | Calculate fare (origin, destination, type, discount) |
| GET | `/matrix` | Public | Get full fare matrix |
| PUT | `/:id` | Admin | Update fare rate |
| GET | `/history` | Admin | Fare change history |

**Route Routes** (`/api/routes`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Public | List all active routes |
| GET | `/:id` | Public | Get route detail with waypoints |
| GET | `/nearby` | Public | Find nearest routes/terminals to GPS coords |
| POST | `/` | Admin | Create new route |
| PUT | `/:id` | Admin | Update route |
| DELETE | `/:id` | Admin | Delete route (soft) |

**Complaint Routes** (`/api/complaints`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/` | Commuter | Submit complaint |
| GET | `/my` | Commuter | List my complaints |
| GET | `/:id` | Commuter/Admin | Get complaint detail |
| GET | `/` | Admin | List all complaints (with filters) |
| PUT | `/:id/status` | Admin | Update complaint status |
| PUT | `/:id/notes` | Admin | Add admin notes |

**AI Assistant Routes** (`/api/assistant`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/chat` | Commuter | Send message, get AI response |
| GET | `/history` | Commuter | Get chat history |
| DELETE | `/history` | Commuter | Clear chat history |

**Weather Routes** (`/api/weather`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/current` | Public | Current weather in Dagupan |
| GET | `/forecast` | Public | 3-day forecast |

**Notification Routes** (`/api/notifications`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Auth | List user's notifications |
| GET | `/unread-count` | Auth | Get unread count |
| PUT | `/:id/read` | Auth | Mark notification as read |
| PUT | `/read-all` | Auth | Mark all as read |
| POST | `/broadcast` | Admin | Send broadcast notification |
| POST | `/send` | Admin | Send to specific user |

**Admin Dashboard Routes** (`/api/admin`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/stats` | Admin | Dashboard statistics |
| GET | `/activity` | Admin | Recent activity feed |

### 5.2 Middleware Stack

```
Request → helmet → cors → express.json (limit: 10kb)
       → rateLimiter → authMiddleware → rbacMiddleware
       → inputValidator → controller → response
```

**Middleware Details:**
1. **helmet** — Security headers (XSS protection, content type sniffing prevention, etc.)
2. **cors** — Whitelist allowed origins (mobile app, admin dashboard)
3. **express.json** — Body parser with 10KB limit
4. **rateLimiter** — express-rate-limit (100 req/15min general, 20/15min for auth routes)
5. **authMiddleware** — Verifies JWT, attaches `req.user`
6. **rbacMiddleware** — Checks `req.user.role` against route requirements
7. **inputValidator** — joi schemas validate body/params/query
8. **errorHandler** — Global error handler, returns safe error messages (no stack traces in production)

---

## 6. Security Controls (A–G)

### A. Input Validation
- All request bodies validated with **joi** schemas before reaching controllers
- Allow-lists for enums (roles, complaint categories, vehicle types)
- Email format validation via regex
- Password strength requirements enforced (min 8 chars, uppercase, number)
- MongoDB injection prevention: sanitize `$` and `.` from query parameters using `express-mongo-sanitize`
- XSS prevention: sanitize HTML in text inputs using `xss-clean`

### B. Parameterized Queries
- **Mongoose ODM** handles query parameterization automatically
- No raw MongoDB queries with string concatenation
- All user input passed through Mongoose methods: `.find({ email })`, `.findById(id)`, etc.
- Note: While the requirement mentions SQL injection, MongoDB uses Mongoose which provides equivalent protection against NoSQL injection

### C. Password Hashing
- **bcrypt** with 12 salt rounds for password hashing
- OTP codes also hashed before storage
- `bcrypt.compare()` for verification (constant-time comparison)
- No plaintext passwords stored anywhere

### D. Authentication
- **JWT** access tokens (15-minute expiry) + refresh tokens (7-day expiry)
- Access token in Authorization header: `Bearer <token>`
- Refresh token stored in:
  - Mobile: React Native `AsyncStorage` (encrypted)
  - Web: httpOnly, secure, sameSite cookie
- Token refresh endpoint for seamless re-authentication
- Email OTP verification on registration (6-digit code, 5-min TTL, max 5 attempts)

### E. Authorization / RBAC
- Three roles: `guest`, `commuter`, `admin`
- Role-based middleware applied per route group
- Least privilege: guests see only public data, commuters see their own data + public, admins see all
- Resource-level checks: commuters can only view/edit their own complaints and profile

| Resource | Guest | Commuter | Admin |
|---|---|---|---|
| Fare info | ✅ Read | ✅ Read | ✅ Read/Write |
| Routes | ✅ Read | ✅ Read | ✅ Read/Write |
| Complaints | ❌ | ✅ Own only | ✅ All |
| AI Assistant | ❌ | ✅ | ✅ |
| Notifications | ❌ | ✅ Own | ✅ All + Broadcast |
| User mgmt | ❌ | ❌ | ✅ |
| Weather | ✅ Read | ✅ Read | ✅ Read |

### F. Encryption
- **In transit**: HTTPS/TLS for all API communication (enforced in production)
- **At rest**: MongoDB Atlas encryption at rest (if using Atlas), or disk-level encryption for self-hosted
- **Secrets management**: All API keys and secrets in `.env` file, never committed to git
- JWT secret stored as environment variable, minimum 256 bits
- `.env.example` provided with placeholder values

### G. Secure API Practices
- **Request validation**: All bodies, parameters, and headers validated
- **Safe error responses**: Generic error messages in production, no stack traces or internal details
- **Auth checks**: All protected endpoints verified via middleware
- **Rate limiting**: 
  - General: 100 requests per 15 minutes per IP
  - Auth routes: 20 requests per 15 minutes per IP
  - AI chat: 20 messages per hour per user
- **Logging**: morgan for request logging, winston for application logging
- **CORS**: Strict origin whitelist
- **Helmet**: Full security header suite

---

## 7. Mobile App Navigation

### 7.1 Navigation Structure

```
App
├── Auth Stack (unauthenticated)
│   ├── Welcome Screen
│   ├── Login Screen
│   ├── Register Screen
│   ├── OTP Verification Screen
│   └── Forgot Password Screen
│
├── Guest Tab Navigator
│   ├── Home (fare info, route overview)
│   ├── Fare Calculator
│   ├── Route Map
│   └── Weather
│
└── Main Tab Navigator (authenticated)
    ├── Home Tab
    │   └── Home Dashboard
    ├── Fare Tab
    │   ├── Fare Calculator
    │   └── Fare Matrix
    ├── Map Tab
    │   ├── Route Map
    │   └── Terminal Locator
    ├── Assistant Tab
    │   └── AI Chat
    └── More Tab
        ├── Complaints (list + submit)
        ├── Notifications
        ├── Weather
        ├── Commuter Rights (LTO/LTFRB links)
        ├── Profile / Settings
        └── Admin Panel (admin role only)
            ├── Manage Fares
            ├── View Complaints
            └── Send Notifications
```

### 7.2 Design Language

- **Color Palette**: 
  - Primary: Deep blue (#1A56DB) — trust, transportation
  - Secondary: Amber (#F59E0B) — energy, jeepney culture
  - Accent: Emerald (#10B981) — success, safety
  - Background: Off-white (#F8FAFC) light / Dark navy (#0F172A) dark mode
  - Error: Red (#EF4444)
- **Typography**: Inter (Google Fonts) — clean, modern, highly readable
- **Icons**: react-native-vector-icons (MaterialCommunityIcons set)
- **Animations**: react-native-reanimated for smooth transitions
- **Dark mode**: System-preference aware, toggleable in settings

---

## 8. Admin Dashboard Design

### 8.1 Layout
- Collapsible sidebar navigation
- Top header with admin name, notifications, logout
- Main content area with breadcrumbs
- Built with React.js + Vite

### 8.2 Pages
1. **Dashboard** — Stats cards, recent complaints chart, user growth
2. **Fare Management** — Edit fare rates inline, view history, recalculate matrix
3. **Route Management** — CRUD with inline map editor
4. **User Management** — Table with search, filter, activate/deactivate
5. **Complaint Management** — Filterable list, detail modal, status updates
6. **Notifications** — Compose and send broadcast or targeted notifications
7. **Settings** — System configuration

---

## 9. External Service Integration

### 9.1 Google Gemini API
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
- Auth: API key in server-side `.env`
- System prompt injected with route/fare/rights knowledge
- Conversation context maintained per session

### 9.2 Groq API (Fallback)
- Endpoint: `https://api.groq.com/openai/v1/chat/completions`
- Model: `llama-3.1-70b-versatile`
- Auth: API key in server-side `.env`
- Same system prompt as Gemini
- Triggered only when Gemini returns 429 (rate limit) or 5xx errors

### 9.3 WeatherAPI.com
- Endpoint: `http://api.weatherapi.com/v1/forecast.json?key=KEY&q=Dagupan,Philippines&days=3`
- Auth: API key in server-side `.env`
- Cached server-side with 30-minute TTL
- Response mapped to simplified weather schema for the client

### 9.4 Gmail SMTP (Nodemailer)
- Host: `smtp.gmail.com`, Port: 587 (STARTTLS)
- Auth: Gmail address + App Password (2FA required on the Gmail account)
- Used for: OTP codes on registration and password reset
- Rate: up to 500 emails/day (Gmail limit)

### 9.5 OpenStreetMap Tiles
- Tile URL: `https://tile.openstreetmap.org/{z}/{x}/{y}.png`
- No API key required
- Free for reasonable usage (follow OSM tile usage policy)
- Attribution required: "© OpenStreetMap contributors"

---

## 10. Commuter Rights Knowledge Base

### 10.1 Key Laws & Regulations
- **Republic Act 7394** — Consumer Act of the Philippines (passenger rights)
- **LTFRB Memorandum Circulars** — Fare rates, franchise rules, passenger protection
- **Republic Act 10173** — Data Privacy Act (relevant for user data)
- **City of Dagupan Ordinances** — Local transport regulations

### 10.2 Commuter Rights Quick Reference
- Right to pay only the LTFRB-approved fare
- Right to a 20% discount for students, seniors, PWDs
- Right to refuse overcharging
- Right to file complaints with LTFRB (hotline: 1342)
- Right to a safe and roadworthy vehicle
- Right to a displayed fare matrix inside the vehicle
- Right to proper loading/unloading at designated zones

### 10.3 External Links
- LTO: https://lto.gov.ph
- LTFRB: https://ltfrb.gov.ph
- LTFRB Complaint Hotline: 1342
- DOTr: https://dotr.gov.ph

---

## 11. Seed Data

On initial setup, the system seeds the database with:

1. **Admin account** (default: admin@smartsakay.com / change-on-first-login)
2. **Fare rates** (Traditional + Modern, effective March 19, 2026)
3. **All 15 routes** with GPS coordinates, distances, and waypoints
4. **Pre-calculated fare matrix** for all route × vehicle type combinations
5. **Commuter rights knowledge base** entries

---

## 12. Development & Deployment

### 12.1 Development Setup
```bash
# Clone and install
git clone <repo-url>
cd smartsakay-dagupan

# Install all dependencies
npm install           # root (workspace)
cd server && npm install
cd ../mobile && npm install
cd ../admin && npm install

# Environment setup
cp server/.env.example server/.env
# Fill in: MONGODB_URI, JWT_SECRET, GEMINI_API_KEY, GROQ_API_KEY,
#          WEATHER_API_KEY, GMAIL_USER, GMAIL_APP_PASSWORD

# Start development
npm run dev:server    # Backend on port 5000
npm run dev:admin     # Admin dashboard on port 3001
cd mobile && npx react-native run-android  # or run-ios
```

### 12.2 Environment Variables
```
# Server
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/smartsakay
JWT_SECRET=<min-256-bit-secret>
JWT_REFRESH_SECRET=<min-256-bit-secret>

# Email (Nodemailer)
GMAIL_USER=smartsakay.dagupan@gmail.com
GMAIL_APP_PASSWORD=<gmail-app-password>

# AI Services
GEMINI_API_KEY=<google-api-key>
GROQ_API_KEY=<groq-api-key>

# Weather
WEATHER_API_KEY=<weatherapi-key>

# Admin
ADMIN_EMAIL=admin@smartsakay.com
ADMIN_DEFAULT_PASSWORD=<change-on-first-login>
```

### 12.3 npm Scripts (Root package.json)
```json
{
  "scripts": {
    "dev:server": "cd server && npm run dev",
    "dev:admin": "cd admin && npm run dev",
    "dev:mobile": "cd mobile && npx react-native start",
    "seed": "cd server && node src/seeds/index.js",
    "lint": "eslint .",
    "test": "jest"
  }
}
```

---

## 13. Verification Plan

### 13.1 Automated Tests
- Backend unit tests with Jest + supertest for all API endpoints
- Input validation edge cases
- Auth flow tests (register → OTP → login → refresh → logout)
- RBAC tests (guest vs commuter vs admin access)
- Fare calculation accuracy tests

### 13.2 Manual Verification
- Mobile app tested on Android emulator + physical device
- Admin dashboard tested in Chrome/Firefox
- End-to-end flow: register → verify email → login → calculate fare → submit complaint → admin reviews
- Guest mode restrictions verified
- AI assistant quality tested with commuter rights questions
- Weather data accuracy spot-checked
- Map rendering and route display verified
