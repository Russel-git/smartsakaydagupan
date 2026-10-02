import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFeedback } from '../../contexts/FeedbackContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { FONTS, SPACING, RADIUS } from '../../utils/constants';
import { isValidEmail } from '../../utils/helpers';

const LoginScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { login, error, setError } = useAuth();
  const { showSuccess, showError } = useFeedback();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const topInset = Platform.OS === 'android'
    ? Math.max(insets.top, StatusBar.currentHeight || 28)
    : insets.top;

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!isValidEmail(email)) e.email = 'Invalid email format';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await login(email.trim(), password);
      const userName = res?.data?.user?.firstName || 'Commuter';
      showSuccess('Successfully Logged In!', `Welcome back, ${userName}! Ready to navigate Dagupan.`);
    } catch (e) {
      showError('Authentication Failed', e.message || 'Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Welcome');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
            onPress={handleBack}
            style={[styles.backBtn, { backgroundColor: isDark ? colors.surface : '#F1F5F9' }]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>
              Welcome back
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Sign in to your SmartSakay account
            </Text>
          </View>

          {Boolean(error) ? (
            <View style={[styles.errorBox, { backgroundColor: colors.error + '15', borderColor: colors.error + '30' }]}>
              <MaterialCommunityIcons name="alert-circle" size={18} color={colors.error} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                {typeof error === 'string' && error.toLowerCase().includes('not verified') ? (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Otp', { email: email.trim(), type: 'registration' })}
                    style={{ marginTop: 8 }}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>
                      Enter Verification Code →
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ) : null}

          <Input
            label="Email Address"
            placeholder="you@example.com"
            value={email}
            onChangeText={(t) => { setEmail(t); setErrors({}); setError(null); }}
            error={errors.email}
            keyboardType="email-address"
            leftIcon="email-outline"
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(t) => { setPassword(t); setErrors({}); setError(null); }}
            error={errors.password}
            secureTextEntry
            leftIcon="lock-outline"
          />

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotLink}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.8}
          >
            <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot password?</Text>
          </TouchableOpacity>

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            size="lg"
            fullWidth
            style={styles.loginBtn}
          />

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.8}
            >
              <Text style={[styles.footerLink, { color: colors.primary }]}>Create one</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    marginBottom: SPACING.xl,
  },
  header: { marginBottom: SPACING.xxl },
  title: { fontSize: FONTS.sizes.xxxl, fontWeight: '800', marginBottom: SPACING.xs },
  subtitle: { fontSize: FONTS.sizes.md, lineHeight: 22 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  errorText: { fontSize: FONTS.sizes.sm, flex: 1, lineHeight: 19 },
  forgotLink: { alignSelf: 'flex-end', marginBottom: SPACING.xxl, marginTop: -SPACING.sm },
  forgotText: { fontSize: FONTS.sizes.sm, fontWeight: '600' },
  loginBtn: { marginBottom: SPACING.xxl },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: FONTS.sizes.md },
  footerLink: { fontSize: FONTS.sizes.md, fontWeight: '700' },
});

export default LoginScreen;
