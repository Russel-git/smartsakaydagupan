# SmartSakay Dagupan — Comprehensive UI/UX Redesign Strategy & Implementation Plan

## Executive Summary & Design Vision
**SmartSakay Dagupan** is modernizing its commuter and administrative experience across handheld mobile devices (React Native / Expo / PWA) and widescreen desktop browsers (React / Vite Admin & Web Portal). 

This redesign delivers:
1. **Responsive Viewport Parity**: Eliminates stretched full-width white space on desktop via centered `max-w-6xl` containers, multi-column responsive grids, and an adaptive desktop navigation shell.
2. **Mobile Ergonomics**: Reclaims up to 45% of vertical fold space on mobile through compact hero cards, introduces elevated pill bottom navigation with micro-interactions, and enables smooth horizontal gesture carousels with soft gradient edge-fades.
3. **Multi-Preset Cross-Platform Theme Engine**: Introduces a unified 4-preset color theme system (**Classic Dagupan Blue**, **Eco Emerald Green**, **Sunset Amber Gold**, and **Modern Dark Mode**) driven by CSS Custom Properties on web and typed theme contexts in React Native, with persistence across sessions via `localStorage` and `AsyncStorage`.
4. **Route Map Precision**: Ensures seamless single-route isolation so commuters only see their selected jeepney corridor without map clutter.

---

## Deliverable 1: Responsive Component Architecture

### Viewport Breakpoint Matrix
| Breakpoint | Target Devices | Layout Mode | Navigation Shell | Max Container |
| :--- | :--- | :--- | :--- | :--- |
| **Mobile (`<640px`)** | iPhone, Android phones | 1-Column Stack, compact headers | Elevated Floating Bottom Pill Bar | `100%` (padding `16px`) |
| **Tablet (`640px - 1023px`)** | iPad, Android tablets, Foldables | 2-Column Responsive Grid | Slim Sidebar or Top App Bar | `768px` |
| **Desktop (`1024px - 1440px`)**| Laptops, standard monitors | 3 to 4-Column Grids, Split Panes | Sticky Side Navigation Drawer | `max-w-6xl` (`1152px`) |
| **Widescreen (`>1440px`)** | Ultra-wide displays | Multi-column + contextual sidebars | Expanded Sticky Navigation Drawer | `max-w-7xl` (`1280px`) |

---

### Global Shell Layout Transformations

```
MOBILE (<640px)
+------------------------------------+
| Compact Header (Weather + Alerts)  |
+------------------------------------+
|                                    |
| [Single-column scrollable stream]  |
|                                    |
+------------------------------------+
|  [Floating Pill Bottom Nav Bar]    |
+------------------------------------+

DESKTOP (>=1024px)
+---------+-------------------------------------------------------+
|  LOGO   |  Top Header (Search, Quick Theme Picker, User Pill)   |
|         +-------------------------------------------------------+
|  [Nav]  |  Centered Container (max-w-6xl mx-auto)               |
|  Home   |  +-------------------------+------------------------+ |
|  Fares  |  | Left Pane (Cards/Form)  | Right Pane (Preview)   | |
|  Routes |  |                         |                        | |
|  AI     |  +-------------------------+------------------------+ |
|  Admin  |                                                       |
+---------+-------------------------------------------------------+
```

---

### Screen-by-Screen Layout Specifications

#### 1. Home Screen
- **Mobile (`<640px`)**:
  - **Header Fold Optimization**: Replace the heavy 140px solid blue header with a compact 72px glass card containing greeting, commuter name, ambient temperature badge (`28°C Partly Cloudy`), and unread notification bell. Reclaims ~45% of vertical space above the fold.
  - **Quick Actions**: 4 circular/squircle action chips in a 2x2 grid or horizontal quick-strip with 12px padding.
  - **Live Fare Summary**: Single-column vertical card list showing Traditional vs. Modern PUV base fares.
- **Desktop (`>=1024px`)**:
  - **Container**: `max-w-6xl mx-auto px-6 py-8`.
  - **Hero Section**: 2-column split banner. Left: Dynamic Dagupan commute status, weather warning, and quick search. Right: Key commuter statistics (active routes, lowest fare, air-conditioned fleet count).
  - **Quick Actions & Fares**: 4-column cards grid (`grid-cols-4 gap-6`) with subtle gradient borders and `-2px` hover lift.

#### 2. Fare Calculator Screen
- **Mobile (`<640px`)**:
  - **Route Carousel**: Horizontal scroll with CSS gradient edge mask (`mask-image: linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)`).
  - **Vehicle & Discount Selectors**: Segmented pill controls (`Traditional` vs `Modern PUV`) and chip radio tags (`Regular`, `Student/Senior/PWD 20% OFF`).
  - **Result Card**: Bottom sticky summary card showing large computed fare badge, base fare distance breakdown, and official LTFRB discount receipt.
