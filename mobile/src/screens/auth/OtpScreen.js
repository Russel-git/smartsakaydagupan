import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFeedback } from '../../contexts/FeedbackContext';
import Button from '../../components/common/Button';
import { FONTS, SPACING, RADIUS } from '../../utils/constants';

const OtpScreen = ({ navigation, route }) => {
  const { email, type = 'registration' } = route.params || {};
  const { colors } = useTheme();
  const { verifyOtp, resendOtp } = useAuth();
  const { showSuccess, showError, showInfo } = useFeedback();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [error, setError] = useState(null);
  const inputs = useRef([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    setError(null);

    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (newOtp.every((d) => d !== '')) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code) => {
    const otpCode = code || otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(email, otpCode);
      showSuccess('Email Verified!', 'Your account has been verified and activated. Welcome to SmartSakay!');
    } catch (e) {
      setError(e.message);
      showError('Verification Failed', e.message || 'Invalid or expired verification code.');
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendOtp(email, type);
      setResendTimer(60);
      setError(null);
      showInfo('Code Resent', `A new 6-digit verification code was dispatched to ${email}.`);
    } catch (e) {
      setError(e.message);
      showError('Resend Failed', e.message || 'Unable to resend code. Please try again.');
    }
  };


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
          <MaterialCommunityIcons name="email-check-outline" size={40} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Verify Your Email</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          We sent a 6-digit code to{'\n'}
          <Text style={{ fontWeight: '600', color: colors.textPrimary }}>{email}</Text>
        </Text>
      </View>

      {error && (
        <View style={[styles.errorBox, { backgroundColor: colors.error + '15' }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          {error.toLowerCase().includes('already verified') && (
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={{
                marginTop: 10,
                paddingHorizontal: 16,
                paddingVertical: 8,
                backgroundColor: colors.primary,
                borderRadius: RADIUS.md,
              }}
            >
              <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>Proceed to Sign In</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.otpRow}>

        {otp.map((digit, i) => (
          <TextInput
            key={i}
            ref={(ref) => (inputs.current[i] = ref)}
            style={[
              styles.otpInput,
              {
                borderColor: digit ? colors.primary : colors.border,
                backgroundColor: colors.surface,
                color: colors.textPrimary,
              },
            ]}
            value={digit}
            onChangeText={(t) => handleChange(t.replace(/[^0-9]/g, ''), i)}
            onKeyPress={(e) => handleKeyPress(e, i)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
          />
        ))}
      </View>

      <Button
        title="Verify"
        onPress={() => handleVerify()}
        loading={loading}
        size="lg"
        style={styles.verifyBtn}
      />

      <View style={styles.resendRow}>
        <Text style={[styles.resendText, { color: colors.textSecondary }]}>Didn't receive the code? </Text>
        {resendTimer > 0 ? (
          <Text style={[styles.timerText, { color: colors.textMuted }]}>Resend in {resendTimer}s</Text>
        ) : (
          <TouchableOpacity onPress={handleResend}>
            <Text style={[styles.resendLink, { color: colors.primary }]}>Resend</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.xxl, paddingTop: SPACING.section + 16 },
  backBtn: { marginBottom: SPACING.xl },
  header: { alignItems: 'center', marginBottom: SPACING.xxxl },
  iconCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.lg },
  title: { fontSize: FONTS.sizes.xxl, fontWeight: '800', marginBottom: SPACING.sm },
  subtitle: { fontSize: FONTS.sizes.md, textAlign: 'center', lineHeight: 22 },
  errorBox: { padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.lg, alignItems: 'center' },
  errorText: { fontSize: FONTS.sizes.sm },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.sm, marginBottom: SPACING.xxl },

  otpInput: {
    width: 48, height: 56, borderRadius: RADIUS.md, borderWidth: 2,
    fontSize: FONTS.sizes.xxl, fontWeight: '700', textAlign: 'center',
  },
  verifyBtn: { marginBottom: SPACING.xxl },
  resendRow: { flexDirection: 'row', justifyContent: 'center' },
  resendText: { fontSize: FONTS.sizes.sm },
  timerText: { fontSize: FONTS.sizes.sm, fontWeight: '600' },
  resendLink: { fontSize: FONTS.sizes.sm, fontWeight: '700' },
});

export default OtpScreen;
