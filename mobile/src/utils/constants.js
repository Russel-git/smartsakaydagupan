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

const CLOUDFLARE_BACKEND_URL = 'https://avoid-cdt-vsnet-latina.trycloudflare.com/api';

export const API_BASE_URL = CLOUDFLARE_BACKEND_URL || Platform.select({
  web: 'http://localhost:5000/api',
  default: `http://${DEV_IP}:5000/api`,
});


export const COLORS = {
  // Primary palette — GoBus-inspired Orange
  primary: '#f97316',
  primaryLight: '#ffedd5',
  primaryDark: '#c2550f',

  // Secondary
  secondary: '#22c55e',
  secondaryLight: '#dcfce7',
  secondaryDark: '#15803d',

  // Accent
  accent: '#3b82f6',
  accentLight: '#dbeafe',
  accentDark: '#1d4ed8',

  // Semantic
  error: '#ef4444',
  errorLight: '#fee2e2',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  success: '#22c55e',
  successLight: '#dcfce7',
  info: '#3b82f6',
  infoLight: '#dbeafe',

  // Neutral — clean light theme
  white: '#FFFFFF',
  background: '#f5f6fa',
  surface: '#FFFFFF',
  border: '#e5e7eb',
  textPrimary: '#111827',
  textSecondary: '#374151',
  textMuted: '#6b7280',
  disabled: '#d1d5db',

  // Dark mode
  dark: {
    background: '#0F172A',
    surface: '#1E293B',
    surfaceElevated: '#334155',
    border: '#334155',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
  },
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
  { value: 'none', label: 'Regular Fare', icon: 'account' },
  { value: 'discounted', label: 'Student / Senior / PWD (20% Off)', icon: 'percent-outline' },
];
