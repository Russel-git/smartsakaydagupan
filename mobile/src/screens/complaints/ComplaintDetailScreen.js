import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Card, StatusBadge, Divider } from '../../components/common/SharedComponents';
import { FONTS, SPACING, COMPLAINT_STATUS, COMPLAINT_CATEGORIES } from '../../utils/constants';
import { formatDateTime } from '../../utils/helpers';

const ComplaintDetailScreen = ({ route: navRoute }) => {
  const complaint = navRoute.params?.complaint;
  const { colors } = useTheme();
  if (!complaint) return null;

  const status = COMPLAINT_STATUS[complaint.status];
  const cat = COMPLAINT_CATEGORIES.find((c) => c.value === complaint.category);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <StatusBadge label={status?.label || complaint.status} color={status?.color} bgColor={status?.bgColor} />
        <Text style={[styles.subject, { color: colors.textPrimary }]}>{complaint.subject}</Text>
        <Text style={[styles.meta, { color: colors.textMuted }]}>
          {cat?.label} • Submitted {formatDateTime(complaint.createdAt)}
        </Text>

        <Divider />

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Description</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>{complaint.description}</Text>

        {complaint.vehiclePlateNumber && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Vehicle Plate</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>{complaint.vehiclePlateNumber}</Text>
          </>
        )}

        {complaint.adminNotes && (
          <Card style={{ backgroundColor: colors.info + '10', borderColor: colors.info }}>
            <Text style={[styles.sectionTitle, { color: colors.info }]}>Admin Notes</Text>
            <Text style={[styles.description, { color: colors.textPrimary }]}>{complaint.adminNotes}</Text>
          </Card>
        )}

        {complaint.resolvedAt && (
          <Text style={[styles.meta, { color: colors.textMuted, marginTop: SPACING.md }]}>
            Resolved on {formatDateTime(complaint.resolvedAt)}
          </Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.xxl },
  subject: { fontSize: FONTS.sizes.xxl, fontWeight: '800', marginTop: SPACING.md },
  meta: { fontSize: FONTS.sizes.sm, marginTop: SPACING.xs },
  sectionTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', marginBottom: SPACING.sm, marginTop: SPACING.md },
  description: { fontSize: FONTS.sizes.md, lineHeight: 24 },
});

export default ComplaintDetailScreen;
