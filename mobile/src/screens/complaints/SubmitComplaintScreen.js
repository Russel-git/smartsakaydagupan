import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Alert, 
  Platform 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFeedback } from '../../contexts/FeedbackContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
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
  const [selectedImage, setSelectedImage] = useState(null);
  const [todayCount, setTodayCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    routesAPI.getAllRoutes().then(({ data }) => setRoutes(data.data || [])).catch(() => {});

    if (!isGuest) {
      complaintsAPI.getMyComplaints().then(({ data }) => {
        const list = data.data || [];
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const count = list.filter((c) => new Date(c.createdAt) >= startOfDay && c.status !== 'deleted').length;
        setTodayCount(count);
      }).catch(() => {});
    }
  }, [isGuest]);

  const updateField = (key, val) => { 
    setForm((p) => ({ ...p, [key]: val })); 
    setErrors({}); 
  };

  const handlePickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showWarning('Permission Needed', 'Access to photos is required to attach evidence.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0]);
      }
    } catch (e) {
      showError('Error', 'Could not open photo gallery.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showWarning('Permission Needed', 'Camera access is required to take an evidence photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0]);
      }
    } catch (e) {
      showError('Error', 'Could not access device camera.');
    }
  };

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

    if (todayCount >= 5) {
      showWarning(
        'Daily Limit Reached',
        'You have reached your limit of 5 reports for today. Please wait until tomorrow to submit additional grievances.'
      );
      return;
    }

    if (!validate()) {
      showWarning('Incomplete Fields', 'Please complete all required fields before submitting.');
      return;
    }

    setLoading(true);
    try {
      let attachments = [];

      // Upload photo evidence if attached
      if (selectedImage) {
        const formData = new FormData();
        const uri = selectedImage.uri;
        const uriParts = uri.split('/');
        const fileName = uriParts[uriParts.length - 1] || 'evidence.jpg';
        const match = /\.(\w+)$/.exec(fileName);
        const fileType = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('photo', {
          uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
          name: fileName,
          type: fileType,
        });

        const uploadRes = await complaintsAPI.uploadPhoto(formData);
        if (uploadRes.data?.data?.url) {
          attachments.push(uploadRes.data.data.url);
        }
      }

      await complaintsAPI.createComplaint({
        ...form,
        routeId: form.routeId || undefined,
        attachments,
      });

      showSuccess(
        'Complaint Submitted!',
        'Your report has been received and queued for investigation by Dagupan transit authorities.'
      );
      navigation.goBack();
    } catch (e) {
      showError('Submission Failed', e.response?.data?.message || 'Failed to submit complaint.');
    } finally {
      setLoading(false);
    }
  };

  const isLimitReached = todayCount >= 5;

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
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]} 
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Report a Grievance</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Help us improve commuter transit services in Dagupan
              </Text>
            </View>

            {/* Daily limit badge */}
            {!isGuest && (
              <View 
                style={[
                  styles.limitBadge, 
                  { 
                    backgroundColor: isLimitReached ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                    borderColor: isLimitReached ? '#ef4444' : '#38bdf8',
                  }
                ]}
              >
                <MaterialCommunityIcons 
                  name={isLimitReached ? "alert-circle" : "counter"} 
                  size={14} 
                  color={isLimitReached ? '#ef4444' : '#38bdf8'} 
                />
                <Text style={{ fontSize: 11, fontWeight: '700', color: isLimitReached ? '#ef4444' : '#38bdf8' }}>
                  {todayCount}/5 Today
                </Text>
              </View>
            )}
          </View>

          {isLimitReached && (
            <View style={[styles.limitWarningBox, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
              <MaterialCommunityIcons name="shield-alert" size={20} color="#ef4444" />
              <Text style={{ color: '#ef4444', fontSize: FONTS.sizes.xs, flex: 1, lineHeight: 18 }}>
                You have reached your daily quota of 5 complaint reports. To prevent spamming, report submissions will unlock again tomorrow.
              </Text>
            </View>
          )}

          {/* Category Selection */}
          <Text style={[styles.label, { color: colors.textPrimary }]}>Violation Category *</Text>
          {Boolean(errors.category) ? <Text style={[styles.error, { color: colors.error }]}>{errors.category}</Text> : null}
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

          <Input 
            label="Subject *" 
            placeholder="Brief summary of your complaint"
            value={form.subject} 
            onChangeText={(t) => updateField('subject', t)} 
            error={errors.subject} 
            leftIcon="text-short" 
          />

          <Input 
            label="Description *" 
            placeholder="Describe what happened in detail..."
            value={form.description} 
            onChangeText={(t) => updateField('description', t)} 
            error={errors.description}
            leftIcon="text" 
            multiline 
            numberOfLines={4} 
          />

          {/* Photo Evidence Picker */}
          <Text style={[styles.label, { color: colors.textPrimary, marginTop: SPACING.md }]}>
            Photo Evidence (Optional)
          </Text>
          <Text style={[styles.photoHelper, { color: colors.textSecondary }]}>
            Clear photos of vehicle plate numbers, fares, or incidents significantly speed up LGU investigations.
          </Text>

          {selectedImage ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
              <TouchableOpacity 
                style={styles.removeImageBtn} 
                onPress={() => setSelectedImage(null)}
              >
                <MaterialCommunityIcons name="close" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoActionRow}>
              <TouchableOpacity
                style={[styles.photoBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={handleTakePhoto}
              >
                <MaterialCommunityIcons name="camera" size={20} color={colors.primary} />
                <Text style={[styles.photoBtnText, { color: colors.textPrimary }]}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.photoBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={handlePickFromGallery}
              >
                <MaterialCommunityIcons name="image" size={20} color={colors.primary} />
                <Text style={[styles.photoBtnText, { color: colors.textPrimary }]}>Photo Gallery</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Optional Route Selection */}
          <Text style={[styles.label, { color: colors.textPrimary, marginTop: SPACING.lg }]}>Route (Optional)</Text>
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

          <Input 
            label="Vehicle Plate Number (Optional)" 
            placeholder="e.g., ABC 1234"
            value={form.vehiclePlateNumber} 
            onChangeText={(t) => updateField('vehiclePlateNumber', t)}
            leftIcon="car" 
            autoCapitalize="characters" 
          />

          <Button 
            title={isLimitReached ? "Daily Limit Reached (5/5)" : "Submit Complaint"} 
            onPress={handleSubmit} 
            loading={loading} 
            disabled={isLimitReached}
            size="lg" 
            style={[styles.submitBtn, isLimitReached && { opacity: 0.6 }]} 
          />
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.xl },
  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  title: { fontSize: FONTS.sizes.xl, fontWeight: '800' },
  subtitle: { fontSize: FONTS.sizes.xs, marginTop: SPACING.xs },
  limitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    marginLeft: 8,
  },
  limitWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
  },
  label: { fontSize: FONTS.sizes.sm, fontWeight: '600', marginBottom: SPACING.sm },
  photoHelper: { fontSize: FONTS.sizes.xs, marginBottom: SPACING.md, lineHeight: 18 },
  error: { fontSize: FONTS.sizes.xs, marginBottom: SPACING.sm },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  categoryChip: { width: '31%', padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1.5, alignItems: 'center', gap: SPACING.xs },
  photoActionRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.lg },
  photoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  photoBtnText: { fontSize: FONTS.sizes.sm, fontWeight: '600' },
  previewContainer: {
    position: 'relative',
    width: 140,
    height: 140,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: SPACING.lg,
  },
  previewImage: { width: '100%', height: '100%', objectFit: 'cover' },
  removeImageBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: RADIUS.full,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeScroll: { marginBottom: SPACING.lg },
  routeChip: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, borderWidth: 1, marginRight: SPACING.sm },
  submitBtn: { marginTop: SPACING.lg },
});

export default SubmitComplaintScreen;
