import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Card, LoadingSpinner, EmptyState, StatusBadge } from '../../components/common/SharedComponents';
import { complaintsAPI } from '../../api/services';
import { FONTS, SPACING, RADIUS } from '../../utils/constants';
import { COMPLAINT_STATUS, COMPLAINT_CATEGORIES } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';

const ComplaintsListScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadComplaints = async () => {
    try {
      const { data } = await complaintsAPI.getMyComplaints();
      setComplaints(data.data || []);
    } catch (e) { /* */ }
    setLoading(false);
  };

  useEffect(() => { loadComplaints(); }, []);

  const onRefresh = async () => { setRefreshing(true); await loadComplaints(); setRefreshing(false); };

  if (loading) return <LoadingSpinner text="Loading complaints..." />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>My Complaints</Text>
        <TouchableOpacity
          style={[styles.newBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('SubmitComplaint')}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
          <Text style={styles.newBtnText}>Report</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={complaints}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState icon="clipboard-text-outline" title="No complaints yet" message="Your complaint history will appear here" />
        }
        renderItem={({ item }) => {
          const status = COMPLAINT_STATUS[item.status];
          const cat = COMPLAINT_CATEGORIES.find((c) => c.value === item.category);
          return (
            <TouchableOpacity onPress={() => navigation.navigate('ComplaintDetail', { complaint: item })}>
              <Card>
                <View style={styles.cardHeader}>
                  <StatusBadge label={status?.label || item.status} color={status?.color} bgColor={status?.bgColor} />
                  <Text style={[styles.dateText, { color: colors.textMuted }]}>{formatDate(item.createdAt)}</Text>
                </View>
                <Text style={[styles.subject, { color: colors.textPrimary }]}>{item.subject}</Text>
                <View style={styles.catRow}>
                  <MaterialCommunityIcons name={cat?.icon || 'help-circle'} size={16} color={colors.textSecondary} />
                  <Text style={[styles.catText, { color: colors.textSecondary }]}>{cat?.label || item.category}</Text>
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.xl, paddingTop: SPACING.lg },
  title: { fontSize: FONTS.sizes.xxl, fontWeight: '800' },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.full },
  newBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: FONTS.sizes.sm },
  listContent: { padding: SPACING.xl, paddingTop: 0 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  dateText: { fontSize: FONTS.sizes.xs },
  subject: { fontSize: FONTS.sizes.md, fontWeight: '600', marginBottom: SPACING.sm },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  catText: { fontSize: FONTS.sizes.sm },
});

export default ComplaintsListScreen;
