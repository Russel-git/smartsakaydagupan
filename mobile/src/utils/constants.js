// SmartSakay Dagupan — Design System Constants
import { Platform, NativeModules } from 'react-native';

const getDevServerIp = () => {
  if (Platform.OS === 'web') return 'localhost';
  const scriptURL = NativeModules.SourceCode?.scriptURL;
  if (scriptURL) {
    const address = scriptURL.split('://')[1];
    if (address) {
      const host = address.split('/')[0];
      const ip = host.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return ip;
      }
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


export const COLORS = {
  // Primary palette: Dagupan Transit Crimson
  primary: '#DC2626',
  primaryLight: '#EF4444',
  primaryDark: '#991B1B',
  primaryMuted: '#FEE2E2',
  primaryGlow: 'rgba(220, 38, 38, 0.25)',
  
  // Secondary: Royal Slate & Midnight Navy (for high-contrast stability)
  secondary: '#0F172A',
  secondaryLight: '#1E293B',
  secondaryDark: '#020617',
  
  // Accent: Warm Amber Gold (Student, Senior Citizen & PWD Statutory Discount)
  accent: '#D97706',
  accentLight: '#F59E0B',
  accentDark: '#B45309',
  accentMuted: '#FEF3C7',
  discountGold: '#D97706',
  discountBg: '#FEF3C7',
  discountText: '#92400E',
  
  // Semantic
  error: '#DC2626',
  errorLight: '#FEE2E2',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  success: '#059669',
  successLight: '#D1FAE5',
  info: '#0284C7',
  infoLight: '#E0F2FE',

  // Neutral (High Contrast WCAG AAA compliant)
  white: '#FFFFFF',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceCard: '#FFFFFF',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  disabled: '#CBD5E1',

  // Dark mode
  dark: {
    background: '#0B0F19',
    surface: '#111827',
    surfaceElevated: '#1E293B',
    border: '#1E293B',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
  },
};

export const ACCESSIBILITY = {
  minTouchTarget: 48,
  seniorTouchTarget: 54,
  focusOutlineWidth: 2,
  largeFontScale: 1.15,
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    hero: 40,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  section: 40,
};

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
};

// Dagupan City center coordinates
export const MAP_CONFIG = {
  center: {
    latitude: 16.0433,
    longitude: 120.3342,
  },
  defaultDelta: {
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  },
};

export const COMPLAINT_CATEGORIES = [
  { value: 'overcharging', label: 'Overcharging', icon: 'cash-remove' },
  { value: 'reckless_driving', label: 'Reckless Driving', icon: 'car-emergency' },
  { value: 'harassment', label: 'Harassment', icon: 'alert-circle' },
  { value: 'route_deviation', label: 'Route Deviation', icon: 'map-marker-off' },
  { value: 'vehicle_condition', label: 'Poor Vehicle Condition', icon: 'car-wrench' },
  { value: 'other', label: 'Other', icon: 'dots-horizontal-circle' },
];

export const COMPLAINT_STATUS = {
  pending: { label: 'Pending', color: COLORS.warning, bgColor: COLORS.warningLight },
  under_review: { label: 'Under Review', color: COLORS.info, bgColor: COLORS.infoLight },
  resolved: { label: 'Resolved', color: COLORS.success, bgColor: COLORS.successLight },
  dismissed: { label: 'Dismissed', color: COLORS.error, bgColor: COLORS.errorLight },
};

export const VEHICLE_TYPES = [
  { value: 'traditional', label: 'Traditional Jeepney', icon: 'bus' },
  { value: 'modern', label: 'Modern Jeepney', icon: 'bus-articulated-front' },
  { value: 'tricycle', label: 'Dagupan Tricycle', icon: 'rickshaw' },
];

export const DISCOUNT_TYPES = [
  { value: 'none', label: 'Regular Fare', icon: 'account', tag: 'Standard Rate' },
  { value: 'student', label: 'Student', icon: 'school', tag: '20% Off (RA 11314)' },
  { value: 'senior', label: 'Senior Citizen', icon: 'account-clock', tag: '20% Off (RA 9994)' },
  { value: 'pwd', label: 'PWD Commuter', icon: 'wheelchair-accessibility', tag: '20% Off (RA 7277)' },
];
