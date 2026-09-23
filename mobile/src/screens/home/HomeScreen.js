import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Card, SectionHeader, Badge } from '../../components/common/SharedComponents';
import AuthPromptModal from '../../components/common/AuthPromptModal';
import { faresAPI, weatherAPI } from '../../api/services';
import { FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/constants';
import { formatPeso, getWeatherIcon } from '../../utils/helpers';

const HomeScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { user, isGuest, exitGuestMode } = useAuth();
  const { unreadCount } = useNotifications();
  const [fares, setFares] = useState([]);
  const [weather, setWeather] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [promptModal, setPromptModal] = useState({
    visible: false,
    title: '',
    message: '',
    icon: 'account-lock',
    tag: '',
  });

  const openPrompt = (title, message, icon, tag) => {
    setPromptModal({ visible: true, title, message, icon, tag });
  };

  const closePrompt = () => {
    setPromptModal((prev) => ({ ...prev, visible: false }));
  };

  const loadData = useCallback(async () => {
    try {
      const [faresRes, weatherRes] = await Promise.allSettled([
        faresAPI.getActiveFares(),
        weatherAPI.getCurrentWeather(),
      ]);
      if (faresRes.status === 'fulfilled') setFares(faresRes.value.data.data || []);
      if (weatherRes.status === 'fulfilled') setWeather(weatherRes.value.data.data || null);
    } catch (e) { /* Silently fail */ }
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

  const quickActions = [
    {
      icon: 'steering',
      label: 'Start\nRide',
      screen: 'Ride',
      color: '#EA580C',
      bg: '#FFEDD5',
      auth: true,
      promptTitle: 'Sign In to Start Ride Tracking',
      promptMsg: 'Real-time GPS ride tracking and live LTFRB fare calculation require an account. Please sign in or create a free account if you don\'t have one.',
      promptIcon: 'steering',
      promptTag: 'Live Ride Tracker',
    },
    {
      icon: 'map-marker-distance',
      label: 'Routes &\nFares',
      screen: 'RoutesAndFares',
      color: '#10B981',
      bg: '#D1FAE5',
    },
    {
      icon: 'robot',
      label: 'AI\nAssistant',
      screen: 'Assistant',
      color: '#8B5CF6',
      bg: '#EDE9FE',
      auth: true,
      promptTitle: 'Sign In to Use AI Assistant',
      promptMsg: 'Get 24/7 personalized route guidance and commuter advice. Please sign in or create an account if you don\'t have one.',
      promptIcon: 'robot',
      promptTag: 'Smart Assistant',
    },
    {
      icon: 'alert-circle-outline',
      label: 'File\nReport',
      screen: 'SubmitComplaint',
      color: '#F59E0B',
      bg: '#FEF3C7',
      auth: true,
      promptTitle: 'Sign In to File a Report',
      promptMsg: 'Verified commuter accounts are required by Dagupan transport regulators to process official grievances. Please sign in or create an account if you don\'t have one.',
      promptIcon: 'clipboard-alert',
      promptTag: 'Grievance Filing',
    },
  ];

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{greeting()}{user ? `, ${user.firstName}` : ''}! 👋</Text>
              <Text style={styles.headerSubtitle}>
                {isGuest ? 'Guest Session • Dagupan City' : 'SmartSakay Dagupan'}
              </Text>
            </View>
            {isGuest ? (
              <TouchableOpacity
                onPress={() => openPrompt('Transit Notifications', 'Sign up to receive personalized route detours, fare revisions, and severe weather advisories.', 'bell-ring-outline', 'Alerts')}
                style={styles.notifBtn}
              >
                <MaterialCommunityIcons name="bell-badge-outline" size={24} color="#FBBF24" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.notifBtn}>
                <MaterialCommunityIcons name="bell-outline" size={24} color="#FFFFFF" />
                <Badge count={unreadCount} />
              </TouchableOpacity>
            )}
          </View>

        {/* Weather mini card */}
        {weather && (() => {
          const conditionStr = weather.current?.condition?.text || (typeof weather.current?.condition === 'string' ? weather.current?.condition : null) || weather.conditionText || 'Dagupan City';
          const iconName = getWeatherIcon(conditionStr);
          const isWarning = conditionStr.toLowerCase().includes('rain') || conditionStr.toLowerCase().includes('thunder');

          return (
            <TouchableOpacity
              style={[styles.weatherMini, isWarning && { backgroundColor: 'rgba(239, 68, 68, 0.25)', borderColor: 'rgba(239, 68, 68, 0.4)', borderWidth: 1 }]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Weather')}
            >
              <MaterialCommunityIcons name={iconName} size={22} color={isWarning ? "#FCA5A5" : "#FBBF24"} />
              <Text style={styles.weatherTemp}>
                {weather.current?.temp_c ?? weather.current?.tempC ?? weather.temp_c ?? '--'}°C
              </Text>
              <Text style={styles.weatherDesc} numberOfLines={1}>
                {conditionStr} • Dagupan
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color="rgba(255,255,255,0.6)" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          );
        })()}
      </View>

      {/* Guest Mode Banner */}
      {isGuest && (
        <View style={[styles.guestBanner, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '35' }]}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <MaterialCommunityIcons name="shield-outline" size={16} color={colors.primary} />
              <Text style={[styles.guestBannerTitle, { color: colors.textPrimary }]}>Browsing in Guest Mode</Text>
            </View>
            <Text style={[styles.guestBannerDesc, { color: colors.textSecondary }]}>
              Sign up to file verified complaints & chat with the AI assistant.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.guestBannerBtn, { backgroundColor: colors.primary }]}
            onPress={() => openPrompt('Join SmartSakay Dagupan', 'Register your free account to access AI transit assistance, file commuter complaints, and bookmark routes.', 'account-plus', 'Free Account')}
          >
            <Text style={styles.guestBannerBtnText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.content}>
        {/* Quick Actions */}
        <SectionHeader title="Quick Actions" />
        <View style={styles.actionsGrid}>
          {quickActions.map((action, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => {
                if (action.auth && isGuest) {
                  openPrompt(
                    action.promptTitle || 'Account Required',
                    action.promptMsg || 'Please sign up or sign in to use this feature.',
                    action.promptIcon || 'account-lock',
                    action.promptTag || 'Account'
                  );
                  return;
                }
                if (action.params) {
                  navigation.navigate(action.screen, action.params);
                } else {
                  navigation.navigate(action.screen);
                }
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.bg }]}>
                <MaterialCommunityIcons name={action.icon} size={26} color={action.color} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Fare Rates Summary */}
        <SectionHeader
          title="Current Fare Rates"
          actionText="View Matrix"
          onAction={() => navigation.navigate('RoutesAndFares', { initialTab: 'fares' })}
        />
        {fares.map((fare) => (
          <Card key={fare._id} style={{ borderLeftWidth: 3, borderLeftColor: fare.vehicleType === 'traditional' ? '#F59E0B' : '#3B82F6' }}>
            <View style={styles.fareRow}>
              <View>
                <Text style={[styles.fareType, { color: colors.textPrimary }]}>
                  {fare.vehicleType === 'traditional' ? '🚐 Traditional' : '🚌 Modern'} Jeepney
                </Text>
                <Text style={[styles.fareDetail, { color: colors.textSecondary }]}>
                  Base: {formatPeso(fare.baseFare)} (first {fare.baseDistanceKm} km)
                </Text>
              </View>
              <View style={styles.fareRight}>
                <Text style={[styles.fareRate, { color: colors.primary }]}>
                  {formatPeso(fare.perKmRate)}
                </Text>
                <Text style={[styles.fareRateLabel, { color: colors.textMuted }]}>per km</Text>
              </View>
            </View>
          </Card>
        ))}

        {/* Commuter Rights */}
        <SectionHeader title="Know Your Rights" />
        <Card>
          <TouchableOpacity
            style={styles.rightsCard}
            onPress={() => navigation.navigate('CommuterRights')}
          >
            <MaterialCommunityIcons name="scale-balance" size={28} color={colors.primary} />
            <View style={styles.rightsText}>
              <Text style={[styles.rightsTitle, { color: colors.textPrimary }]}>Commuter Rights</Text>
              <Text style={[styles.rightsDesc, { color: colors.textSecondary }]}>
                Know your rights as a commuter. LTFRB hotline: 1342
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
          </TouchableOpacity>
        </Card>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingBottom: SPACING.xxl, paddingHorizontal: SPACING.xxl, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: '#FFFFFF' },
  headerSubtitle: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  notifBtn: { padding: 8 },
  weatherMini: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.lg, backgroundColor: 'rgba(255,255,255,0.12)', padding: SPACING.sm + 2, borderRadius: RADIUS.full, paddingHorizontal: SPACING.lg },
  weatherTemp: { fontSize: FONTS.sizes.md, fontWeight: '700', color: '#FFFFFF' },
  weatherDesc: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.8)' },
  content: { padding: SPACING.xxl, paddingTop: SPACING.xl },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.xxl },
  actionCard: {
    width: '47%', padding: SPACING.lg, borderRadius: RADIUS.lg, alignItems: 'center',
    borderWidth: 1, ...SHADOWS.sm,
  },
  actionIcon: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm },
  actionLabel: { fontSize: FONTS.sizes.sm, fontWeight: '600', textAlign: 'center', lineHeight: 18 },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fareType: { fontSize: FONTS.sizes.md, fontWeight: '700', marginBottom: 2 },
  fareDetail: { fontSize: FONTS.sizes.sm },
  fareRight: { alignItems: 'flex-end' },
  fareRate: { fontSize: FONTS.sizes.xl, fontWeight: '800' },
  fareRateLabel: { fontSize: FONTS.sizes.xs },
  rightsCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  rightsText: { flex: 1 },
  rightsTitle: { fontSize: FONTS.sizes.md, fontWeight: '700' },
  rightsDesc: { fontSize: FONTS.sizes.sm, marginTop: 2 },
  guestBanner: {
    marginHorizontal: SPACING.xxl,
    marginTop: -12,
    marginBottom: SPACING.sm,
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    ...SHADOWS.sm,
  },
  guestBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  guestBannerDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  guestBannerBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  guestBannerBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
});

export default HomeScreen;
