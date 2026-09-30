import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useFeedback } from '../../contexts/FeedbackContext';
import { complaintsAPI, routesAPI } from '../../api/services';
import { FONTS, SPACING, RADIUS, SHADOWS, COMPLAINT_CATEGORIES } from '../../utils/constants';

const EditComplaintModal = ({ visible, complaint, onClose, onSuccess }) => {
  const { colors, isDark } = useTheme();
  const { showSuccess, showError, showWarning } = useFeedback();

  const [form, setForm] = useState({
    category: '',
    subject: '',
    description: '',
    vehiclePlateNumber: '',
    routeId: '',
  });
  const [routes, setRoutes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (visible && complaint) {
      setForm({
        category: complaint.category || '',
        subject: complaint.subject || '',
        description: complaint.description || '',
        vehiclePlateNumber: complaint.vehiclePlateNumber || '',
        routeId: complaint.routeId?._id || complaint.routeId || '',
      });
      setErrors({});

      // Fetch active routes
      routesAPI
        .getAllRoutes()
        .then(({ data }) => setRoutes(data.data || []))
        .catch(() => {});
    }
  }, [visible, complaint]);

  if (!visible || !complaint) return null;

  // Strict check according to user requirements:
  // "they can edit it if the case is on In Progress"
  // "they cannot edit their reports once it is in archive, or deleted"
  const isEditable =
    !complaint.isArchived &&
    complaint.status !== 'deleted' &&
    ['pending', 'under_review'].includes(complaint.status);

  const updateField = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.category) e.category = 'Select a violation category';
    if (!form.subject.trim()) e.subject = 'Subject is required';
    if (!form.description.trim()) e.description = 'Description is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!isEditable) {
      showWarning('Cannot Edit', 'This report cannot be edited because it is not In Progress, or has been archived/deleted.');
      return;
    }

    if (!validate()) {
      showWarning('Missing Fields', 'Please complete all required fields.');
      return;
    }

    setSaving(true);
    try {
      const { data } = await complaintsAPI.updateMyComplaint(complaint._id, {
        category: form.category,
        subject: form.subject.trim(),
        description: form.description.trim(),
        vehiclePlateNumber: form.vehiclePlateNumber.trim(),
        routeId: form.routeId || undefined,
      });

      showSuccess('Report Updated', 'Your corrections have been updated in the Dagupan LGU system.');
      if (onSuccess) onSuccess(data.data || data);
      onClose();
    } catch (err) {
      showError('Update Failed', err.response?.data?.message || 'Could not update report.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="pencil-box-outline" size={22} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Edit Grievance Report</Text>
              </View>
              <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                {complaint.lguCaseNumber || `Ref #${complaint._id.slice(-6).toUpperCase()}`} • In Progress
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {!isEditable ? (
            <View style={styles.notEditableBanner}>
              <MaterialCommunityIcons name="lock-outline" size={20} color="#EF4444" />
              <Text style={styles.notEditableText}>
                Reports cannot be edited once archived, deleted, or escalated past In Progress.
              </Text>
            </View>
          ) : (
            <View style={styles.infoBanner}>
              <MaterialCommunityIcons name="information" size={18} color="#0284C7" />
              <Text style={styles.infoBannerText}>
                You can correct mistake details before Dagupan LGU takes final action.
              </Text>
            </View>
          )}

          <ScrollView style={styles.formScroll} keyboardShouldPersistTaps="handled">
            {/* Category selection */}
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
              Violation Category <Text style={styles.requiredMark}>*</Text>
            </Text>
            <View style={styles.catGrid}>
              {COMPLAINT_CATEGORIES.map((c) => {
                const isSelected = form.category === c.value;
                return (
                  <TouchableOpacity
                    key={c.value}
                    style={[
                      styles.catChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.background,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => isEditable && updateField('category', c.value)}
                    activeOpacity={0.8}
                    disabled={!isEditable}
                  >
                    <MaterialCommunityIcons
                      name={c.icon}
                      size={15}
                      color={isSelected ? '#FFFFFF' : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.catChipText,
                        { color: isSelected ? '#FFFFFF' : colors.textSecondary, fontWeight: isSelected ? '700' : '500' },
                      ]}
                    >
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {Boolean(errors.category) && <Text style={styles.errorText}>{errors.category}</Text>}

            {/* Subject */}
            <Text style={[styles.inputLabel, { color: colors.textPrimary, marginTop: 14 }]}>
              Subject / Brief Summary <Text style={styles.requiredMark}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.background,
                  borderColor: errors.subject ? '#EF4444' : colors.border,
                  color: colors.textPrimary,
                },
              ]}
              value={form.subject}
              onChangeText={(text) => updateField('subject', text)}
              placeholder="e.g. Overcharged ₱50 on Perez Blvd route"
              placeholderTextColor={colors.textMuted}
              editable={isEditable}
            />
            {Boolean(errors.subject) && <Text style={styles.errorText}>{errors.subject}</Text>}

            {/* Plate Number */}
            <Text style={[styles.inputLabel, { color: colors.textPrimary, marginTop: 14 }]}>
              Vehicle Plate / Body Number
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                  fontFamily: 'monospace',
                },
              ]}
              value={form.vehiclePlateNumber}
              onChangeText={(text) => updateField('vehiclePlateNumber', text.toUpperCase())}
              placeholder="e.g. ABC 1234 or Dagupan Solo Ride #421"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              editable={isEditable}
            />

            {/* Route */}
            {routes.length > 0 && (
              <>
                <Text style={[styles.inputLabel, { color: colors.textPrimary, marginTop: 14 }]}>
                  Transit Route
                </Text>
                <View style={styles.routePillsRow}>
                  {routes.slice(0, 6).map((r) => {
                    const isSelected = form.routeId === r._id;
                    return (
                      <TouchableOpacity
                        key={r._id}
                        style={[
                          styles.routePill,
                          {
                            backgroundColor: isSelected ? 'rgba(2, 132, 199, 0.15)' : colors.background,
                            borderColor: isSelected ? '#0284C7' : colors.border,
                          },
                        ]}
                        onPress={() => isEditable && updateField('routeId', isSelected ? '' : r._id)}
                        disabled={!isEditable}
                      >
                        <Text
                          style={[
                            styles.routePillText,
                            { color: isSelected ? '#0284C7' : colors.textSecondary, fontWeight: isSelected ? '700' : '500' },
                          ]}
                        >
                          {r.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* Description */}
            <Text style={[styles.inputLabel, { color: colors.textPrimary, marginTop: 14 }]}>
              Detailed Description <Text style={styles.requiredMark}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.background,
                  borderColor: errors.description ? '#EF4444' : colors.border,
                  color: colors.textPrimary,
                },
              ]}
              value={form.description}
              onChangeText={(text) => updateField('description', text)}
              placeholder="Provide complete incident details, time, landmarks..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={isEditable}
            />
            {Boolean(errors.description) && <Text style={styles.errorText}>{errors.description}</Text>}
          </ScrollView>

          {/* Footer Actions */}
          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={saving}>
              <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: isEditable ? colors.primary : '#94A3B8' },
              ]}
              onPress={handleSave}
              disabled={saving || !isEditable}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="content-save-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>Save Corrections</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '90%',
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
    paddingBottom: 24,
    ...SHADOWS.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  modalTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.sm,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    borderColor: 'rgba(2, 132, 199, 0.25)',
    borderWidth: 1,
    padding: 10,
    borderRadius: RADIUS.md,
  },
  infoBannerText: {
    fontSize: 11,
    color: '#0284C7',
    flex: 1,
    fontWeight: '500',
  },
  notEditableBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.sm,
    backgroundColor: '#FEF2F2',
    borderColor: '#F87171',
    borderWidth: 1,
    padding: 10,
    borderRadius: RADIUS.md,
  },
  notEditableText: {
    fontSize: 11,
    color: '#B91C1C',
    flex: 1,
    fontWeight: '600',
  },
  formScroll: {
    paddingHorizontal: SPACING.xl,
    maxHeight: 420,
  },
  inputLabel: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  requiredMark: {
    color: '#EF4444',
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 38,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  catChipText: {
    fontSize: 11,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 46,
    fontSize: FONTS.sizes.sm,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: FONTS.sizes.sm,
    minHeight: 90,
  },
  routePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  routePill: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 32,
    justifyContent: 'center',
  },
  routePillText: {
    fontSize: 11,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 11,
    marginTop: 3,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: SPACING.md,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 46,
    borderRadius: RADIUS.md,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: FONTS.sizes.sm,
  },
});

export default EditComplaintModal;
