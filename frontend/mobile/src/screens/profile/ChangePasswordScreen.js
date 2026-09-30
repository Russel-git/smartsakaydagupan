import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useFeedback } from '../../contexts/FeedbackContext';
import { useAuth } from '../../contexts/AuthContext';
import { usersAPI } from '../../api/services';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { FONTS, SPACING, RADIUS } from '../../utils/constants';

const ChangePasswordScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { isGuest } = useAuth();
  const { showSuccess, showError, showInfo } = useFeedback();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Password rules validation
  const hasMinLength = newPassword.length >= 8;
  const hasLower = /[a-z]/.test(newPassword);
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  // Guest session guard
  if (isGuest) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl }]}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
          <MaterialCommunityIcons name="shield-lock-outline" size={44} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.textPrimary, textAlign: 'center' }]}>
          Verified Account Required
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, textAlign: 'center', marginTop: 8, maxWidth: 320, lineHeight: 20 }]}>
          You are currently commuting in Guest Mode. Guest accounts do not have passwords. Please create a free verified commuter account to manage login credentials.
        </Text>
        <Button
          title="Create Free Commuter Account"
          onPress={() => navigation.navigate('Register')}
          style={{ marginTop: 24, width: '100%', maxWidth: 300 }}
        />
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginTop: 14, padding: 8 }}
        >
          <Text style={{ color: colors.textMuted, fontSize: FONTS.sizes.sm }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const validate = () => {
    const e = {};
    if (!currentPassword || !currentPassword.trim()) {
      e.currentPassword = 'Enter your current password';
    }
    if (!newPassword) {
      e.newPassword = 'Enter a new password';
    } else if (!hasMinLength || !hasLower || !hasUpper || !hasNumber) {
      e.newPassword = 'Password must meet all complexity requirements below';
    }
    if (!confirmPassword) {
      e.confirmPassword = 'Confirm your new password';
    } else if (newPassword !== confirmPassword) {
      e.confirmPassword = 'Passwords do not match';
    }
    if (currentPassword && newPassword && currentPassword.trim() === newPassword.trim()) {
      e.newPassword = 'New password must be different from current password';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChangePassword = async () => {
    setServerError('');
    setSuccessMessage('');
    if (!validate()) return;

    setLoading(true);
    try {
      await usersAPI.changePassword({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      });

      setSuccessMessage('Password updated successfully! Redirecting...');
      showSuccess('Password Updated!', 'Your account password has been changed successfully.');

      setTimeout(() => {
        navigation.goBack();
      }, 1200);
    } catch (err) {
      let msg = 'Failed to change password. Please check your current password.';
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors) && err.response.data.errors.length > 0) {
        msg = err.response.data.errors.join('\n');
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err.message) {
        msg = err.message;
      }

      if (msg.toLowerCase().includes('current password is incorrect')) {
        setErrors((prev) => ({ ...prev, currentPassword: 'The current password you entered is incorrect.' }));
      }

      setServerError(msg);
      showError('Password Change Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const renderRequirement = (label, fulfilled) => (
    <View style={styles.requirementRow}>
      <MaterialCommunityIcons
        name={fulfilled ? 'check-circle' : 'circle-outline'}
        size={16}
        color={fulfilled ? '#10B981' : colors.textMuted}
      />
      <Text
        style={[
          styles.requirementText,
          { color: fulfilled ? '#10B981' : colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Update Password</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Change your SmartSakay Dagupan commuter account password.
          </Text>
        </View>

        {/* Server Error Banner */}
        {serverError ? (
          <View style={[styles.errorBox, { backgroundColor: colors.error + '15', borderColor: colors.error + '40' }]}>
            <MaterialCommunityIcons name="alert-circle-outline" size={22} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{serverError}</Text>
          </View>
        ) : null}

        {/* Success Confirmation Banner */}
        {successMessage ? (
          <View style={[styles.successBox, { backgroundColor: '#10B98115', borderColor: '#10B98140' }]}>
            <MaterialCommunityIcons name="check-circle-outline" size={22} color="#10B981" />
            <Text style={[styles.successText, { color: '#10B981' }]}>{successMessage}</Text>
          </View>
        ) : null}

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Input
            label="Current Password"
            placeholder="Enter current password"
            value={currentPassword}
            onChangeText={(text) => {
              setCurrentPassword(text);
              setErrors((prev) => ({ ...prev, currentPassword: null }));
              setServerError('');
            }}
            secureTextEntry
            leftIcon="lock-outline"
            error={errors.currentPassword}
          />

          {/* Forgot Current Password Link */}
          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotLink}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="help-circle-outline" size={14} color={colors.primary} />
            <Text style={[styles.forgotLinkText, { color: colors.primary }]}>
              Forgot current password? Reset via OTP
            </Text>
          </TouchableOpacity>

          <Input
            label="New Password"
            placeholder="Create new password"
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              setErrors((prev) => ({ ...prev, newPassword: null }));
              setServerError('');
            }}
            secureTextEntry
            leftIcon="lock-plus-outline"
            error={errors.newPassword}
          />

          <Input
            label="Confirm New Password"
            placeholder="Re-type new password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setErrors((prev) => ({ ...prev, confirmPassword: null }));
              setServerError('');
            }}
            secureTextEntry
            leftIcon="lock-check-outline"
            error={errors.confirmPassword}
          />

          {/* Password Complexity Checklist */}
          {newPassword.length > 0 && (
            <View style={[styles.requirementsCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderColor: colors.border }]}>
              <Text style={[styles.requirementsTitle, { color: colors.textPrimary }]}>
                Password Requirements:
              </Text>
              {renderRequirement('At least 8 characters', hasMinLength)}
              {renderRequirement('At least one uppercase letter (A-Z)', hasUpper)}
              {renderRequirement('At least one lowercase letter (a-z)', hasLower)}
              {renderRequirement('At least one number (0-9)', hasNumber)}
              {renderRequirement('Passwords match', passwordsMatch)}
            </View>
          )}

          <Button
            title="Update Password"
            onPress={handleChangePassword}
            loading={loading}
            disabled={loading || !!successMessage}
            style={styles.submitBtn}
          />

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.cancelBtn}
            disabled={loading}
          >
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  errorText: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    fontWeight: '500',
    lineHeight: 18,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  successText: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
  },
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
  },
  forgotLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 4,
    marginTop: -8,
    marginBottom: SPACING.md,
    paddingVertical: 2,
  },
  forgotLinkText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
  },
  requirementsCard: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
    gap: 6,
  },
  requirementsTitle: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  requirementText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '500',
  },
  submitBtn: {
    marginTop: SPACING.lg,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.xs,
  },
  cancelText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
  },
});

export default ChangePasswordScreen;
