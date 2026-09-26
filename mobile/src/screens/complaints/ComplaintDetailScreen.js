import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Card, StatusBadge, Divider } from '../../components/common/SharedComponents';
import { FONTS, SPACING, RADIUS, COMPLAINT_STATUS, COMPLAINT_CATEGORIES } from '../../utils/constants';
import { formatDateTime } from '../../utils/helpers';

const ComplaintDetailScreen = ({ route: navRoute }) => {
  const complaint = navRoute.params?.complaint;
  const { colors } = useTheme();
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  if (!complaint) return null;

  const status = COMPLAINT_STATUS[complaint.status];
  const cat = COMPLAINT_CATEGORIES.find((c) => c.value === complaint.category);
  const hasPhotos = complaint.attachments && complaint.attachments.length > 0;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.content}>
        <StatusBadge label={status?.label || complaint.status} color={status?.color} bgColor={status?.bgColor} />
        <Text style={[styles.subject, { color: colors.textPrimary }]}>{complaint.subject}</Text>
        <Text style={[styles.meta, { color: colors.textMuted }]}>
          {cat?.label} • Submitted {formatDateTime(complaint.createdAt)}
        </Text>

        {Boolean(complaint.lguCaseNumber) ? (
          <View style={[styles.caseBadge, { backgroundColor: 'rgba(56, 189, 248, 0.12)', borderColor: 'rgba(56, 189, 248, 0.3)' }]}>
            <MaterialCommunityIcons name="shield-check" size={16} color="#38bdf8" />
            <Text style={{ fontSize: FONTS.sizes.xs, color: '#38bdf8', fontWeight: '700' }}>
              Dagupan LGU Case: {complaint.lguCaseNumber}
            </Text>
          </View>
        ) : null}

        <Divider />

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Grievance Details</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>{complaint.description}</Text>

        {Boolean(complaint.vehiclePlateNumber) ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Vehicle Plate Number</Text>
            <View style={[styles.plateBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="car" size={18} color="#fbbf24" />
              <Text style={styles.plateText}>{complaint.vehiclePlateNumber}</Text>
            </View>
          </>
        ) : null}

        {/* Evidence Photos */}
        {hasPhotos ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Attached Evidence</Text>
            <View style={styles.photosRow}>
              {complaint.attachments.map((url, i) => (
                <TouchableOpacity key={i} onPress={() => setSelectedPhoto(url)} activeOpacity={0.85}>
                  <Image source={{ uri: url }} style={styles.thumbnail} />
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : null}

        {/* Official LGU Action */}
        {Boolean(complaint.lguActionNotes) ? (
          <Card style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)', marginTop: SPACING.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <MaterialCommunityIcons name="police-badge" size={18} color="#10b981" />
              <Text style={[styles.sectionTitle, { color: '#10b981', margin: 0 }]}>Action Taken by LGU</Text>
            </View>
            <Text style={[styles.description, { color: colors.textPrimary }]}>{complaint.lguActionNotes}</Text>
          </Card>
        ) : null}

        {/* Termination Summary */}
        {Boolean(complaint.lguTerminationNotes) ? (
          <Card style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.3)', marginTop: SPACING.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <MaterialCommunityIcons name="check-circle" size={18} color="#a78bfa" />
              <Text style={[styles.sectionTitle, { color: '#a78bfa', margin: 0 }]}>Case Terminated & Resolved</Text>
            </View>
            <Text style={[styles.description, { color: colors.textPrimary }]}>{complaint.lguTerminationNotes}</Text>
          </Card>
        ) : null}

        {Boolean(complaint.adminNotes) && !complaint.lguActionNotes ? (
          <Card style={{ backgroundColor: colors.info + '10', borderColor: colors.info, marginTop: SPACING.md }}>
            <Text style={[styles.sectionTitle, { color: colors.info }]}>Operator Notes</Text>
            <Text style={[styles.description, { color: colors.textPrimary }]}>{complaint.adminNotes}</Text>
          </Card>
        ) : null}
      </View>

      {/* Full Photo Modal */}
      {selectedPhoto && (
        <Modal visible={true} transparent={true} animationType="fade" onRequestClose={() => setSelectedPhoto(null)}>
          <View style={styles.modalBackdrop}>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedPhoto(null)}>
              <MaterialCommunityIcons name="close-circle" size={32} color="#FFFFFF" />
            </TouchableOpacity>
            <Image source={{ uri: selectedPhoto }} style={styles.modalFullImage} resizeMode="contain" />
          </View>
        </Modal>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.xl },
  subject: { fontSize: FONTS.sizes.xl, fontWeight: '800', marginTop: SPACING.md },
  meta: { fontSize: FONTS.sizes.xs, marginTop: SPACING.xs },
  caseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginTop: SPACING.sm,
    alignSelf: 'flex-start',
  },
  sectionTitle: { fontSize: FONTS.sizes.sm, fontWeight: '700', marginBottom: SPACING.xs, marginTop: SPACING.md },
  description: { fontSize: FONTS.sizes.sm, lineHeight: 22 },
  plateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  plateText: { color: '#fbbf24', fontWeight: '800', fontFamily: 'monospace', fontSize: 14 },
  photosRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 4 },
  thumbnail: { width: 90, height: 90, borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.92)', justifyContent: 'center', alignItems: 'center' },
  modalCloseBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  modalFullImage: { width: '92%', height: '80%' },
});

export default ComplaintDetailScreen;
