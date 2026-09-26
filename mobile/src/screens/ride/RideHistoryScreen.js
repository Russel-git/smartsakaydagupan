import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useFeedback } from '../../contexts/FeedbackContext';
import { Card } from '../../components/common/SharedComponents';
import ConfirmDialogModal from '../../components/common/ConfirmDialogModal';
import { getRideHistory, clearRideHistory } from '../../utils/storage';
import { FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/constants';
import { formatPeso } from '../../utils/helpers';

const RideHistoryScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { showSuccess, showInfo } = useFeedback();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clearModalVisible, setClearModalVisible] = useState(false);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await getRideHistory();
      setHistory(data || []);
    } catch (e) {
      console.warn('Error loading history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleClear = async () => {
    await clearRideHistory();
    setHistory([]);
    setClearModalVisible(false);
    showSuccess('History Cleared', 'Your ride history has been emptied.');
  };

  const renderRideItem = ({ item }) => {
    const isTricycle = item.vehicleType === 'tricycle';
    const dateStr = item.timestamp
      ? new Date(item.timestamp).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Recent Trip';

    return (
      <Card style={[styles.rideCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.rideCardHeader}>
          <View style={styles.vehicleBadgeRow}>
            <View
              style={[
                styles.vehicleIconCircle,
                { backgroundColor: isTricycle ? '#F59E0B20' : colors.primary + '20' },
              ]}
            >
              <MaterialCommunityIcons
                name={isTricycle ? 'moped' : 'van-passenger'}
                size={20}
                color={isTricycle ? '#D97706' : colors.primary}
              />
            </View>
            <View>
              <Text style={[styles.vehicleTypeLabel, { color: isTricycle ? '#D97706' : colors.primary }]}>
                {isTricycle ? 'TRICYCLE PINPOINT' : item.vehicleType === 'modern' ? 'MODERN PUJ' : 'JEEPNEY ROUTE'}
              </Text>
              <Text style={[styles.rideTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {item.routeName || item.destination || 'Dagupan Trip'}
              </Text>
            </View>
          </View>
          <View style={styles.fareContainer}>
            <Text style={[styles.fareAmount, { color: colors.primary }]}>
              {formatPeso(item.fare || 0)}
            </Text>
            {item.discount === 'discounted' && (
              <Text style={styles.discountBadge}>20% DISC</Text>
            )}
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.rideMetaRow}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="map-marker-distance" size={14} color={colors.textMuted} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {(item.distanceKm || 0).toFixed(1)} km
            </Text>
          </View>

          {Boolean(item.durationSecs) && (
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {Math.max(1, Math.round(item.durationSecs / 60))} mins
              </Text>
            </View>
          )}

          <View style={[styles.metaItem, { marginLeft: 'auto' }]}>
            <MaterialCommunityIcons name="calendar-outline" size={14} color={colors.textMuted} />
            <Text style={[styles.metaDate, { color: colors.textMuted }]}>{dateStr}</Text>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ConfirmDialogModal
        visible={clearModalVisible}
        title="Clear Ride History"
        message="Are you sure you want to delete all past ride records and receipts? This action cannot be undone."
        confirmText="Clear History"
        cancelText="Cancel"
        type="danger"
        icon="trash-can-outline"
        onConfirm={handleClear}
        onCancel={() => setClearModalVisible(false)}
      />

      {/* Header bar */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="history" size={24} color={colors.primary} />
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Ride History</Text>
          {history.length > 0 && (
            <View style={[styles.countBadge, { backgroundColor: colors.primary + '18' }]}>
              <Text style={[styles.countBadgeText, { color: colors.primary }]}>{history.length}</Text>
            </View>
          )}
        </View>

        {history.length > 0 && (
          <TouchableOpacity
            style={[styles.clearBtn, { backgroundColor: '#EF444415' }]}
            onPress={() => setClearModalVisible(true)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={16} color="#DC2626" />
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {history.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="history" size={64} color={colors.textMuted} style={{ opacity: 0.5 }} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Rides Yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            When you complete a Tricycle or Jeepney ride, your official fares, distances, and receipts will be saved here automatically.
          </Text>
          <TouchableOpacity
            style={[styles.exploreBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('RoutesAndFaresMain')}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="map-search" size={18} color="#FFFFFF" />
            <Text style={styles.exploreBtnText}>Find a Ride</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item, index) => item.id || `ride-${index}`}
          renderItem={renderRideItem}
          contentContainerStyle={{ padding: SPACING.md, paddingBottom: SPACING.xxl }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadHistory} colors={[colors.primary]} />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '800',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  rideCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  rideCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  vehicleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  vehicleIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleTypeLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  rideTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    marginTop: 2,
  },
  fareContainer: {
    alignItems: 'flex-end',
  },
  fareAmount: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '900',
  },
  discountBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
    backgroundColor: '#10B98118',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  rideMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaDate: {
    fontSize: 11,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  emptyTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '800',
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    fontSize: FONTS.sizes.sm,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    maxWidth: 280,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.lg,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
  },
});

export default RideHistoryScreen;
