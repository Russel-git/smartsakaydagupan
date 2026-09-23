// SmartSakay Dagupan — Design System v3.0
// Palette: Ember Crimson × Obsidian × Warm Gold
import { Platform, NativeModules } from 'react-native';

const getDevServerIp = () => {
  if (Platform.OS === 'web') return 'localhost';
  const scriptURL = NativeModules.SourceCode?.scriptURL;
  if (scriptURL) {
    const address = scriptURL.split('://')[1];
    if (address) {
      const host = address.split('/')[0];
      const ip = host.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') return ip;
    }
  }
  return '192.168.1.14';
};

const DEV_IP = getDevServerIp();

const CLOUDFLARE_BACKEND_URL = 'https://argument-options-correlation-dream.trycloudflare.com/api';

export const API_BASE_URL = CLOUDFLARE_BACKEND_URL || Platform.select({
  web: 'http://localhost:5000/api',
  default: `http://${DEV_IP}:5000/api`,
});

// ──────────────────────────────────────────────────────────────
//  COLOR TOKENS
// ──────────────────────────────────────────────────────────────
export const COLORS = {
  // ── Primary: Ember Crimson ──
  primary:       '#E11D48',   // Rose-600  (vibrant, accessible)
  primaryHover:  '#BE123C',   // Rose-700
  primaryLight:  '#FB7185',   // Rose-400  (on dark surfaces)
  primaryDark:   '#9F1239',   // Rose-800
  primaryMuted:  '#FFE4E6',   // Rose-100
  primarySubtle: 'rgba(225, 29, 72, 0.12)',
  primaryGlow:   'rgba(225, 29, 72, 0.35)',
  primaryBorder: 'rgba(225, 29, 72, 0.30)',

  // ── Secondary: Obsidian Charcoal ──
  secondary:      '#0D0F18',
  secondaryLight: '#181C2A',
  secondaryMid:   '#1F2436',
  secondaryCard:  '#12151F',

  // ── Accent: Warm Amber Gold ── (Senior, PWD, Student badges)
  accent:       '#F59E0B',   // Amber-500
  accentLight:  '#FCD34D',   // Amber-300
  accentDark:   '#B45309',   // Amber-700
  accentMuted:  '#FEF3C7',   // Amber-100
  accentSubtle: 'rgba(245, 158, 11, 0.14)',
  accentBorder: 'rgba(245, 158, 11, 0.30)',

  // ── Statutory Discount Highlight ──
  discountBg:   '#FEF3C7',
  discountText: '#92400E',
  discountBadge:'#D97706',
  discountGold: '#F59E0B',

  // ── Semantic ──
  success:        '#10B981',
  successLight:   '#34D399',
  successSubtle:  'rgba(16, 185, 129, 0.12)',
  successBorder:  'rgba(16, 185, 129, 0.30)',
  successBg:      '#D1FAE5',

  error:          '#E11D48',
  errorLight:     '#FB7185',
  errorBg:        '#FFE4E6',

  warning:        '#F59E0B',
  warningLight:   '#FCD34D',
  warningBg:      '#FEF3C7',

  info:           '#38BDF8',
  infoLight:      '#7DD3FC',
  infoBg:         '#E0F2FE',

  // ── Neutral (Light theme — commuter app) ──
  white:          '#FFFFFF',
  background:     '#F9FAFB',
  surface:        '#FFFFFF',
  surfaceElevated:'#F3F4F6',
  card:           '#FFFFFF',
  border:         '#E5E7EB',
  borderStrong:   '#D1D5DB',
  textPrimary:    '#111827',
  textSecondary:  '#374151',
  textMuted:      '#6B7280',
  textFaint:      '#9CA3AF',
  disabled:       '#E5E7EB',

  // ── Dark Mode (for admin or dark-preferring) ──
  dark: {
    background:      '#0D0F18',
    surface:         '#12151F',
    surfaceElevated: '#181C2A',
    border:          'rgba(255,255,255,0.08)',
    borderSoft:      'rgba(255,255,255,0.05)',
    textPrimary:     '#F9FAFB',
    textSecondary:   '#D1D5DB',
    textMuted:       '#6B7280',
  },
};

