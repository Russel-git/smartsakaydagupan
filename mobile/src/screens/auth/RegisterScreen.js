import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFeedback } from '../../contexts/FeedbackContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { FONTS, SPACING, RADIUS } from '../../utils/constants';
import { isValidEmail, isValidName, validatePassword } from '../../utils/helpers';

const EXTENSION_OPTIONS = ['None', 'Jr.', 'Sr.', 'II', 'III', 'IV', 'V', 'Others'];

const RegisterScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { register, error, setError } = useAuth();
  const { showSuccess, showError } = useFeedback();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    suffix: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [selectedExtension, setSelectedExtension] = useState('None');
  const [customExtension, setCustomExtension] = useState('');
  const [showExtensionDropdown, setShowExtensionDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Welcome');
    }
  };

  const updateField = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors({});
    setError(null);
  };

  const handleSelectExtension = (opt) => {
    setSelectedExtension(opt);
    setShowExtensionDropdown(false);
    if (opt === 'None') {
      updateField('suffix', '');
    } else if (opt === 'Others') {
      updateField('suffix', customExtension);
    } else {
      updateField('suffix', opt);
    }
  };

  const handleCustomExtensionChange = (val) => {
    setCustomExtension(val);
    updateField('suffix', val);
  };

  const validate = () => {
    const e = {};
    const cleanFirst = form.firstName.trim();
    const cleanLast = form.lastName.trim();
    const lettersRegex = /^[A-Za-z]+(\s[A-Za-z]+)*$/;

    if (!cleanFirst) {
      e.firstName = 'First name is required';
    } else if (!lettersRegex.test(cleanFirst)) {
      e.firstName = 'First name can only contain letters';
    } else if (cleanFirst.length < 2) {
      e.firstName = 'First name must be at least 2 characters';
    } else if (cleanFirst.length > 16) {
      e.firstName = 'First name cannot exceed 16 characters';
    }

    if (!cleanLast) {
      e.lastName = 'Last name is required';
    } else if (!lettersRegex.test(cleanLast)) {
      e.lastName = 'Last name can only contain letters';
    } else if (cleanLast.length < 2) {
      e.lastName = 'Last name must be at least 2 characters';
    } else if (cleanLast.length > 16) {
      e.lastName = 'Last name cannot exceed 16 characters';
    }

    if (form.suffix && form.suffix.trim().length > 10) {
      e.suffix = 'Name extension cannot exceed 10 characters';
    }

    if (!form.email.trim()) e.email = 'Email is required';
    else if (!isValidEmail(form.email)) e.email = 'Invalid email format';

    if (!form.password) e.password = 'Password is required';
    else {
      const { isValid, errors: pwErrors } = validatePassword(form.password);
      if (!isValid) e.password = pwErrors.join(', ');
    }
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await register(
        form.email.trim(),
        form.password,
        form.firstName.trim(),
        form.lastName.trim(),
        form.suffix.trim()
      );
      showSuccess(
        'Account Registered!',
        `A 6-digit verification code has been dispatched to ${form.email.trim()}.`
      );
      if (res?.data?.requiresVerification || !res?.data?.accessToken) {
        navigation.navigate('Otp', {
          email: form.email.trim(),
          type: 'registration',
        });
      }
    } catch (e) {
      showError('Registration Failed', e.message || 'Unable to register account. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Join SmartSakay and get full access to all features
          </Text>
        </View>

        {error && (
          <View style={[styles.errorBox, { backgroundColor: colors.error + '15' }]}>
            <MaterialCommunityIcons name="alert-circle" size={18} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        <View style={styles.row}>
          <Input label="First Name" placeholder="Juan (2-16 letters)" value={form.firstName}
            onChangeText={(t) => updateField('firstName', t)} error={errors.firstName}
            leftIcon="account" style={styles.half} autoCapitalize="words" />
          <Input label="Last Name" placeholder="Dela Cruz (2-16 letters)" value={form.lastName}
            onChangeText={(t) => updateField('lastName', t)} error={errors.lastName}
            leftIcon="account" style={styles.half} autoCapitalize="words" />
        </View>

        {/* Name Extension Dropdown */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Name Extension (Optional)</Text>
          <TouchableOpacity
            style={[styles.dropdownTrigger, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setShowExtensionDropdown(!showExtensionDropdown)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="card-account-details-outline" size={20} color={colors.textMuted} />
            <Text style={[styles.dropdownValue, { color: colors.textPrimary }]}>
              {selectedExtension === 'None' ? 'None (e.g. No suffix)' : selectedExtension}
            </Text>
            <MaterialCommunityIcons 
              name={showExtensionDropdown ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={colors.textMuted} 
            />
          </TouchableOpacity>

          {showExtensionDropdown && (
            <View style={[styles.dropdownMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {EXTENSION_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.dropdownOption,
                    selectedExtension === opt && { backgroundColor: colors.primary + '15' },
                  ]}
                  onPress={() => handleSelectExtension(opt)}
                >
                  <Text style={[
                    styles.dropdownOptionText, 
                    { color: selectedExtension === opt ? colors.primary : colors.textPrimary },
                    selectedExtension === opt && { fontWeight: '700' }
                  ]}>
                    {opt === 'None' ? 'None (No Suffix)' : opt}
                  </Text>
                  {selectedExtension === opt && (
                    <MaterialCommunityIcons name="check" size={16} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {selectedExtension === 'Others' && (
            <View style={{ marginTop: 10 }}>
              <Input
                placeholder="Enter custom extension (e.g. IV, Datu, etc.)"
                value={customExtension}
                onChangeText={handleCustomExtensionChange}
                error={errors.suffix}
                maxLength={10}
                autoCapitalize="words"
              />
            </View>
          )}
        </View>


        <Input label="Email Address" placeholder="you@example.com" value={form.email}
          onChangeText={(t) => updateField('email', t)} error={errors.email}
          keyboardType="email-address" leftIcon="email-outline" />

        <Input label="Password" placeholder="Min 8 chars, 1 uppercase, 1 number" value={form.password}
          onChangeText={(t) => updateField('password', t)} error={errors.password}
          secureTextEntry leftIcon="lock-outline" />

        <Input label="Confirm Password" placeholder="Re-enter your password" value={form.confirmPassword}
          onChangeText={(t) => updateField('confirmPassword', t)} error={errors.confirmPassword}
          secureTextEntry leftIcon="lock-check-outline" />

        <Button title="Create Account" onPress={handleRegister} loading={loading} size="lg" style={styles.registerBtn} />

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: SPACING.xxl, paddingTop: SPACING.section + 16 },
  backBtn: { marginBottom: SPACING.lg },
  header: { marginBottom: SPACING.xxl },
  title: { fontSize: FONTS.sizes.xxxl, fontWeight: '800', marginBottom: SPACING.xs },
  subtitle: { fontSize: FONTS.sizes.md, lineHeight: 22 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    padding: SPACING.md, borderRadius: 10, marginBottom: SPACING.lg,
  },
  errorText: { fontSize: FONTS.sizes.sm, flex: 1 },
  row: { flexDirection: 'row', gap: SPACING.md },
  half: { flex: 1 },
  registerBtn: { marginTop: SPACING.sm, marginBottom: SPACING.xxl },
  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { fontSize: FONTS.sizes.md },
  footerLink: { fontSize: FONTS.sizes.md, fontWeight: '600' },
  fieldContainer: { marginBottom: SPACING.lg },
  fieldLabel: { fontSize: FONTS.sizes.sm, fontWeight: '600', marginBottom: SPACING.xs },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: SPACING.sm,
  },
  dropdownValue: { flex: 1, fontSize: FONTS.sizes.md, fontWeight: '500' },
  dropdownMenu: {
    marginTop: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
  },
  dropdownOptionText: { fontSize: FONTS.sizes.sm },
});

export default RegisterScreen;
