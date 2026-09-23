import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFeedback } from '../../contexts/FeedbackContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Card } from '../../components/common/SharedComponents';
import AuthPromptModal from '../../components/common/AuthPromptModal';
import { complaintsAPI, routesAPI } from '../../api/services';
import { FONTS, SPACING, RADIUS, COMPLAINT_CATEGORIES } from '../../utils/constants';

const SubmitComplaintScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { isGuest } = useAuth();
  const { showSuccess, showError, showWarning } = useFeedback();
  const [promptVisible, setPromptVisible] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [form, setForm] = useState({ category: '', subject: '', description: '', routeId: '', vehiclePlateNumber: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    routesAPI.getAllRoutes().then(({ data }) => setRoutes(data.data || [])).catch(() => {});
  }, []);

  const updateField = (key, val) => { setForm((p) => ({ ...p, [key]: val })); setErrors({}); };

  const validate = () => {
    const e = {};
    if (!form.category) e.category = 'Select a category';
    if (!form.subject.trim()) e.subject = 'Subject is required';
    if (!form.description.trim()) e.description = 'Description is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (isGuest) {
      setPromptVisible(true);
      return;
    }
    if (!validate()) {
      showWarning('Incomplete Fields', 'Please complete all required fields before submitting.');
      return;
    }
    setLoading(true);
    try {
      await complaintsAPI.createComplaint({
        ...form,
        routeId: form.routeId || undefined,
      });
      showSuccess(
        'Complaint Submitted!',
        'Your report has been queued for investigation by Dagupan transit authorities.'
      );
      navigation.goBack();
    } catch (e) {
      showError('Submission Failed', e.response?.data?.message || 'Failed to submit complaint.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthPromptModal
        visible={promptVisible}
        onClose={() => setPromptVisible(false)}
        title="Account Required to Report"
        message="Dagupan transport authorities require verified commuter credentials to investigate grievances and provide resolution status updates."
        icon="clipboard-alert"
        featureTag="Verified Report"
      />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Report a Complaint</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Help us improve commuter services in Dagupan
        </Text>

        {/* Category Selection */}
        <Text style={[styles.label, { color: colors.textPrimary }]}>Category *</Text>
        {errors.category && <Text style={[styles.error, { color: colors.error }]}>{errors.category}</Text>}
        <View style={styles.categoryGrid}>
          {COMPLAINT_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: form.category === cat.value ? colors.primary + '15' : colors.surface,
                  borderColor: form.category === cat.value ? colors.primary : colors.border,
                },
              ]}
              onPress={() => updateField('category', cat.value)}
            >
              <MaterialCommunityIcons
                name={cat.icon}
                size={22}
                color={form.category === cat.value ? colors.primary : colors.textMuted}
              />
              <Text style={{
                color: form.category === cat.value ? colors.primary : colors.textPrimary,
                fontSize: FONTS.sizes.xs, fontWeight: '600', textAlign: 'center',
              }}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input label="Subject *" placeholder="Brief summary of your complaint"
          value={form.subject} onChangeText={(t) => updateField('subject', t)} error={errors.subject} leftIcon="text-short" />

        <Input label="Description *" placeholder="Describe what happened in detail..."
          value={form.description} onChangeText={(t) => updateField('description', t)} error={errors.description}
          leftIcon="text" multiline numberOfLines={4} />

        {/* Optional Route */}
        <Text style={[styles.label, { color: colors.textPrimary }]}>Route (Optional)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.routeScroll}>
          <TouchableOpacity
            style={[styles.routeChip, { backgroundColor: !form.routeId ? colors.primary : colors.surface, borderColor: colors.border }]}
            onPress={() => updateField('routeId', '')}
          >
            <Text style={{ color: !form.routeId ? '#FFFFFF' : colors.textPrimary, fontSize: FONTS.sizes.sm }}>None</Text>
          </TouchableOpacity>
          {routes.map((r) => (
            <TouchableOpacity
              key={r._id}
              style={[styles.routeChip, { backgroundColor: form.routeId === r._id ? colors.primary : colors.surface, borderColor: colors.border }]}
              onPress={() => updateField('routeId', r._id)}
            >
              <Text style={{ color: form.routeId === r._id ? '#FFFFFF' : colors.textPrimary, fontSize: FONTS.sizes.sm }}>{r.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Input label="Vehicle Plate Number (Optional)" placeholder="e.g., ABC 1234"
          value={form.vehiclePlateNumber} onChangeText={(t) => updateField('vehiclePlateNumber', t)}
          leftIcon="car" autoCapitalize="characters" />

        <Button title="Submit Complaint" onPress={handleSubmit} loading={loading} size="lg" style={styles.submitBtn} />
      </View>
    </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.xxl },
  title: { fontSize: FONTS.sizes.xxl, fontWeight: '800' },
  subtitle: { fontSize: FONTS.sizes.sm, marginTop: SPACING.xs, marginBottom: SPACING.xxl },
  label: { fontSize: FONTS.sizes.sm, fontWeight: '600', marginBottom: SPACING.sm },
  error: { fontSize: FONTS.sizes.xs, marginBottom: SPACING.sm },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.xxl },
  categoryChip: { width: '31%', padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1.5, alignItems: 'center', gap: SPACING.xs },
  routeScroll: { marginBottom: SPACING.lg },
  routeChip: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, borderWidth: 1, marginRight: SPACING.sm },
  submitBtn: { marginTop: SPACING.md },
});

export default SubmitComplaintScreen;
