import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { FONTS, SPACING, RADIUS } from '../../utils/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AuthPromptModal = ({
  visible,
  onClose,
  title = 'Create an Account',
  message = 'Sign up for free to unlock full access to SmartSakay Dagupan features.',
  icon = 'shield-account',
  featureTag,
}) => {
  const { colors, isDark } = useTheme();
  const { exitGuestMode } = useAuth();

  const handleSignUp = () => {
    onClose?.();
    exitGuestMode('Register');
  };

  const handleSignIn = () => {
    onClose?.();
    exitGuestMode('Login');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.card, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: colors.border }]}>
          {/* Close button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Feature Badge */}
          <View style={[styles.iconCircle, { backgroundColor: colors.primary + '18' }]}>
            <MaterialCommunityIcons name={icon} size={36} color={colors.primary} />
          </View>

          {featureTag && (
            <View style={[styles.tag, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.tagText, { color: colors.primary }]}>{featureTag}</Text>
            </View>
          )}

          {/* Title & Message */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

          {/* Perks list */}
          <View style={[styles.perksContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#F8FAFC' }]}>
            {[
              { icon: 'robot', text: '24/7 AI Dagupan route & fare assistant' },
              { icon: 'clipboard-alert', text: 'File & track verified commuter complaints' },
              { icon: 'bell-ring-outline', text: 'Instant transit detours & weather advisories' },
            ].map((perk, i) => (
              <View key={i} style={styles.perkRow}>
                <MaterialCommunityIcons name={perk.icon} size={16} color={colors.primary} />
                <Text style={[styles.perkText, { color: colors.textPrimary }]}>{perk.text}</Text>
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: colors.primary }]} onPress={handleSignUp}>
              <MaterialCommunityIcons name="account-plus" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.btnPrimaryText}>Create Free Account</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btnSecondary, { borderColor: colors.border }]} onPress={handleSignIn}>
              <Text style={[styles.btnSecondaryText, { color: colors.primary }]}>Already have an account? Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnDismiss} onPress={onClose}>
              <Text style={[styles.btnDismissText, { color: colors.textMuted }]}>Continue as Guest</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
    borderRadius: 12,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  perksContainer: {
    width: '100%',
    borderRadius: 14,
    padding: 12,
    gap: 8,
    marginBottom: 20,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  perkText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    width: '100%',
    gap: 10,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  btnSecondary: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  btnSecondaryText: {
    fontWeight: '600',
    fontSize: 13,
  },
  btnDismiss: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  btnDismissText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default AuthPromptModal;
