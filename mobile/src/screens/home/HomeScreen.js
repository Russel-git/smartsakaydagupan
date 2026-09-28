import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Card, SectionHeader, Badge } from '../../components/common/SharedComponents';
import AuthPromptModal from '../../components/common/AuthPromptModal';
import HomeMapWidget from '../../components/common/HomeMapWidget';
import { faresAPI, weatherAPI, complaintsAPI } from '../../api/services';
import { FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/constants';
import { formatPeso, getWeatherIcon } from '../../utils/helpers';

const HomeScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { user, isGuest } = useAuth();
  const { unreadCount } = useNotifications();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;

  const [fares, setFares] = useState([]);
  const [weather, setWeather] = useState(null);
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [promptModal, setPromptModal] = useState({
    visible: false,
    title: '',
    message: '',
    icon: 'account-lock',
    tag: '',
  });

  const topInset = Platform.OS === 'android'
    ? Math.max(insets.top, StatusBar.currentHeight || 28)
    : insets.top;

  const openPrompt = (title, message, icon, tag) => {
    setPromptModal({ visible: true, title, message, icon, tag });
  };

  const closePrompt = () => {
    setPromptModal((prev) => ({ ...prev, visible: false }));
  };

  const loadData = useCallback(async () => {
    try {
      const promises = [
        faresAPI.getActiveFares(),
        weatherAPI.getCurrentWeather(),
      ];
      if (!isGuest) {
        promises.push(complaintsAPI.getMyComplaints());
      }
      const results = await Promise.allSettled(promises);
      const faresRes = results[0];
      const weatherRes = results[1];
      const complaintsRes = results[2];

      if (faresRes?.status === 'fulfilled') setFares(faresRes.value.data.data || []);
      if (weatherRes?.status === 'fulfilled') setWeather(weatherRes.value.data.data || null);
      if (complaintsRes?.status === 'fulfilled') {
        const list = complaintsRes.value.data?.data || complaintsRes.value.data?.complaints || [];
        const active = list.find((c) =>
          ['pending', 'under_review', 'endorsed_to_lgu', 'action_taken'].includes(c.status)
        );
        setActiveComplaint(active || null);
      }
    } catch (e) { /* Silently fail */ }
  }, [isGuest]);

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
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.primary}
        translucent={Platform.OS === 'android'}
      />
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
        showsVerticalScrollIndicator={false}
      >
        {/* Header with dynamic safe inset */}
        <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: topInset + 12 }]}>
          <View style={[styles.headerInner, { maxWidth: isTablet ? 780 : '100%' }]}>
            <View style={styles.headerTop}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.greeting} numberOfLines={1} adjustsFontSizeToFit>
                  {greeting()}{user ? `, ${user.firstName}` : ''}! 👋
                </Text>
                <Text style={styles.headerSubtitle}>
                  {isGuest ? 'Guest Session • Dagupan City' : 'SmartSakay Dagupan'}
                </Text>
              </View>
              {isGuest ? (
                <TouchableOpacity
                  onPress={() => openPrompt('Transit Notifications', 'Sign up to receive personalized route detours, fare revisions, and severe weather advisories.', 'bell-ring-outline', 'Alerts')}
                  style={styles.notifBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons name="bell-badge-outline" size={24} color="#FBBF24" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => navigation.navigate('Notifications')}
                  style={styles.notifBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons name="bell-outline" size={24} color="#FFFFFF" />
                  <Badge count={unreadCount} />
                </TouchableOpacity>
              )}
            </View>

            {/* Weather mini card */}
            {Boolean(weather) ? (() => {
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
            })() : null}
          </View>
        </View>

        {/* Content wrapper with tablet centering */}
        <View style={[styles.mainWrapper, { maxWidth: isTablet ? 780 : '100%' }]}>
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
                activeOpacity={0.8}
              >
                <Text style={styles.guestBannerBtnText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.content}>
            {/* Quick Actions Grid: 2 cols on phones, 4 cols on tablets */}
            <View style={styles.quickGrid}>
              <TouchableOpacity
                style={[
                  styles.quickCard,
                  {
                    width: isTablet ? '23.5%' : '48.5%',
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => navigation.navigate('RoutesAndFares', { initialTab: 'routes' })}
                activeOpacity={0.8}
              >
                <View style={[styles.quickIconCircle, { backgroundColor: 'rgba(14, 165, 233, 0.12)' }]}>
                  <MaterialCommunityIcons name="routes" size={24} color="#0EA5E9" />
                </View>
                <Text style={[styles.quickTitle, { color: colors.textPrimary }]} numberOfLines={1}>Jeepney Routes</Text>
                <Text style={[styles.quickSubtitle, { color: colors.textMuted }]} numberOfLines={1}>View routes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.quickCard,
                  {
                    width: isTablet ? '23.5%' : '48.5%',
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => {
                  if (isGuest) {
                    openPrompt('My Complaints', 'Sign in to monitor investigations, official LGU summons, and resolution notes.', 'clipboard-text', 'Complaint Tracker');
                  } else {
                    navigation.navigate('ComplaintsList');
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.quickIconCircle, { backgroundColor: colors.primary + '15' }]}>
                  <MaterialCommunityIcons name="clipboard-text-clock-outline" size={24} color={colors.primary} />
                </View>
                <Text style={[styles.quickTitle, { color: colors.textPrimary }]} numberOfLines={1}>My Reports</Text>
                <Text style={[styles.quickSubtitle, { color: colors.textMuted }]} numberOfLines={1}>Track status</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.quickCard,
                  {
                    width: isTablet ? '23.5%' : '48.5%',
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => navigation.navigate('RoutesAndFares', { initialTab: 'fares' })}
                activeOpacity={0.8}
              >
                <View style={[styles.quickIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                  <MaterialCommunityIcons name="calculator-variant" size={24} color="#10B981" />
                </View>
                <Text style={[styles.quickTitle, { color: colors.textPrimary }]} numberOfLines={1}>Fare Matrix</Text>
                <Text style={[styles.quickSubtitle, { color: colors.textMuted }]} numberOfLines={1}>Check rates</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.quickCard,
                  {
                    width: isTablet ? '23.5%' : '48.5%',
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => {
                  if (isGuest) {
                    openPrompt('File a Complaint', 'Register or sign in to file verified transit complaints with photo evidence to Dagupan LGU.', 'clipboard-alert', 'Verified Report');
                  } else {
                    navigation.navigate('SubmitComplaint');
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.quickIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                  <MaterialCommunityIcons name="clipboard-alert-outline" size={24} color="#EF4444" />
                </View>
                <Text style={[styles.quickTitle, { color: colors.textPrimary }]} numberOfLines={1}>File Complaint</Text>
                <Text style={[styles.quickSubtitle, { color: colors.textMuted }]} numberOfLines={1}>Report violation</Text>
              </TouchableOpacity>
            </View>

            {/* Live Map Widget */}
            <SectionHeader
              title="Live Transit Map"
              actionText="Full View"
              onAction={() => navigation.navigate('RoutesAndFares')}
            />
            <HomeMapWidget navigation={navigation} height={isTablet ? 320 : 260} />

            {/* Fare Rates Summary */}
            <SectionHeader
              title="Current Fare Rates"
              actionText="View Matrix"
              onAction={() => navigation.navigate('RoutesAndFares', { initialTab: 'fares' })}
            />
            {fares.map((fare) => (
              <Card key={fare._id} style={{ borderLeftWidth: 3.5, borderLeftColor: fare.vehicleType === 'traditional' ? '#f97316' : '#3b82f6', marginBottom: SPACING.md }}>
                <View style={styles.fareRow}>
                  <View style={{ flex: 1 }}>
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
            <Card style={{ marginBottom: SPACING.xl }}>
              <TouchableOpacity
                style={styles.rightsCard}
                onPress={() => navigation.navigate('CommuterRights')}
                activeOpacity={0.8}
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

            <View style={{ height: Math.max(insets.bottom, 20) + 20 }} />
          </View>
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingBottom: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    alignItems: 'center',
  },
  headerInner: {
    width: '100%',
    alignSelf: 'center',
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: '#FFFFFF' },
  headerSubtitle: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  notifBtn: {
    padding: 8,
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    backgroundColor: 'rgba(255,255,255,0.12)',
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    minHeight: 40,
  },
  weatherTemp: { fontSize: FONTS.sizes.md, fontWeight: '700', color: '#FFFFFF' },
  weatherDesc: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.8)', flex: 1 },
  mainWrapper: {
    width: '100%',
    alignSelf: 'center',
  },
  content: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fareType: { fontSize: FONTS.sizes.md, fontWeight: '700', marginBottom: 2 },
  fareDetail: { fontSize: FONTS.sizes.sm },
  fareRight: { alignItems: 'flex-end', marginLeft: 12 },
  fareRate: { fontSize: FONTS.sizes.xl, fontWeight: '800' },
  fareRateLabel: { fontSize: FONTS.sizes.xs },
  rightsCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  rightsText: { flex: 1 },
  rightsTitle: { fontSize: FONTS.sizes.md, fontWeight: '700' },
  rightsDesc: { fontSize: FONTS.sizes.sm, marginTop: 2 },
  guestBanner: {
    marginHorizontal: SPACING.xl,
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
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestBannerBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: SPACING.lg,
    justifyContent: 'space-between',
  },
  quickCard: {
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: 'flex-start',
    minHeight: 104,
    ...SHADOWS.sm,
  },
  quickIconCircle: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  quickSubtitle: {
    fontSize: 10.5,
    marginTop: 2,
  },
});

export default HomeScreen;
