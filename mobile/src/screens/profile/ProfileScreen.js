import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFeedback } from '../../contexts/FeedbackContext';
import { Card, Divider } from '../../components/common/SharedComponents';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import ConfirmDialogModal from '../../components/common/ConfirmDialogModal';
import { usersAPI } from '../../api/services';
import { FONTS, SPACING, RADIUS } from '../../utils/constants';
import { getInitials } from '../../utils/helpers';

const ProfileScreen = ({ navigation }) => {
  const { colors, isDark, themeMode, toggleTheme } = useTheme();
  const { user, logout, isAdmin, refreshProfile } = useAuth();
  const { showSuccess, showError, showInfo } = useFeedback();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '' });
  const [loading, setLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await usersAPI.updateProfile({ firstName: form.firstName, lastName: form.lastName });
      await refreshProfile();
      setEditing(false);
      showSuccess('Profile Updated!', 'Your commuter account details were saved.');
    } catch (e) {
      showError('Update Failed', e.response?.data?.message || 'Failed to update profile.');
    }
    setLoading(false);
  };

  const handleLogoutPress = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    showInfo('Logged Out', 'You have been safely signed out. Have a safe journey!');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Profile Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {getInitials(user?.firstName, user?.lastName)}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={[styles.roleBadge, { backgroundColor: isAdmin ? '#FBBF24' : 'rgba(255,255,255,0.2)' }]}>
          <Text style={[styles.roleText, { color: isAdmin ? '#0F172A' : '#FFFFFF' }]}>
            {user?.role?.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Edit Profile */}
        <Card>
          <View style={styles.cardHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Profile Info</Text>
            <TouchableOpacity onPress={() => setEditing(!editing)}>
              <Text style={{ color: colors.primary, fontWeight: '600', fontSize: FONTS.sizes.sm }}>
                {editing ? 'Cancel' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>
          {editing ? (
            <>
              <Input label="First Name" value={form.firstName} onChangeText={(t) => setForm(p => ({ ...p, firstName: t }))} autoCapitalize="words" />
              <Input label="Last Name" value={form.lastName} onChangeText={(t) => setForm(p => ({ ...p, lastName: t }))} autoCapitalize="words" />
              <Button title="Save Changes" onPress={handleSave} loading={loading} />
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="account" size={20} color={colors.textMuted} />
                <Text style={[styles.infoText, { color: colors.textPrimary }]}>{user?.firstName} {user?.lastName}</Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="email" size={20} color={colors.textMuted} />
                <Text style={[styles.infoText, { color: colors.textPrimary }]}>{user?.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="shield-check" size={20} color={colors.accent} />
                <Text style={[styles.infoText, { color: colors.accent }]}>Email verified</Text>
              </View>
            </>
          )}
        </Card>

        {/* Theme */}
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Appearance</Text>
          <View style={styles.themeRow}>
            {['light', 'dark', 'system'].map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.themeBtn,
                  {
                    backgroundColor: themeMode === mode ? colors.primary : colors.surface,
                    borderColor: themeMode === mode ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => toggleTheme(mode)}
              >
                <MaterialCommunityIcons
                  name={mode === 'light' ? 'weather-sunny' : mode === 'dark' ? 'weather-night' : 'cellphone'}
                  size={18}
                  color={themeMode === mode ? '#FFFFFF' : colors.textSecondary}
                />
                <Text style={{ color: themeMode === mode ? '#FFFFFF' : colors.textPrimary, fontSize: FONTS.sizes.sm, fontWeight: '600', textTransform: 'capitalize' }}>
                  {mode}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Quick Links */}
        <Card>
          <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('CommuterRights')}>
            <MaterialCommunityIcons name="scale-balance" size={22} color={colors.primary} />
            <Text style={[styles.linkText, { color: colors.textPrimary }]}>Commuter Rights</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
          </TouchableOpacity>
          <Divider />
          <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('ChangePassword')}>
            <MaterialCommunityIcons name="lock-reset" size={22} color={colors.primary} />
            <Text style={[styles.linkText, { color: colors.textPrimary }]}>Change Password</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
          </TouchableOpacity>
          {isAdmin && (
            <>
              <Divider />
              <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('AdminPanel')}>
                <MaterialCommunityIcons name="shield-crown" size={22} color={colors.secondary} />
                <Text style={[styles.linkText, { color: colors.textPrimary }]}>Admin Panel</Text>
                <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </>
          )}
        </Card>

        <Button title="Sign Out" onPress={handleLogoutPress} variant="danger" size="lg" style={styles.logoutBtn}
          icon={<MaterialCommunityIcons name="logout" size={20} color="#FFFFFF" />} />

        <Text style={[styles.version, { color: colors.textMuted }]}>SmartSakay Dagupan v1.0.0</Text>
      </View>

      {/* Modern UI/UX Confirmation Modal */}
      <ConfirmDialogModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
        title="Sign Out"
        message="Are you sure you want to sign out of SmartSakay Dagupan?"
        confirmText="Sign Out"
        cancelText="Cancel"
        type="danger"
        icon="logout"
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingTop: 50, paddingBottom: SPACING.xxl, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
  userName: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: '#FFFFFF' },
  userEmail: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  roleBadge: { marginTop: SPACING.sm, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.xs, borderRadius: RADIUS.full },
  roleText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  content: { padding: SPACING.xl },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitle: { fontSize: FONTS.sizes.md, fontWeight: '700' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  infoText: { fontSize: FONTS.sizes.md },
  themeRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  themeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, paddingVertical: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1.5 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.sm },
  linkText: { flex: 1, fontSize: FONTS.sizes.md, fontWeight: '500' },
  logoutBtn: { marginTop: SPACING.md },
  version: { textAlign: 'center', fontSize: FONTS.sizes.xs, marginTop: SPACING.xl, marginBottom: SPACING.xxxl },
});

export default ProfileScreen;
