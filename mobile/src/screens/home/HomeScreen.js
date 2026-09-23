import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Card, Badge } from '../../components/common/SharedComponents';
import AuthPromptModal from '../../components/common/AuthPromptModal';
import { faresAPI, weatherAPI } from '../../api/services';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/constants';
import { formatPeso, getWeatherIcon } from '../../utils/helpers';

// ── Quick Action Config ────────────────────────────────────
const QUICK_ACTIONS = [
  {
    icon: 'steering', label: 'Start Ride', screen: 'Ride',
    gradient: ['#E11D48', '#9F1239'],
    auth: true,
    promptTitle: 'Sign In to Start Ride Tracking',
    promptMsg: 'Real-time GPS ride tracking and live LTFRB fare calculation require a verified account.',
    promptIcon: 'steering', promptTag: 'Live Ride Tracker',
  },
  {
    icon: 'map-marker-radius', label: 'Routes & Fares', screen: 'RoutesAndFares',
    gradient: ['#0EA5E9', '#0369A1'],
  },
  {
    icon: 'robot', label: 'AI Assistant', screen: 'Assistant',
    gradient: ['#7C3AED', '#5B21B6'],
    auth: true,
    promptTitle: 'Sign In to Use AI Assistant',
    promptMsg: 'Get personalized 24/7 route guidance. Please sign in or create an account.',
    promptIcon: 'robot', promptTag: 'Smart Assistant',
  },
  {
    icon: 'clipboard-alert', label: 'File Report', screen: 'SubmitComplaint',
    gradient: ['#F59E0B', '#B45309'],
    auth: true,
    promptTitle: 'Sign In to File a Report',
    promptMsg: 'Verified commuter accounts are required by transport regulators to process official grievances.',
    promptIcon: 'clipboard-alert', promptTag: 'Grievance Filing',
  },
];

// ── Persona Cards ───────────────────────────────────────────
const PERSONAS = [
  {
    icon: 'school',                 label: 'Student',       law: 'RA 11314',
    color: '#0EA5E9', bg: '#E0F2FE',
  },
  {
    icon: 'account-clock',          label: 'Senior Citizen',law: 'RA 9994',
    color: '#10B981', bg: '#D1FAE5',
  },
  {
    icon: 'wheelchair-accessibility',label: 'PWD',           law: 'RA 7277',
    color: '#8B5CF6', bg: '#EDE9FE',
  },
];

const HomeScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { user, isGuest } = useAuth();
  const { unreadCount } = useNotifications();
  const [fares, setFares] = useState([]);
  const [weather, setWeather] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [promptModal, setPromptModal] = useState({
    visible: false, title: '', message: '', icon: 'account-lock', tag: '',
  });

  // Entrance animation
  const headerAnim = useRef(new Animated.Value(-20)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 500, delay: 150, useNativeDriver: true }),
    ]).start();
  }, []);

  const openPrompt = (title, message, icon, tag) =>
    setPromptModal({ visible: true, title, message, icon, tag });
  const closePrompt = () =>
    setPromptModal((p) => ({ ...p, visible: false }));

  const loadData = useCallback(async () => {
    try {
      const [faresRes, weatherRes] = await Promise.allSettled([
        faresAPI.getActiveFares(),
        weatherAPI.getCurrentWeather(),
      ]);
      if (faresRes.status === 'fulfilled') setFares(faresRes.value.data.data || []);
      if (weatherRes.status === 'fulfilled') setWeather(weatherRes.value.data.data || null);
    } catch (_) { /* silent */ }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleAction = (action) => {
    if (action.auth && isGuest) {
      openPrompt(action.promptTitle, action.promptMsg, action.promptIcon, action.promptTag);
      return;
    }
    navigation.navigate(action.screen);
  };

  return (
    <>
      <AuthPromptModal
        visible={promptModal.visible}
        onClose={closePrompt}
        title={promptModal.title}
        message={promptModal.message}
        icon={promptModal.icon}
        featureTag={promptModal.tag}
      />

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* ── HEADER ──────────────────────────────── */}
        <Animated.View style={{ transform: [{ translateY: headerAnim }] }}>
          <LinearGradient
            colors={['#7F1D2E', '#BE123C', '#E11D48']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            {/* decorative blob */}
            <View style={styles.headerBlob} />
            <View style={styles.headerBlob2} />

            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.greeting}>
                  {greeting()}{user ? `, ${user.firstName}` : ''}! 👋
                </Text>
                <Text style={styles.headerSub}>
                  {isGuest ? 'Guest Session • Dagupan City' : 'SmartSakay Dagupan'}
                </Text>
              </View>

              {isGuest ? (
                <TouchableOpacity
                  style={styles.notifBtn}
                  onPress={() => openPrompt(
                    'Transit Notifications',
                    'Sign up to receive personalized route detours, fare revisions, and weather advisories.',
                    'bell-ring-outline',
                    'Alerts'
                  )}
                >
                  <MaterialCommunityIcons name="bell-badge-outline" size={24} color="#FCD34D" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.notifBtn}
                  onPress={() => navigation.navigate('Notifications')}
                >
                  <MaterialCommunityIcons name="bell-outline" size={24} color="#FFFFFF" />
                  <Badge count={unreadCount} />
                </TouchableOpacity>
              )}
            </View>

            {/* Weather strip */}
            {weather && (() => {
              const condStr = weather.current?.condition?.text
                || (typeof weather.current?.condition === 'string' ? weather.current?.condition : null)
                || weather.conditionText || 'Dagupan City';
              const isWarn = condStr.toLowerCase().includes('rain') || condStr.toLowerCase().includes('thunder');
              return (
                <TouchableOpacity
                  style={[styles.weatherStrip, isWarn && styles.weatherStripWarn]}
                  onPress={() => navigation.navigate('Weather')}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name={getWeatherIcon(condStr)}
                    size={20}
                    color={isWarn ? '#FCA5A5' : '#FCD34D'}
                  />
                  <Text style={styles.weatherTemp}>
                    {weather.current?.temp_c ?? weather.current?.tempC ?? weather.temp_c ?? '--'}°C
                  </Text>
                  <Text style={styles.weatherDesc} numberOfLines={1}>
                    {condStr} • Dagupan
                  </Text>
                  <MaterialCommunityIcons
                    name="chevron-right" size={16} color="rgba(255,255,255,0.5)"
                    style={{ marginLeft: 'auto' }}
                  />
                </TouchableOpacity>
              );
            })()}
          </LinearGradient>
        </Animated.View>

        {/* ── GUEST BANNER ─────────────────────────── */}
        {isGuest && (
          <View style={[styles.guestBanner, { backgroundColor: COLORS.primarySubtle, borderColor: COLORS.primaryBorder }]}>
            <MaterialCommunityIcons name="shield-account-outline" size={18} color={COLORS.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.guestTitle, { color: colors.textPrimary }]}>Browsing in Guest Mode</Text>
              <Text style={[styles.guestDesc, { color: colors.textMuted }]}>
                Sign up to file complaints & use the AI assistant
              </Text>
            </View>
            <TouchableOpacity
              style={styles.guestCta}
              onPress={() => openPrompt(
                'Join SmartSakay',
                'Register your free account to access AI transit assistance and file commuter complaints.',
                'account-plus',
                'Free Account'
              )}
            >
              <Text style={styles.guestCtaText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        )}

        <Animated.View style={[styles.body, { opacity: contentAnim }]}>

          {/* ── QUICK ACTIONS ─────────────────────── */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map((a, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.actionCard, SHADOWS.md]}
                onPress={() => handleAction(a)}
                activeOpacity={0.82}
              >
                <LinearGradient
                  colors={a.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionGradient}
                >
                  <View style={styles.actionIconBg}>
                    <MaterialCommunityIcons name={a.icon} size={28} color="#FFFFFF" />
                  </View>
                  <Text style={styles.actionLabel}>{a.label}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── FARE RATES ───────────────────────── */}
          {fares.length > 0 && (
            <>
              <View style={styles.sectionRow}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Current Fare Rates</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('RoutesAndFares', { initialTab: 'fares' })}
                >
                  <Text style={[styles.sectionLink, { color: COLORS.primary }]}>View Matrix →</Text>
                </TouchableOpacity>
              </View>

              {fares.map((fare) => {
                const isTraditional = fare.vehicleType === 'traditional';
                return (
                  <View
                    key={fare._id}
                    style={[
                      styles.fareCard,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      SHADOWS.sm,
                    ]}
                  >
                    <View style={[
                      styles.fareAccent,
                      { backgroundColor: isTraditional ? COLORS.accent : '#3B82F6' },
                    ]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.fareType, { color: colors.textPrimary }]}>
                        {isTraditional ? '🚐 Traditional' : '🚌 Modern'} Jeepney
                      </Text>
                      <Text style={[styles.fareDetail, { color: colors.textMuted }]}>
                        Base {formatPeso(fare.baseFare)} • first {fare.baseDistanceKm} km
                      </Text>
                    </View>
                    <View style={styles.fareRight}>
                      <Text style={[styles.fareRate, { color: COLORS.primary }]}>
                        {formatPeso(fare.perKmRate)}
                      </Text>
                      <Text style={[styles.fareRateLabel, { color: colors.textMuted }]}>/ km</Text>
                    </View>
                  </View>
                );
              })}
            </>
          )}

          {/* ── STATUTORY DISCOUNT ───────────────── */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Statutory Discounts</Text>

          <LinearGradient
            colors={['#FFFBEB', '#FEF3C7']}
            style={[styles.discountHero, { borderColor: COLORS.accentBorder }]}
          >
            <View style={styles.discountHeader}>
              <View style={styles.discountIconBig}>
                <MaterialCommunityIcons name="percent" size={26} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.discountTitleRow}>
                  <Text style={styles.discountTitle}>20% Fare Discount</Text>
                  <View style={styles.legalBadge}>
                    <Text style={styles.legalBadgeText}>LEGAL RIGHT</Text>
                  </View>
                </View>
                <Text style={styles.discountDesc}>
                  Philippine law mandates a 20% discount on all public transport for these commuters.
                </Text>
              </View>
            </View>

            <View style={styles.personaRow}>
              {PERSONAS.map((p, i) => (
                <View key={i} style={[styles.personaCard, { backgroundColor: p.bg }]}>
                  <MaterialCommunityIcons name={p.icon} size={22} color={p.color} />
                  <Text style={[styles.personaLabel, { color: p.color }]}>{p.label}</Text>
                  <Text style={styles.personaLaw}>{p.law}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.calcBtn}
              onPress={() => navigation.navigate('RoutesAndFares', { initialTab: 'fares' })}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="calculator-variant" size={16} color="#FFFFFF" />
              <Text style={styles.calcBtnText}>Calculate Discounted Fare</Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* ── COMMUTER RIGHTS ──────────────────── */}
          <TouchableOpacity
            style={[styles.rightsCard, { backgroundColor: colors.card, borderColor: colors.border }, SHADOWS.sm]}
            onPress={() => navigation.navigate('CommuterRights')}
            activeOpacity={0.82}
          >
            <View style={styles.rightsIconWrap}>
              <MaterialCommunityIcons name="scale-balance" size={24} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rightsTitle, { color: colors.textPrimary }]}>Know Your Rights</Text>
              <Text style={[styles.rightsDesc, { color: colors.textMuted }]}>
                LTFRB commuter rights & hotline: 1342
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={{ height: 48 }} />
        </Animated.View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── Header
  header: {
    paddingTop: 52,
    paddingBottom: SPACING.xxl,
    paddingHorizontal: SPACING.xxl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  headerBlob: {
    position: 'absolute', top: -60, right: -40,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerBlob2: {
    position: 'absolute', bottom: -40, left: -20,
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  greeting: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.72)', marginTop: 2 },
  notifBtn: { padding: 8 },

  weatherStrip: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    marginTop: SPACING.lg,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: SPACING.md, paddingVertical: 9,
    borderRadius: RADIUS.full,
  },
  weatherStripWarn: {
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.35)',
  },
  weatherTemp: { fontSize: FONTS.sizes.md, fontWeight: '700', color: '#FFFFFF' },
  weatherDesc: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.78)', flex: 1 },

  // ── Guest Banner
  guestBanner: {
    margin: SPACING.lg,
    marginTop: -8,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.sm, ...SHADOWS.xs,
  },
  guestTitle: { fontSize: 13, fontWeight: '700' },
  guestDesc:  { fontSize: 11, marginTop: 2 },
  guestCta: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md, paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  guestCtaText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },

  // ── Body
  body: { paddingHorizontal: SPACING.xxl, paddingTop: SPACING.xl },

  sectionTitle: {
    fontSize: FONTS.sizes.lg, fontWeight: '800',
    marginBottom: SPACING.md, letterSpacing: -0.3,
  },
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.md,
  },
  sectionLink: { fontSize: FONTS.sizes.sm, fontWeight: '700' },

  // ── Quick Actions
  actionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md,
    marginBottom: SPACING.xxxl,
  },
  actionCard: {
    width: '47%', borderRadius: RADIUS.xl, overflow: 'hidden',
  },
  actionGradient: {
    padding: SPACING.lg, paddingVertical: SPACING.xl,
    alignItems: 'center', gap: SPACING.sm,
  },
  actionIconBg: {
    width: 54, height: 54, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: FONTS.sizes.sm + 1, fontWeight: '700', color: '#FFFFFF',
    textAlign: 'center',
  },

  // ── Fare Cards
  fareCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: RADIUS.lg, borderWidth: 1,
    marginBottom: SPACING.md, overflow: 'hidden',
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg,
  },
  fareAccent: { width: 4, height: '100%', position: 'absolute', left: 0 },
  fareType: { fontSize: FONTS.sizes.md, fontWeight: '700' },
  fareDetail: { fontSize: FONTS.sizes.sm, marginTop: 2 },
  fareRight: { alignItems: 'flex-end' },
  fareRate: { fontSize: FONTS.sizes.xl, fontWeight: '900' },
  fareRateLabel: { fontSize: FONTS.sizes.xs },

  // ── Discount Hero Card
  discountHero: {
    borderRadius: RADIUS.xl, borderWidth: 1.5,
    padding: SPACING.lg, marginBottom: SPACING.xxl, overflow: 'hidden',
  },
  discountHeader: {
    flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.lg,
  },
  discountIconBig: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: COLORS.accentDark,
    justifyContent: 'center', alignItems: 'center',
    ...SHADOWS.sm,
  },
  discountTitleRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    flexWrap: 'wrap', marginBottom: 4,
  },
  discountTitle: { fontSize: FONTS.sizes.lg, fontWeight: '900', color: '#92400E' },
  legalBadge: {
    backgroundColor: COLORS.accentDark,
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  legalBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  discountDesc: { fontSize: 12, color: '#78350F', lineHeight: 17 },

  personaRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  personaCard: {
    flex: 1, borderRadius: RADIUS.lg, padding: SPACING.md,
    alignItems: 'center', gap: 4,
  },
  personaLabel: { fontSize: 11, fontWeight: '800', textAlign: 'center' },
  personaLaw:   { fontSize: 9, fontWeight: '600', color: '#6B7280', textAlign: 'center' },

  calcBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.accentDark,
    paddingVertical: 11, paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md, alignSelf: 'flex-start',
  },
  calcBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: FONTS.sizes.sm },

  // ── Rights Card
  rightsCard: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.md, padding: SPACING.lg,
    borderRadius: RADIUS.lg, borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  rightsIconWrap: {
    width: 44, height: 44, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primarySubtle,
    justifyContent: 'center', alignItems: 'center',
  },
  rightsTitle: { fontSize: FONTS.sizes.md, fontWeight: '700' },
  rightsDesc:  { fontSize: FONTS.sizes.sm, marginTop: 2 },
});

export default HomeScreen;
