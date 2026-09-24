import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Card, SectionHeader, Badge } from '../../components/common/SharedComponents';
import AuthPromptModal from '../../components/common/AuthPromptModal';
import HomeMapWidget from '../../components/common/HomeMapWidget';
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
        {/* Live Map Widget */}
        <SectionHeader
          title="Live Transit Map"
          actionText="Full View"
          onAction={() => navigation.navigate('RoutesAndFares')}
        />
        <HomeMapWidget navigation={navigation} height={260} />

        {/* Fare Rates Summary */}
        <SectionHeader
          title="Current Fare Rates"
          actionText="View Matrix"
          onAction={() => navigation.navigate('RoutesAndFares', { initialTab: 'fares' })}
        />
        {fares.map((fare) => (
          <Card key={fare._id} style={{ borderLeftWidth: 3, borderLeftColor: fare.vehicleType === 'traditional' ? '#f97316' : '#3b82f6' }}>
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
