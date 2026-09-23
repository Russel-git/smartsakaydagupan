import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Card, LoadingSpinner } from '../../components/common/SharedComponents';
import { adminAPI } from '../../api/services';
import { FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/constants';

const AdminPanelScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      const { data } = await adminAPI.getStats();
      setStats(data.data);
    } catch (e) { /* */ }
    setLoading(false);
  };

  useEffect(() => { loadStats(); }, []);

  const onRefresh = async () => { setRefreshing(true); await loadStats(); setRefreshing(false); };

  const adminActions = [
    { icon: 'cash-multiple', label: 'Manage Fares', screen: 'ManageFares', color: '#F59E0B', bg: '#FEF3C7' },
    { icon: 'clipboard-list', label: 'View Complaints', screen: 'AdminComplaints', color: '#EF4444', bg: '#FEE2E2' },
    { icon: 'bell-ring', label: 'Send Notification', screen: 'SendNotification', color: '#3B82F6', bg: '#DBEAFE' },
  ];

  if (loading) return <LoadingSpinner text="Loading admin data..." />;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      <View style={[styles.header, { backgroundColor: colors.secondary }]}>
        <MaterialCommunityIcons name="shield-crown" size={32} color="#0F172A" />
        <Text style={styles.headerTitle}>Admin Panel</Text>
      </View>

      <View style={styles.content}>
        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Users', value: stats?.totalUsers || 0, icon: 'account-group', color: '#3B82F6' },
            { label: 'Complaints', value: stats?.totalComplaints || 0, icon: 'clipboard-text', color: '#EF4444' },
            { label: 'Pending', value: stats?.pendingComplaints || 0, icon: 'clock-alert', color: '#F59E0B' },
          ].map((s, i) => (
            <Card key={i} style={styles.statCard}>
              <MaterialCommunityIcons name={s.icon} size={24} color={s.color} />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{s.label}</Text>
            </Card>
          ))}
        </View>

        {/* Actions */}
        {adminActions.map((action, i) => (
          <TouchableOpacity key={i} onPress={() => navigation.navigate(action.screen)}>
            <Card style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: action.bg }]}>
                <MaterialCommunityIcons name={action.icon} size={24} color={action.color} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>{action.label}</Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
            </Card>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingTop: 50, paddingBottom: SPACING.xxl, gap: SPACING.sm, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: '#0F172A' },
  content: { padding: SPACING.xl },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: SPACING.lg },
  statValue: { fontSize: FONTS.sizes.xxl, fontWeight: '800', marginTop: SPACING.xs },
  statLabel: { fontSize: FONTS.sizes.xs, marginTop: 2 },
  actionCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  actionIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { flex: 1, fontSize: FONTS.sizes.md, fontWeight: '600' },
});

export default AdminPanelScreen;