- **Desktop (`>=1024px`)**:
  - **Split View Layout**: 2-column layout (`grid-cols-12 gap-8`).
    - **Left Column (7 cols)**: Origin route selector, vehicle options, passenger classification, and interactive distance slider.
    - **Right Column (5 cols)**: Sticky elevated Fare Receipt Card featuring animated price counter, breakdown table (Base Rate + Per Km Increments - 20% Statutory Discount), and official fare matrix reference.

#### 3. Route Map Screen
- **Mobile (`<640px`)**:
  - **Map Canvas**: 46vh interactive Leaflet map canvas.
  - **Route Isolation Indicator**: Top floating pill (`Solo Route: [Name] • Show All`) appearing only when a route is active.
  - **Bottom Route Sheet**: Swipeable bottom sheet displaying the 3 verified GPX routes with distance, corridor name, and depot address.
- **Desktop (`>=1024px`)**:
  - **Side-by-Side Split Workspace**:
    - **Left Sidebar (35% width, `400px`)**: Searchable route directory, category tabs (City Loop vs Intercity), GPX coordinates counter, and depot location cards.
    - **Right Canvas (65% width)**: Full-viewport interactive Leaflet map with zoom controls, transit line toggles, depot pins, and live commuter GPS beacon.

#### 4. AI Assistant Screen
- **Mobile (`<640px`)**:
  - Full-height keyboard-avoiding container (`KeyboardAvoidingView`).
  - Suggested prompt chips horizontally scrolling above the text input.
  - Compact message bubbles: User messages aligned right (Theme primary gradient), AI responses aligned left (Glass card with Dagupan transit avatar).
- **Desktop (`>=1024px`)**:
  - **2-Column Layout**:
    - **Left Rail (320px)**: Commute prompt library (e.g. "How much is Lucao to Downtown?", "Where is the Solid North Terminal?", "Jeepney hours tonight?"), recent conversations, and rights guide.
    - **Right Workspace (Flex-1)**: Elevated chat window with markdown-rendered fare tables, clickable route chips that auto-open the map, and sticky glass input dock.

#### 5. Profile & Appearance Screen
- **Mobile (`<640px`)**:
  - User avatar and account details in a compact card.
  - Theme Selector: 4 horizontal swatch cards with live color previews and checkmarks.
- **Desktop (`>=1024px`)**:
  - 3-column dashboard grid:
    - **Column 1**: Profile information, password security, and verified badge.
    - **Column 2**: Theme Customization Studio (interactive preview of Classic Blue, Eco Emerald, Sunset Amber, and Dark Mode).
    - **Column 3**: Commuter Rights, Complaint Filing history, and LTFRB Hotlines.

---

## Deliverable 2: Theme Variable Setup (Production-Ready CSS Variables)

```css
/* ==========================================================================
   SmartSakay Dagupan — Design System Theme Root Stylesheet
   Supports: Light/Dark default, data-theme="blue" | "emerald" | "amber" | "dark"
   ========================================================================== */

:root,
[data-theme="blue"] {
  /* Preset 1: Classic Dagupan Blue (Default) */
  --primary: #1E50D8;
  --primary-hover: #1640B0;
  --primary-light: #60A5FA;
  --primary-glow: rgba(30, 80, 216, 0.28);
  --primary-surface: rgba(30, 80, 216, 0.08);

  --accent: #06B6D4;
  --accent-light: #67E8F9;
  --accent-glow: rgba(6, 182, 212, 0.25);

  --bg-app: #F8FAFC;
  --bg-surface: #FFFFFF;
  --bg-surface-elevated: #F1F5F9;
  --bg-glass: rgba(255, 255, 255, 0.85);

  --text-main: #0F172A;
  --text-secondary: #475569;
  --text-muted: #94A3B8;

  --border-subtle: #E2E8F0;
  --border-focus: #1E50D8;

  --badge-bg: #DBEAFE;
  --badge-text: #1E40AF;

  --shadow-sm: 0 1px 3px rgba(15, 23, 42, 0.08);
  --shadow-md: 0 4px 12px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04);
  --shadow-lg: 0 12px 28px rgba(30, 80, 216, 0.12), 0 4px 8px rgba(15, 23, 42, 0.06);
}

[data-theme="emerald"] {
  /* Preset 2: Eco Emerald Green */
  --primary: #0F766E;
  --primary-hover: #115E59;
  --primary-light: #2DD4BF;
  --primary-glow: rgba(15, 118, 110, 0.28);
  --primary-surface: rgba(15, 118, 110, 0.08);

  --accent: #10B981;
  --accent-light: #34D399;
  --accent-glow: rgba(16, 185, 129, 0.25);

  --bg-app: #F7FAF8;
  --bg-surface: #FFFFFF;
  --bg-surface-elevated: #EEF5F2;
  --bg-glass: rgba(255, 255, 255, 0.88);

  --text-main: #064E3B;
  --text-secondary: #335B50;
  --text-muted: #7D9B91;

  --border-subtle: #D8E8E2;
  --border-focus: #0F766E;

  --badge-bg: #D1FAE5;
  --badge-text: #065F46;

  --shadow-sm: 0 1px 3px rgba(6, 78, 59, 0.08);
  --shadow-md: 0 4px 12px rgba(6, 78, 59, 0.08);
  --shadow-lg: 0 12px 28px rgba(15, 118, 110, 0.12);
}

[data-theme="amber"] {
  /* Preset 3: Sunset Amber Gold */
  --primary: #D97706;
  --primary-hover: #B45309;
  --primary-light: #FBBF24;
  --primary-glow: rgba(217, 119, 6, 0.28);
  --primary-surface: rgba(217, 119, 6, 0.08);

  --accent: #EA580C;
  --accent-light: #FB923C;
  --accent-glow: rgba(234, 88, 12, 0.25);

  --bg-app: #FFFDF9;
  --bg-surface: #FFFFFF;
  --bg-surface-elevated: #FAF3E8;
  --bg-glass: rgba(255, 255, 255, 0.88);

  --text-main: #451A03;
  --text-secondary: #78350F;
  --text-muted: #A88771;

  --border-subtle: #F3E5D0;
  --border-focus: #D97706;

  --badge-bg: #FEF3C7;
  --badge-text: #92400E;

  --shadow-sm: 0 1px 3px rgba(69, 26, 3, 0.08);
  --shadow-md: 0 4px 12px rgba(69, 26, 3, 0.08);
  --shadow-lg: 0 12px 28px rgba(217, 119, 6, 0.14);
}

[data-theme="dark"] {
  /* Preset 4: Modern Dark Mode */
  --primary: #3B82F6;
  --primary-hover: #2563EB;
  --primary-light: #93C5FD;
  --primary-glow: rgba(59, 130, 246, 0.35);
  --primary-surface: rgba(59, 130, 246, 0.12);

  --accent: #10B981;
  --accent-light: #34D399;
  --accent-glow: rgba(16, 185, 129, 0.28);

  --bg-app: #0F172A;
  --bg-surface: #1E293B;
  --bg-surface-elevated: #334155;
  --bg-glass: rgba(30, 41, 59, 0.85);

  --text-main: #F8FAFC;
  --text-secondary: #CBD5E1;
  --text-muted: #94A3B8;

  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-focus: #3B82F6;

  --badge-bg: rgba(59, 130, 246, 0.18);
  --badge-text: #93C5FD;

  --shadow-sm: 0 2px 6px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 6px 18px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 14px 36px rgba(0, 0, 0, 0.65);
}
```

