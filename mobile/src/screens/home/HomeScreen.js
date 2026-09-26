import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Card, SectionHeader, Badge, StatusBadge } from '../../components/common/SharedComponents';
import AuthPromptModal from '../../components/common/AuthPromptModal';
import HomeMapWidget from '../../components/common/HomeMapWidget';
import { faresAPI, weatherAPI, complaintsAPI } from '../../api/services';
import { FONTS, SPACING, RADIUS, SHADOWS, COMPLAINT_STATUS } from '../../utils/constants';
import { formatPeso, getWeatherIcon } from '../../utils/helpers';

const HomeScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { user, isGuest, exitGuestMode } = useAuth();
  const { unreadCount } = useNotifications();
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
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.greeting} numberOfLines={1} adjustsFontSizeToFit>{greeting()}{user ? `, ${user.firstName}` : ''}! 👋</Text>
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
        {/* Quick Actions Grid */}
        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
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
            <Text style={[styles.quickTitle, { color: colors.textPrimary }]}>File Complaint</Text>
            <Text style={[styles.quickSubtitle, { color: colors.textMuted }]}>Report violation</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
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
            <Text style={[styles.quickTitle, { color: colors.textPrimary }]}>My Reports</Text>
            <Text style={[styles.quickSubtitle, { color: colors.textMuted }]}>Track status</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('RoutesAndFares', { initialTab: 'fares' })}
            activeOpacity={0.8}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
              <MaterialCommunityIcons name="calculator-variant" size={24} color="#10B981" />
            </View>
            <Text style={[styles.quickTitle, { color: colors.textPrimary }]}>Fare Matrix</Text>
            <Text style={[styles.quickSubtitle, { color: colors.textMuted }]}>Check rates</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('CommuterRights')}
            activeOpacity={0.8}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
              <MaterialCommunityIcons name="scale-balance" size={24} color="#3B82F6" />
            </View>
            <Text style={[styles.quickTitle, { color: colors.textPrimary }]}>Rights & 20%</Text>
            <Text style={[styles.quickSubtitle, { color: colors.textMuted }]}>Discount guide</Text>
          </TouchableOpacity>
        </View>

        {/* Active Report Live Monitor Card (if commuter has an ongoing complaint) */}
        {!isGuest && Boolean(activeComplaint) ? (
          <TouchableOpacity
            onPress={() => navigation.navigate('ComplaintDetail', { complaint: activeComplaint, complaintId: activeComplaint._id })}
            activeOpacity={0.88}
            style={{ marginBottom: SPACING.md }}
          >
            <Card style={[styles.activeCaseCard, { backgroundColor: isDark ? 'rgba(2, 132, 199, 0.12)' : '#F0F9FF', borderColor: '#0284C7' }]}>
              <View style={styles.activeCaseHeader}>
                <View style={styles.activeCaseTag}>
                  <MaterialCommunityIcons name="shield-search" size={16} color="#0284C7" />
                  <Text style={styles.activeCaseTagText}>
                    {activeComplaint.lguCaseNumber || 'Case In Progress'}
                  </Text>
                </View>
                <StatusBadge
                  label={COMPLAINT_STATUS[activeComplaint.status]?.label || activeComplaint.status}
                  color={COMPLAINT_STATUS[activeComplaint.status]?.color}
                  bgColor={COMPLAINT_STATUS[activeComplaint.status]?.bgColor}
                />
              </View>

              <Text style={[styles.activeCaseTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {activeComplaint.subject}
              </Text>

              <Text style={[styles.activeCaseSnippet, { color: isDark ? '#BAE6FD' : '#0369A1' }]} numberOfLines={2}>
                {activeComplaint.lguActionNotes
                  ? `🚨 POSO Action: ${activeComplaint.lguActionNotes}`
                  : activeComplaint.lguCaseNumber
                  ? `🏛️ Escalated to Dagupan POSO for administrative inquiry.`
                  : activeComplaint.adminNotes
                  ? `💬 Operator: ${activeComplaint.adminNotes}`
                  : '⏳ Awaiting initial review by transport dispatch.'}
              </Text>

              <View style={styles.activeCaseFooter}>
                <Text style={styles.activeCaseFooterLink}>Track Live Updates & Step Progress</Text>
                <MaterialCommunityIcons name="arrow-right" size={16} color="#0284C7" />
              </View>
            </Card>
          </TouchableOpacity>
        ) : null}

        {/* Featured Grievance Desk Banner */}
        <Card style={[styles.complaintBanner, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : '#FEF2F2', borderColor: 'rgba(239, 68, 68, 0.25)' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View style={[styles.complaintBannerIcon, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <MaterialCommunityIcons name="shield-alert" size={26} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Text style={[styles.complaintBannerTitle, { color: isDark ? '#FCA5A5' : '#B91C1C' }]}>
                  Transit Grievance Desk
                </Text>
                <View style={styles.complaintQuotaTag}>
                  <Text style={styles.complaintQuotaText}>5/day</Text>
                </View>
              </View>
              <Text style={[styles.complaintBannerDesc, { color: isDark ? '#F87171' : '#7F1D1D' }]}>
                Overcharging, rude driver, refused 20% discount, or route cutting? Attach photo evidence to submit directly to Dagupan LGU.
              </Text>
              <TouchableOpacity
                style={styles.complaintActionBtn}
                onPress={() => {
                  if (isGuest) {
                    openPrompt('File a Complaint', 'Register or sign in to file verified transit complaints with photo evidence to Dagupan LGU.', 'clipboard-alert', 'Verified Report');
                  } else {
                    navigation.navigate('SubmitComplaint');
                  }
                }}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="plus-circle" size={16} color="#FFFFFF" />
                <Text style={styles.complaintActionBtnText}>File Complaint Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

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
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: SPACING.lg,
  },
  quickCard: {
    width: '48.5%',
    padding: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: 'flex-start',
    ...SHADOWS.sm,
  },
  quickIconCircle: {
    width: 42,
    height: 42,
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
    fontSize: 10,
    marginTop: 2,
  },
  complaintBanner: {
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.xl,
    ...SHADOWS.sm,
  },
  complaintBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  complaintBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  complaintQuotaTag: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  complaintQuotaText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  complaintBannerDesc: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 10,
  },
  complaintActionBtn: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
  },
  complaintActionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  activeCaseCard: {
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    ...SHADOWS.sm,
  },
  activeCaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  activeCaseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  activeCaseTagText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
    fontFamily: 'monospace',
  },
  activeCaseTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  activeCaseSnippet: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 8,
  },
  activeCaseFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(2, 132, 199, 0.3)',
    paddingTop: 8,
  },
  activeCaseFooterLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
});

export default HomeScreen;
