import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFeedback } from '../../contexts/FeedbackContext';
import { getMunicipality } from '../../utils/storage';
import { EmptyState } from '../../components/common/SharedComponents';
import ConfirmDialogModal from '../../components/common/ConfirmDialogModal';
import { FONTS, SPACING, RADIUS, API_BASE_URL } from '../../utils/constants';
import { formatDate, formatDateTime } from '../../utils/helpers';

const getMediaUrl = (url) => {
  if (!url) return null;
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('file:')
  ) {
    return url;
  }
  const baseUrl = (API_BASE_URL || '').replace(/\/api\/?$/, '');
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${baseUrl}${cleanUrl}`;
};

// Helper to determine notification category
export const getNotificationCategory = (item) => {
  if (item?.category === 'complaint_updates' || item?.type === 'complaint_update' || item?.metadata?.complaintId) {
    return 'complaint_updates';
  }
  if (
    item?.category === 'broadcast_by_admin' ||
    item?.type === 'broadcast' ||
    item?.createdByRole === 'lgu' ||
    item?.createdByRole === 'poso' ||
    item?.userId == null
  ) {
    return 'broadcast_by_admin';
  }
  if (item?.category === 'weather_updates' || item?.type === 'weather_alert') {
    return 'weather_updates';
  }
  return 'broadcast_by_admin';
};

// Multi-category tab membership helper
export const isNotificationInTab = (item, tabId) => {
  if (tabId === 'all') return true;
  if (tabId === 'complaint_updates') {
    return (
      item?.category === 'complaint_updates' ||
      item?.type === 'complaint_update' ||
      Boolean(item?.metadata?.complaintId)
    );
  }
  if (tabId === 'broadcast_by_admin') {
    return (
      item?.category === 'broadcast_by_admin' ||
      item?.type === 'broadcast' ||
      item?.userId == null ||
      item?.createdByRole === 'lgu' ||
      item?.createdByRole === 'poso' ||
      item?.createdByRole === 'admin'
    );
  }
  if (tabId === 'weather_updates') {
    return (
      item?.category === 'weather_updates' ||
      item?.type === 'weather_alert' ||
      Boolean(item?.metadata?.tempC) ||
      Boolean(item?.metadata?.source?.includes('Open-Meteo'))
    );
  }
  return true;
};

// Dynamic Category UI Configuration scoped to town
export const getCategoryTabs = (muni = 'Dagupan') => [
  {
    id: 'all',
    label: 'All',
    icon: 'bell-outline',
    color: '#0284C7',
    emptyTitle: 'No Notifications',
    emptyMessage: `You're all caught up with ${muni} transit announcements!`,
  },
  {
    id: 'weather_updates',
    label: 'Weather Updates',
    icon: 'weather-partly-rainy',
    color: '#0284C7',
    badgeBg: '#E0F2FE',
    badgeBorder: '#BAE6FD',
    badgeText: '#0369A1',
    emptyTitle: 'No Weather Updates',
    emptyMessage: `No weather alerts or rainfall advisories in ${muni} right now.`,
  },
  {
    id: 'complaint_updates',
    label: 'Complaint Updates',
    icon: 'scale-balance',
    color: '#7C3AED',
    badgeBg: '#EDE9FE',
    badgeBorder: '#DDD6FE',
    badgeText: '#6D28D9',
    emptyTitle: 'No Complaint Updates',
    emptyMessage: `You will receive status updates here when your filed complaints are reviewed or resolved by ${muni} POSO / LGU.`,
  },
  {
    id: 'broadcast_by_admin',
    label: 'Broadcast by LGU',
    icon: 'bullhorn-variant',
    color: '#EA580C',
    badgeBg: '#FFEDD5',
    badgeBorder: '#FED7AA',
    badgeText: '#C2410C',
    emptyTitle: 'No LGU Broadcasts',
    emptyMessage: `There are no official transit broadcasts or road advisories from ${muni} LGU at this moment.`,
  },
];

