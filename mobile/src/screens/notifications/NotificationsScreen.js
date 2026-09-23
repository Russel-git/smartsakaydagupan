import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { EmptyState, Card } from '../../components/common/SharedComponents';
import { FONTS, SPACING, RADIUS } from '../../utils/constants';
import { formatDate, formatDateTime } from '../../utils/helpers';

const NOTIF_CONFIG = {
  fare_update: {
    icon: 'cash',
    color: '#F59E0B',
    bg: '#FEF3C7',
    label: 'LTFRB Fare Revision',
    actionText: 'View Fare Matrix',
    actionScreen: 'RoutesAndFares',
    actionParams: { initialTab: 'fares' },
  },
  weather_alert: {
    icon: 'weather-lightning',
    color: '#EF4444',
    bg: '#FEE2E2',
    label: 'Dagupan Weather Alert',
    actionText: 'Check Weather & Flood Advisory',
    actionScreen: 'Weather',
  },
  complaint_update: {
    icon: 'scale-balance',
    color: '#8B5CF6',
    bg: '#EDE9FE',
    label: 'Complaint / LTFRB Endorsement',
    actionText: 'View My Complaints',
    actionScreen: 'ComplaintsList',
  },
  broadcast: {
    icon: 'bullhorn',
    color: '#3B82F6',
    bg: '#DBEAFE',
    label: 'Public Transit Advisory',
  },
  system: {
    icon: 'bell-circle',
    color: '#6B7280',
    bg: '#F3F4F6',
    label: 'System Notification',
  },
};

const NotificationsScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const {
    notifications,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    unreadCount,
  } = useNotifications();

  const [selectedNotif, setSelectedNotif] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleCardPress = (item) => {
    if (!item.isRead) {
      markAsRead(item._id);
    }
    setSelectedNotif(item);
  };

  const handleActionNavigation = (config) => {
    setSelectedNotif(null);
    if (!config?.actionScreen) return;
    try {
      if (config.actionParams) {
        navigation.navigate(config.actionScreen, config.actionParams);
      } else {
        navigation.navigate(config.actionScreen);
      }
    } catch (err) {
      console.log('Navigation fallback:', err.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Bar */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Notifications</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Transit advisories, fare matrix changes & LTFRB updates
          </Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={markAllAsRead}
            style={[styles.markAllBtn, { backgroundColor: colors.primary + '15' }]}
          >
            <Text style={[styles.markAll, { color: colors.primary }]}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id || Math.random().toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="bell-off-outline"
            title="No notifications"
            message="You're all caught up with Dagupan transit announcements!"
          />
        }
        renderItem={({ item }) => {
          const cfg = NOTIF_CONFIG[item.type] || NOTIF_CONFIG.system;
          return (
            <TouchableOpacity
              style={[
                styles.notifCard,
                {
                  backgroundColor: item.isRead ? colors.surface : colors.primary + '0A',
                  borderColor: item.isRead ? colors.border : colors.primary + '40',
                },
              ]}
              onPress={() => handleCardPress(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconCircle, { backgroundColor: cfg.color + '20' }]}>
                <MaterialCommunityIcons name={cfg.icon} size={22} color={cfg.color} />
              </View>

              <View style={styles.notifContent}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: cfg.color,
                      textTransform: 'uppercase',
                    }}
                  >
                    {cfg.label}
                  </span>
                  <Text style={[styles.notifTime, { color: colors.textMuted }]}>
                    {formatDate(item.createdAt)}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.notifTitle,
                    { color: colors.textPrimary, fontWeight: item.isRead ? '600' : '800' },
                  ]}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>

                <Text style={[styles.notifMsg, { color: colors.textSecondary }]} numberOfLines={2}>
                  {item.message}
                </Text>

                <View style={styles.viewFullRow}>
                  <Text style={[styles.viewFullText, { color: colors.primary }]}>
                    Tap to view full announcement
                  </Text>
                  <MaterialCommunityIcons name="chevron-right" size={16} color={colors.primary} />
                </View>
              </View>

              {!item.isRead && (
                <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* Full-Context Announcement Detail Modal */}
      {selectedNotif && (() => {
        const cfg = NOTIF_CONFIG[selectedNotif.type] || NOTIF_CONFIG.system;
        return (
          <Modal
            visible={!!selectedNotif}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setSelectedNotif(null)}
          >
            <View style={styles.modalBackdrop}>
              <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%', padding: SPACING.md }}>
                <View
                  style={[
                    styles.modalContainer,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  {/* Modal Header */}
                  <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <View style={[styles.modalIconBox, { backgroundColor: cfg.color + '22' }]}>
                        <MaterialCommunityIcons name={cfg.icon} size={22} color={cfg.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.modalBadgeText, { color: cfg.color }]}>
                          {cfg.label}
                        </Text>
                        <Text style={[styles.modalTimeText, { color: colors.textMuted }]}>
                          {formatDateTime(selectedNotif.createdAt)}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => setSelectedNotif(null)}
                      style={[styles.closeBtn, { backgroundColor: colors.background }]}
                    >
                      <MaterialCommunityIcons name="close" size={20} color={colors.textPrimary} />
                    </TouchableOpacity>
                  </View>

                  {/* Modal Body / Full Message */}
                  <ScrollView
                    style={styles.modalScroll}
                    contentContainerStyle={{ padding: SPACING.lg }}
                    showsVerticalScrollIndicator={true}
                  >
                    <Text style={[styles.modalFullTitle, { color: colors.textPrimary }]}>
                      {selectedNotif.title}
                    </Text>

                    {/* Reference tag if present */}
                    {selectedNotif.metadata?.ltfrbCaseNumber && (
                      <View style={[styles.refBox, { backgroundColor: '#EDE9FE', borderColor: '#C4B5FD' }]}>
                        <MaterialCommunityIcons name="shield-check" size={18} color="#7C3AED" />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#6D28D9' }}>
                            OFFICIAL LTFRB CASE REFERENCE
                          </Text>
                          <Text style={{ fontSize: 13, fontWeight: '800', color: '#5B21B6', fontFamily: 'monospace' }}>
                            {selectedNotif.metadata.ltfrbCaseNumber}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Unabridged Announcement Content Box */}
                    <View
                      style={[
                        styles.messageContainer,
                        {
                          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.modalFullMessage, { color: colors.textPrimary }]}>
                        {selectedNotif.message}
                      </Text>
                    </View>

                    {/* Dagupan City Transit Advisory Footer Notice */}
                    <View style={styles.footerNoticeRow}>
                      <MaterialCommunityIcons name="information-outline" size={15} color={colors.textMuted} />
                      <Text style={[styles.footerNoticeText, { color: colors.textMuted }]}>
                        Official SmartSakay Dagupan notification verified by City Transport Authority.
                      </Text>
                    </View>
                  </ScrollView>

                  {/* Modal Action Footer */}
                  <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                    {cfg.actionScreen ? (
                      <TouchableOpacity
                        style={[styles.primaryActionBtn, { backgroundColor: cfg.color }]}
                        onPress={() => handleActionNavigation(cfg)}
                      >
                        <MaterialCommunityIcons name="open-in-app" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.primaryActionText}>{cfg.actionText}</Text>
                      </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity
                      style={[
                        styles.secondaryCloseBtn,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                          flex: cfg.actionScreen ? undefined : 1,
                        },
                      ]}
                      onPress={() => setSelectedNotif(null)}
                    >
                      <Text style={[styles.secondaryCloseText, { color: colors.textPrimary }]}>
                        Close
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </SafeAreaView>
            </View>
          </Modal>
        );
      })()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    padding: SPACING.lg,
    paddingTop: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  title: { fontSize: FONTS.sizes.xl, fontWeight: '800' },
  subtitle: { fontSize: FONTS.sizes.xs, marginTop: 2 },
  markAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  markAll: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  listContent: { padding: SPACING.lg, paddingTop: 0 },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: FONTS.sizes.md, marginBottom: 4, lineHeight: 20 },
  notifMsg: { fontSize: FONTS.sizes.sm, lineHeight: 19 },
  notifTime: { fontSize: FONTS.sizes.xs, fontWeight: '500' },
  viewFullRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 8,
  },
  viewFullText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
  },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '85%',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  modalIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBadgeText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalTimeText: {
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    flexGrow: 0,
  },
  modalFullTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '800',
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  refBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  messageContainer: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  modalFullMessage: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '400',
  },
  footerNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  footerNoticeText: {
    fontSize: 11,
    flex: 1,
    lineHeight: 15,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    padding: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderTopWidth: 1,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    flex: 1,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: FONTS.sizes.sm,
  },
  secondaryCloseBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryCloseText: {
    fontWeight: '600',
    fontSize: FONTS.sizes.sm,
  },
});

export default NotificationsScreen;
