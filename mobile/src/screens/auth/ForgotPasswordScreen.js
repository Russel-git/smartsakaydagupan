import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFeedback } from '../../contexts/FeedbackContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { FONTS, SPACING } from '../../utils/constants';
import { isValidEmail, validatePassword } from '../../utils/helpers';

const ForgotPasswordScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { forgotPassword, resetPassword } = useAuth();
  const { showSuccess, showError, showInfo } = useFeedback();
  const [step, setStep] = useState(1); // 1: email, 2: code + new password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSendCode = async () => {
    if (!email.trim() || !isValidEmail(email)) {
      setErrors({ email: 'Valid email is required' });
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      showInfo('Reset Code Dispatched', `If ${email.trim()} is registered, a 6-digit reset code was sent.`);
      setStep(2);
    } catch (e) {
      // Always shows info message for security
      showInfo('Reset Code Dispatched', `If ${email.trim()} is registered, a 6-digit reset code was sent.`);
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const e = {};
    if (!code.trim()) e.code = 'Reset code is required';
    if (!newPassword) e.newPassword = 'New password is required';
    else {
      const { isValid, errors: pwErrors } = validatePassword(newPassword);
      if (!isValid) e.newPassword = pwErrors.join(', ');
    }
    if (newPassword !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    try {
      await resetPassword(email.trim(), code.trim(), newPassword);
      showSuccess('Password Reset Successful!', 'Your password has been updated. Please log in with your new credentials.');
      navigation.navigate('Login');
    } catch (e) {
      setErrors({ code: e.message });
      showError('Password Reset Failed', e.message || 'Invalid or expired reset code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {step === 1 ? 'Forgot Password?' : 'Reset Password'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {step === 1
            ? 'Enter your email and we\'ll send you a reset code.'
            : `Enter the code sent to ${email} and your new password.`}
        </Text>
      </View>

      {step === 1 ? (
        <>
          <Input label="Email Address" placeholder="you@example.com" value={email}
            onChangeText={(t) => { setEmail(t); setErrors({}); }} error={errors.email}
            keyboardType="email-address" leftIcon="email-outline" />
          <Button title="Send Reset Code" onPress={handleSendCode} loading={loading} size="lg" />
        </>
      ) : (
        <>
          <Input label="Reset Code" placeholder="Enter 6-digit code" value={code}
            onChangeText={(t) => { setCode(t); setErrors({}); }} error={errors.code}
            keyboardType="number-pad" leftIcon="numeric" maxLength={6} />
          <Input label="New Password" placeholder="Min 8 chars, 1 uppercase, 1 number" value={newPassword}
            onChangeText={(t) => { setNewPassword(t); setErrors({}); }} error={errors.newPassword}
            secureTextEntry leftIcon="lock-outline" />
          <Input label="Confirm Password" placeholder="Re-enter new password" value={confirmPassword}
            onChangeText={(t) => { setConfirmPassword(t); setErrors({}); }} error={errors.confirmPassword}
            secureTextEntry leftIcon="lock-check-outline" />
          <Button title="Reset Password" onPress={handleResetPassword} loading={loading} size="lg" />
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: SPACING.xxl, paddingTop: SPACING.section + 16 },
  backBtn: { marginBottom: SPACING.xl },
  header: { marginBottom: SPACING.xxl },
  title: { fontSize: FONTS.sizes.xxxl, fontWeight: '800', marginBottom: SPACING.xs },
  subtitle: { fontSize: FONTS.sizes.md, lineHeight: 22 },
});

export default ForgotPasswordScreen;