// Per-type and category styling details
const NOTIF_CONFIG = {
  weather_alert: {
    categoryKey: 'weather_updates',
    categoryLabel: 'Weather Updates',
    icon: 'weather-partly-rainy',
    color: '#0284C7',
    bg: '#E0F2FE',
    actionText: 'Check Weather & Flood Advisory',
    actionScreen: 'Weather',
  },
  weather_updates: {
    categoryKey: 'weather_updates',
    categoryLabel: 'Weather Updates',
    icon: 'weather-partly-rainy',
    color: '#0284C7',
    bg: '#E0F2FE',
    actionText: 'Check Weather & Flood Advisory',
    actionScreen: 'Weather',
  },
  complaint_update: {
    categoryKey: 'complaint_updates',
    categoryLabel: 'Complaint Updates',
    icon: 'scale-balance',
    color: '#7C3AED',
    bg: '#EDE9FE',
    actionText: 'Track Case Investigation',
    actionScreen: 'ComplaintsList',
  },
  complaint_updates: {
    categoryKey: 'complaint_updates',
    categoryLabel: 'Complaint Updates',
    icon: 'scale-balance',
    color: '#7C3AED',
    bg: '#EDE9FE',
    actionText: 'Track Case Investigation',
    actionScreen: 'ComplaintsList',
  },
  broadcast: {
    categoryKey: 'broadcast_by_admin',
    categoryLabel: 'Broadcast by LGU',
    icon: 'bullhorn-variant',
    color: '#EA580C',
    bg: '#FFEDD5',
  },
  broadcast_by_admin: {
    categoryKey: 'broadcast_by_admin',
    categoryLabel: 'Broadcast by LGU',
    icon: 'bullhorn-variant',
    color: '#EA580C',
    bg: '#FFEDD5',
  },
  fare_update: {
    categoryKey: 'broadcast_by_admin',
    categoryLabel: 'Broadcast by LGU',
    subLabel: 'LTFRB Fare Revision',
    icon: 'cash-multiple',
    color: '#D97706',
    bg: '#FEF3C7',
    actionText: 'View Fare Matrix',
    actionScreen: 'RoutesAndFares',
    actionParams: { initialTab: 'fares' },
  },
  system: {
    categoryKey: 'broadcast_by_admin',
    categoryLabel: 'Broadcast by LGU',
    icon: 'shield-account',
    color: '#4B5563',
    bg: '#F3F4F6',
  },
};

const NotificationsScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const [activeMuni, setActiveMuni] = useState(user?.municipality || 'Dagupan');

  useEffect(() => {
    (async () => {
      const saved = await getMunicipality();
      const current = saved || user?.municipality || 'Dagupan';
      setActiveMuni(current);
    })();
  }, [user?.municipality]);

  const categoryTabs = useMemo(() => getCategoryTabs(activeMuni), [activeMuni]);

  const {
    notifications,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    unreadCount,
  } = useNotifications();
  const { showSuccess } = useFeedback();

  const [activeTab, setActiveTab] = useState('all');
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    visible: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'danger',
    icon: 'trash-can-outline',
    onConfirm: () => {},
  });

  const handleDeleteNotification = (notif) => {
    if (!notif?._id) return;
    const title = notif.title || 'Notification';

    setConfirmModalConfig({
      visible: true,
      title: 'Delete Notification',
      message: `Are you sure you want to remove this notification?\n\n"${title}"`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      icon: 'trash-can-outline',
      onConfirm: async () => {
        setConfirmModalConfig((prev) => ({ ...prev, visible: false }));
        if (selectedNotif?._id === notif._id) {
          setSelectedNotif(null);
        }
        await deleteNotification(notif._id);
        showSuccess('Notification Deleted', `"${title}" has been removed.`);
      },
    });
  };

  const handleDeleteAllRead = () => {
    const readItems = validNotifications.filter((n) => n.isRead);
    if (readItems.length === 0) return;

    setConfirmModalConfig({
      visible: true,
      title: 'Delete Read Notifications',
      message: `Are you sure you want to delete all ${readItems.length} read notification${
        readItems.length > 1 ? 's' : ''
      }? Unread notifications will remain in your inbox.`,
      confirmText: 'Delete All Read',
      cancelText: 'Cancel',
      type: 'danger',
      icon: 'delete-sweep-outline',
      onConfirm: async () => {
        setConfirmModalConfig((prev) => ({ ...prev, visible: false }));
        if (selectedNotif?.isRead) {
          setSelectedNotif(null);
        }
        await deleteAllRead();
        showSuccess(
          'Notifications Cleared',
          `Successfully removed ${readItems.length} read notification${
            readItems.length > 1 ? 's' : ''
          }.`
        );
      },
    });
  };

  useEffect(() => {
    fetchNotifications();
    const unsubscribe = navigation?.addListener
      ? navigation.addListener('focus', () => {
          fetchNotifications();
        })
      : null;
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [navigation, fetchNotifications]);

  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

  // Exclude weather updates that are older than 3 days
  const validNotifications = useMemo(() => {
    const now = Date.now();
    return notifications.filter((n) => {
      const cat = getNotificationCategory(n);
      if (cat === 'weather_updates') {
        const created = new Date(n.createdAt).getTime();
        if (now - created > THREE_DAYS_MS) return false;
      }
      return true;
    });
  }, [notifications]);

  // Compute count for each category
  const categoryCounts = useMemo(() => {
    const counts = {
      all: validNotifications.length,
      weather_updates: 0,
      complaint_updates: 0,
      broadcast_by_admin: 0,
    };
    const unread = {
      all: 0,
      weather_updates: 0,
      complaint_updates: 0,
      broadcast_by_admin: 0,
    };

    validNotifications.forEach((n) => {
      ['weather_updates', 'complaint_updates', 'broadcast_by_admin'].forEach((cat) => {
        if (isNotificationInTab(n, cat)) {
          counts[cat] += 1;
          if (!n.isRead) {
            unread[cat] += 1;
          }
        }
      });
      if (!n.isRead) {
        unread.all += 1;
      }
    });

    return { counts, unread };
  }, [validNotifications]);

  // Filter list by selected tab
  const filteredNotifications = useMemo(() => {
    return validNotifications.filter((n) => isNotificationInTab(n, activeTab));
  }, [validNotifications, activeTab]);

  const activeTabMeta = useMemo(() => {
    return categoryTabs.find((t) => t.id === activeTab) || categoryTabs[0];
  }, [activeTab, categoryTabs]);

  const handleCardPress = (item) => {
    if (!item.isRead) {
      markAsRead(item._id);
    }
    setSelectedNotif(item);
  };

  const handleActionNavigation = (cfg) => {
    const currentNotif = selectedNotif;
    setSelectedNotif(null);
    if (!cfg?.actionScreen) return;
    try {
      if (currentNotif?.metadata?.complaintId) {
        navigation.navigate('ComplaintDetail', {
          complaintId: currentNotif.metadata.complaintId,
        });
        return;
      }
      if (cfg.actionParams) {
        navigation.navigate(cfg.actionScreen, cfg.actionParams);
      } else {
        navigation.navigate(cfg.actionScreen);
      }
    } catch (err) {
      console.log('Navigation fallback:', err.message);
    }
  };

  const readCount = useMemo(() => {
    return validNotifications.filter((n) => n.isRead).length;
  }, [validNotifications]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Bar */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1, minWidth: 160 }}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Notifications</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Weather advisories, complaint updates & admin broadcasts
          </Text>
        </View>

        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={markAllAsRead}
              style={[styles.headerActionBtn, { backgroundColor: colors.primary + '18' }]}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="check-all"
                size={15}
                color={colors.primary}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.headerActionText, { color: colors.primary }]}>
                Mark all read
              </Text>
            </TouchableOpacity>
          )}

          {readCount > 0 && (
            <TouchableOpacity
              onPress={handleDeleteAllRead}
              style={[
                styles.headerActionBtn,
                {
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
                  borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FEE2E2',
                  borderWidth: 1,
                },
              ]}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="delete-sweep-outline"
                size={15}
                color="#EF4444"
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.headerActionText, { color: '#EF4444' }]}>
                Delete all read
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Selection Tabs Bar */}
      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categoryTabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            const count = categoryCounts.counts[tab.id] || 0;
            const unread = categoryCounts.unread[tab.id] || 0;

            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.8}
                style={[
                  styles.tabChip,
                  {
                    backgroundColor: isSelected
                      ? tab.color
                      : isDark
                      ? 'rgba(255, 255, 255, 0.06)'
                      : '#FFFFFF',
                    borderColor: isSelected
                      ? tab.color
                      : isDark
                      ? 'rgba(255, 255, 255, 0.12)'
                      : colors.border,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={tab.icon}
                  size={16}
                  color={isSelected ? '#FFFFFF' : tab.color}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.tabChipText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.textPrimary,
                      fontWeight: isSelected ? '800' : '600',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
                <View
                  style={[
                    styles.tabBadge,
                    {
                      backgroundColor: isSelected
                        ? 'rgba(255, 255, 255, 0.28)'
                        : unread > 0
                        ? tab.color + '22'
                        : isDark
                        ? 'rgba(255, 255, 255, 0.12)'
                        : '#F1F5F9',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabBadgeText,
                      {
                        color: isSelected
                          ? '#FFFFFF'
                          : unread > 0
                          ? tab.color
                          : colors.textSecondary,
                        fontWeight: unread > 0 || isSelected ? '800' : '600',
                      },
                    ]}
                  >
                    {count}
                  </Text>
                </View>
                {unread > 0 && !isSelected && (
                  <View style={[styles.tabUnreadDot, { backgroundColor: tab.color }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Notifications List */}
      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item._id || Math.random().toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon={activeTabMeta.icon}
            title={activeTabMeta.emptyTitle}
            message={activeTabMeta.emptyMessage}
          />
        }
        renderItem={({ item }) => {
          const cat = getNotificationCategory(item);
          const cfg = NOTIF_CONFIG[item.type] || NOTIF_CONFIG[cat] || NOTIF_CONFIG.broadcast;
          const isCategorySelected = activeTab !== 'all';

          return (
            <TouchableOpacity
              style={[
                styles.notifCard,
                {
                  backgroundColor: item.isRead
                    ? isDark
                      ? colors.surface
                      : '#FFFFFF'
                    : isDark
                    ? 'rgba(2, 132, 199, 0.08)'
                    : '#F0F9FF',
                  borderColor: item.isRead
                    ? colors.border
                    : isDark
                    ? 'rgba(2, 132, 199, 0.35)'
                    : '#BAE6FD',
                },
              ]}
              onPress={() => handleCardPress(item)}
              activeOpacity={0.7}
            >
              {/* Category Icon */}
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: isDark ? cfg.color + '22' : cfg.bg,
                    borderColor: cfg.color + '40',
                    borderWidth: 1,
                  },
                ]}
              >
                <MaterialCommunityIcons name={cfg.icon} size={22} color={cfg.color} />
              </View>

              <View style={styles.notifContent}>
                {/* Header row with Category Tag and Time */}
                <View style={styles.cardHeaderRow}>
                  <View
                    style={[
                      styles.categoryTag,
                      {
                        backgroundColor: isDark ? cfg.color + '25' : cfg.bg,
                        borderColor: cfg.color + '55',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryTagText,
                        { color: isDark ? '#FFFFFF' : cfg.color },
                      ]}
                    >
                      {cfg.categoryLabel}
                    </Text>
                  </View>

                  {cfg.subLabel ? (
                    <View
                      style={[
                        styles.subTag,
                        { backgroundColor: isDark ? 'rgba(217, 119, 6, 0.2)' : '#FEF3C7' },
                      ]}
                    >
                      <Text style={styles.subTagText}>{cfg.subLabel}</Text>
                    </View>
                  ) : null}

                  <Text style={[styles.notifTime, { color: colors.textMuted }]}>
                    {formatDate(item.createdAt)}
                  </Text>
                </View>

                {/* Notification Title */}
                <Text
                  style={[
                    styles.notifTitle,
                    {
                      color: colors.textPrimary,
                      fontWeight: item.isRead ? '700' : '900',
                    },
                  ]}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>

                {/* Notification Message */}
                <Text
                  style={[styles.notifMsg, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  {item.message}
                </Text>

                {/* Bottom Action Prompt with Delete Action */}
                <View style={styles.viewFullRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, flex: 1 }}>
                    <Text style={[styles.viewFullText, { color: cfg.color }]}>
                      Tap to view announcement
                    </Text>
                    <MaterialCommunityIcons name="chevron-right" size={15} color={cfg.color} />
                  </View>

                  <TouchableOpacity
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      handleDeleteNotification(item);
                    }}
                    style={[
                      styles.cardDeleteBtn,
                      {
                        backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
                        borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FEE2E2',
                      },
                    ]}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>

              {!item.isRead && (
                <View style={[styles.unreadDot, { backgroundColor: cfg.color }]} />
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* Full-Context Announcement Detail Modal */}
      {Boolean(selectedNotif) ? (() => {
        const cat = getNotificationCategory(selectedNotif);
        const cfg = NOTIF_CONFIG[selectedNotif.type] || NOTIF_CONFIG[cat] || NOTIF_CONFIG.broadcast;

        return (
          <Modal
            visible={!!selectedNotif}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setSelectedNotif(null)}
          >
            <View style={styles.modalBackdrop}>
              <SafeAreaView
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%',
                  padding: SPACING.md,
                }}
              >
                <View
                  style={[
                    styles.modalContainer,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  {/* Modal Header */}
                  <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                        flex: 1,
                      }}
                    >
                      <View
                        style={[
                          styles.modalIconBox,
                          { backgroundColor: isDark ? cfg.color + '25' : cfg.bg },
                        ]}
                      >
                        <MaterialCommunityIcons name={cfg.icon} size={22} color={cfg.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.modalBadgeText, { color: cfg.color }]}>
                          {cfg.categoryLabel}
                        </Text>
                        <Text style={[styles.modalTimeText, { color: colors.textMuted }]}>
                          {formatDateTime(selectedNotif.createdAt)}
                        </Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <TouchableOpacity
                        onPress={() => handleDeleteNotification(selectedNotif)}
                        style={[
                          styles.headerTrashBtn,
                          {
                            backgroundColor: isDark
                              ? 'rgba(239, 68, 68, 0.15)'
                              : '#FEE2E2',
                          },
                        ]}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setSelectedNotif(null)}
                        style={[
                          styles.closeBtn,
                          {
                            backgroundColor: isDark
                              ? 'rgba(255, 255, 255, 0.08)'
                              : colors.background,
                          },
                        ]}
                      >
                        <MaterialCommunityIcons name="close" size={20} color={colors.textPrimary} />
                      </TouchableOpacity>
                    </View>
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

                    {/* Reference tag if complaint update */}
                    {Boolean(
                      selectedNotif.metadata?.lguCaseNumber ||
                        selectedNotif.metadata?.ltfrbCaseNumber
                    ) ? (
                      <View
                        style={[
                          styles.refBox,
                          {
                            backgroundColor: isDark ? 'rgba(124, 58, 237, 0.15)' : '#EDE9FE',
                            borderColor: isDark ? '#7C3AED' : '#C4B5FD',
                          },
                        ]}
                      >
                        <MaterialCommunityIcons name="shield-check" size={18} color="#7C3AED" />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: '800',
                              color: isDark ? '#DDD6FE' : '#6D28D9',
                              letterSpacing: 0.5,
                            }}
                          >
                            OFFICIAL CASE TRACKING NUMBER
                          </Text>
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: '800',
                              color: isDark ? '#FFFFFF' : '#5B21B6',
                              fontFamily: 'monospace',
                            }}
                          >
                            {selectedNotif.metadata.lguCaseNumber ||
                              selectedNotif.metadata.ltfrbCaseNumber}
                          </Text>
                        </View>
                      </View>
                    ) : null}

                    {/* Unabridged Announcement Content Box */}
                    <View
                      style={[
                        styles.messageContainer,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.modalFullMessage, { color: colors.textPrimary }]}>
                        {selectedNotif.message}
                      </Text>
                    </View>

                    {/* Official Evidence Photo attached by LGU */}
                    {Boolean(
                      selectedNotif.metadata?.photoUrl ||
                        selectedNotif.photoUrl ||
                        selectedNotif.metadata?.lguEvidencePhoto ||
                        selectedNotif.metadata?.evidencePhoto
                    ) ? (
                      <View style={{ marginBottom: 16 }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                            marginBottom: 8,
                          }}
                        >
                          <MaterialCommunityIcons name="image-check" size={16} color="#10B981" />
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: '700',
                              color: '#10B981',
                              letterSpacing: 0.5,
                            }}
                          >
                            OFFICIAL VERIFIED EVIDENCE PHOTO
                          </Text>
                        </View>
                        <Image
                          source={{
                            uri: getMediaUrl(
                              selectedNotif.metadata?.photoUrl ||
                                selectedNotif.photoUrl ||
                                selectedNotif.metadata?.lguEvidencePhoto ||
                                selectedNotif.metadata?.evidencePhoto
                            ),
                          }}
                          style={{
                            width: '100%',
                            height: 200,
                            borderRadius: RADIUS.md,
                            backgroundColor: colors.border,
                          }}
                          resizeMode="cover"
                        />
                      </View>
                    ) : null}

                    {/* Transit Advisory Footer Notice */}
                    <View style={styles.footerNoticeRow}>
                      <MaterialCommunityIcons
                        name="information-outline"
                        size={15}
                        color={colors.textMuted}
                      />
                      <Text style={[styles.footerNoticeText, { color: colors.textMuted }]}>
                        Official SmartSakay notification verified by {selectedNotif?.municipality || activeMuni} Transport Authority.
                      </Text>
                    </View>
                  </ScrollView>

                  {/* Modal Action Footer */}
                  <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                    <TouchableOpacity
                      style={[
                        styles.deleteActionBtn,
                        {
                          backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
                          borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : '#FECACA',
                        },
                      ]}
                      onPress={() => handleDeleteNotification(selectedNotif)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name="trash-can-outline"
                        size={17}
                        color="#EF4444"
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.deleteActionText}>Delete</Text>
                    </TouchableOpacity>

                    {cfg.actionScreen ? (
                      <TouchableOpacity
                        style={[styles.primaryActionBtn, { backgroundColor: cfg.color }]}
                        onPress={() => handleActionNavigation(cfg)}
                      >
                        <MaterialCommunityIcons
                          name="open-in-app"
                          size={18}
                          color="#FFFFFF"
                          style={{ marginRight: 6 }}
                        />
                        <Text style={styles.primaryActionText}>{cfg.actionText}</Text>
                      </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity
                      style={[
                        styles.secondaryCloseBtn,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
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
      })() : null}

      {/* Universal In-App Confirmation Modal */}
      <ConfirmDialogModal
        visible={confirmModalConfig.visible}
        onClose={() => setConfirmModalConfig((prev) => ({ ...prev, visible: false }))}
        onConfirm={confirmModalConfig.onConfirm}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmText={confirmModalConfig.confirmText}
        cancelText={confirmModalConfig.cancelText}
        type={confirmModalConfig.type}
        icon={confirmModalConfig.icon}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  title: { fontSize: FONTS.sizes.xl, fontWeight: '800' },
  subtitle: { fontSize: FONTS.sizes.xs, marginTop: 2 },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    minHeight: 34,
  },
  headerActionText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
  },

  // Category Tabs Filter Bar
  categoryContainer: {
    marginVertical: SPACING.sm,
  },
  categoryScroll: {
    paddingHorizontal: SPACING.lg,
    gap: 8,
    paddingBottom: 2,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    minHeight: 38,
  },
  tabChipText: {
    fontSize: 12,
  },
  tabBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    fontSize: 10,
  },
  tabUnreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 4,
  },

  // Notification Cards
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
    paddingTop: SPACING.xs,
  },
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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    flexWrap: 'wrap',
    gap: 4,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  categoryTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  subTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  subTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
  },
  notifTime: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '500',
    marginLeft: 'auto',
  },
  notifTitle: {
    fontSize: FONTS.sizes.md,
    marginBottom: 3,
    lineHeight: 20,
  },
  notifMsg: {
    fontSize: FONTS.sizes.sm,
    lineHeight: 18,
  },
  viewFullRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 6,
  },
  viewFullText: {
    fontSize: 11,
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },

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
    paddingVertical: 12,
    minHeight: 48,
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
    paddingVertical: 12,
    minHeight: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryCloseText: {
    fontWeight: '600',
    fontSize: FONTS.sizes.sm,
  },
  cardDeleteBtn: {
    padding: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTrashBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  deleteActionText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: FONTS.sizes.sm,
  },
});

export default NotificationsScreen;