// ──────────────────────────────────────────────────────────────
//  TYPOGRAPHY
// ──────────────────────────────────────────────────────────────
export const FONTS = {
  regular:  'System',
  medium:   'System',
  bold:     'System',
  weights: {
    light:     '300',
    regular:   '400',
    medium:    '500',
    semibold:  '600',
    bold:      '700',
    extrabold: '800',
    black:     '900',
  },
  sizes: {
    xs:   11,
    sm:   13,
    md:   15,
    lg:   17,
    xl:   20,
    xxl:  25,
    xxxl: 30,
    hero: 38,
  },
  lineHeights: {
    tight:  1.2,
    snug:   1.35,
    normal: 1.5,
    relaxed: 1.7,
  },
};

// ──────────────────────────────────────────────────────────────
//  SPACING
// ──────────────────────────────────────────────────────────────
export const SPACING = {
  xs:      4,
  sm:      8,
  md:      12,
  lg:      16,
  xl:      20,
  xxl:     24,
  xxxl:    32,
  section: 40,
  page:    48,
};

// ──────────────────────────────────────────────────────────────
//  BORDER RADII
// ──────────────────────────────────────────────────────────────
export const RADIUS = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   22,
  xxl:  28,
  full: 999,
};

// ──────────────────────────────────────────────────────────────
//  SHADOWS  (mobile — elevation-based)
// ──────────────────────────────────────────────────────────────
export const SHADOWS = {
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 5,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 8,
  },
  primary: {
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 6,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
};

// ──────────────────────────────────────────────────────────────
//  ACCESSIBILITY
// ──────────────────────────────────────────────────────────────
export const ACCESSIBILITY = {
  minTouchTarget:    48,   // WCAG 2.5.5 — minimum 44px, we exceed at 48
  seniorTouchTarget: 56,   // Larger for elderly / motor-impaired
  focusOutlineWidth: 2.5,
  focusOutlineColor: '#E11D48',
  largeFontScale:    1.18, // Senior-friendly text scaling
};

// ──────────────────────────────────────────────────────────────
//  MAP CONFIG
// ──────────────────────────────────────────────────────────────
export const MAP_CONFIG = {
  center: {
    latitude:  16.0433,
    longitude: 120.3342,
  },
  defaultDelta: {
    latitudeDelta:  0.08,
    longitudeDelta: 0.08,
  },
};

// ──────────────────────────────────────────────────────────────
//  DOMAIN CONSTANTS
// ──────────────────────────────────────────────────────────────
export const COMPLAINT_CATEGORIES = [
  { value: 'overcharging',     label: 'Overcharging',          icon: 'cash-remove' },
  { value: 'reckless_driving', label: 'Reckless Driving',      icon: 'car-emergency' },
  { value: 'harassment',       label: 'Harassment',            icon: 'alert-circle' },
  { value: 'route_deviation',  label: 'Route Deviation',       icon: 'map-marker-off' },
  { value: 'vehicle_condition',label: 'Poor Vehicle Condition', icon: 'car-wrench' },
  { value: 'other',            label: 'Other',                  icon: 'dots-horizontal-circle' },
];

export const COMPLAINT_STATUS = {
  pending:      { label: 'Pending',      color: COLORS.warning,  bgColor: COLORS.warningBg },
  under_review: { label: 'Under Review', color: COLORS.info,     bgColor: COLORS.infoBg },
  resolved:     { label: 'Resolved',     color: COLORS.success,  bgColor: COLORS.successBg },
  dismissed:    { label: 'Dismissed',    color: COLORS.error,    bgColor: COLORS.errorBg },
};

export const VEHICLE_TYPES = [
  { value: 'traditional', label: 'Traditional Jeepney', icon: 'bus' },
  { value: 'modern',      label: 'Modern Jeepney',      icon: 'bus-articulated-front' },
  { value: 'tricycle',    label: 'Dagupan Tricycle',    icon: 'rickshaw' },
];

export const DISCOUNT_TYPES = [
  { value: 'none',    label: 'Regular Fare',     icon: 'account',                   tag: 'Standard Rate' },
  { value: 'student', label: 'Student',           icon: 'school',                    tag: '20% Off (RA 11314)' },
  { value: 'senior',  label: 'Senior Citizen',    icon: 'account-clock',             tag: '20% Off (RA 9994)' },
  { value: 'pwd',     label: 'PWD Commuter',      icon: 'wheelchair-accessibility',  tag: '20% Off (RA 7277)' },
];
