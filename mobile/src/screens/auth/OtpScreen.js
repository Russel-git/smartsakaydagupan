import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFeedback } from '../../contexts/FeedbackContext';
import Button from '../../components/common/Button';
import { FONTS, SPACING, RADIUS } from '../../utils/constants';

const OtpScreen = ({ navigation, route }) => {
  const { email, type = 'registration' } = route.params || {};
  const { colors, isDark } = useTheme();
  const { verifyOtp, resendOtp } = useAuth();
  const { showSuccess, showError, showInfo } = useFeedback();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [error, setError] = useState(null);
  const inputs = useRef([]);

  const topInset = Platform.OS === 'android'
    ? Math.max(insets.top, StatusBar.currentHeight || 28)
    : insets.top;

  // Responsive OTP digit box calculation so 6 boxes always fit without wrapping on 320px-400px screens
  const availableWidth = isTablet ? 420 : Math.min(width - 48, 380);
  const boxWidth = isTablet ? 54 : Math.min(48, Math.max(38, Math.floor((availableWidth - 40) / 6)));
  const boxHeight = Math.round(boxWidth * 1.16);

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
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent={Platform.OS === 'android'}
      />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topInset + 16,
            paddingBottom: Math.max(insets.bottom, 20) + 24,
            paddingHorizontal: isTablet ? SPACING.xxxl : SPACING.xxl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.innerWrapper, { maxWidth: isTablet ? 460 : '100%' }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, { backgroundColor: isDark ? colors.surface : '#F1F5F9' }]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
              <MaterialCommunityIcons name="email-check-outline" size={38} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Verify Your Email</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              We sent a 6-digit code to{'\n'}
              <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{email}</Text>
            </Text>
          </View>

          {Boolean(error) ? (
            <View style={[styles.errorBox, { backgroundColor: colors.error + '15', borderColor: colors.error + '30' }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              {typeof error === 'string' && error.toLowerCase().includes('already verified') ? (
                <TouchableOpacity
                  onPress={() => navigation.navigate('Login')}
                  style={{
                    marginTop: 10,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    backgroundColor: colors.primary,
                    borderRadius: RADIUS.md,
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>Proceed to Sign In</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          <View style={styles.otpRow}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={(ref) => (inputs.current[i] = ref)}
                style={[
                  styles.otpInput,
                  {
                    width: boxWidth,
                    height: boxHeight,
                    borderColor: digit ? colors.primary : colors.border,
                    backgroundColor: colors.surface,
                    color: colors.textPrimary,
                    fontSize: isTablet ? FONTS.sizes.xxl : FONTS.sizes.xl,
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
            title="Verify & Continue"
            onPress={() => handleVerify()}
            loading={loading}
            size="lg"
            fullWidth
            style={styles.verifyBtn}
          />

          <View style={styles.resendRow}>
            <Text style={[styles.resendText, { color: colors.textSecondary }]}>Didn't receive the code? </Text>
            {resendTimer > 0 ? (
              <Text style={[styles.timerText, { color: colors.textMuted }]}>Resend in {resendTimer}s</Text>
            ) : (
              <TouchableOpacity
                onPress={handleResend}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.8}
              >
                <Text style={[styles.resendLink, { color: colors.primary }]}>Resend</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerWrapper: {
    width: '100%',
    alignSelf: 'center',
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  header: { alignItems: 'center', marginBottom: SPACING.xxl },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: { fontSize: FONTS.sizes.xxl, fontWeight: '800', marginBottom: SPACING.xs },
  subtitle: { fontSize: FONTS.sizes.md, textAlign: 'center', lineHeight: 22 },
  errorBox: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  errorText: { fontSize: FONTS.sizes.sm, textAlign: 'center' },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: SPACING.xxl,
  },
  otpInput: {
    borderRadius: RADIUS.md,
    borderWidth: 2,
    fontWeight: '800',
    textAlign: 'center',
  },
  verifyBtn: { marginBottom: SPACING.xl },
  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  resendText: { fontSize: FONTS.sizes.sm },
  timerText: { fontSize: FONTS.sizes.sm, fontWeight: '600' },
  resendLink: { fontSize: FONTS.sizes.sm, fontWeight: '700' },
});

export default OtpScreen;