### Theme Persistence Architecture
1. **Web (`localStorage`)**:
   ```javascript
   export const applyTheme = (themeName) => {
     document.documentElement.setAttribute('data-theme', themeName);
     localStorage.setItem('smartsakay_theme', themeName);
   };
   ```
2. **Mobile (React Native / `AsyncStorage`)**:
   - `ThemeContext.js` loads the active preset key on boot:
   ```javascript
   const storedTheme = await AsyncStorage.getItem('smartsakay_theme_preset');
   ```
   - Color tokens dynamically adapt all header gradients, route chip active states, and bottom navigation highlights.

---

## Deliverable 3: Interactive Component Design Rules

### 1. Floating Bottom Navigation Bar (Mobile)
- **Container**: Floating pill detached from screen bottom (`bottom: 16px, marginHorizontal: 20px, borderRadius: 28px`).
- **Surface**: Translucent frosted glass (`backdrop-filter: blur(16px)`, background: `var(--bg-glass)`).
- **Active State Indicator**: Pill indicator with soft theme glow:
  ```css
  .nav-item-active {
    background: var(--primary-surface);
    color: var(--primary);
    box-shadow: 0 2px 8px var(--primary-glow);
    transform: translateY(-2px);
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  ```

### 2. Horizontally Scrollable Route Tags with Soft Edge-Fades
- **CSS Edge Masking**:
  ```css
  .route-scroll-container {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    mask-image: linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent);
    padding: 8px 16px;
    gap: 10px;
  }
  ```
- **Tag State**:
  - Default: Border `1px solid var(--border-subtle)`, background `var(--bg-surface)`.
  - Selected: Background `var(--primary)`, text `#FFFFFF`, shadow `0 4px 12px var(--primary-glow)`.

### 3. Elevated Cards & Multi-Column Grid (Desktop & Mobile)
- **Responsive Grid**:
  ```html
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-6xl mx-auto px-4">
    <!-- Component Cards -->
  </div>
  ```
- **Card Interactive Styling**:
  ```css
  .card-premium {
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: 16px;
    padding: 20px;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  }
  .card-premium:hover {
    transform: translateY(-2px);
    border-color: var(--primary-light);
    box-shadow: var(--shadow-lg);
  }
  ```

### 4. AI Assistant Message Interface
- **User Bubble**: Gradient background (`linear-gradient(135deg, var(--primary), var(--primary-hover))`), text `#FFFFFF`, rounded `18px 18px 4px 18px`.
- **Assistant Bubble**: Surface glass (`var(--bg-surface)`), border `1px solid var(--border-subtle)`, text `var(--text-main)`, rounded `18px 18px 18px 4px`.
- **Action Chips**: Quick tap tags (`var(--primary-surface)`, border `1px solid var(--primary-light)`) for instant route calculation.
