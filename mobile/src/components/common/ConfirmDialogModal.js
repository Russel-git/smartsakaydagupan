import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { FONTS, RADIUS } from '../../utils/constants';

const ConfirmDialogModal = ({
  visible,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger', // 'danger' | 'warning' | 'info'
  icon,
  loading = false,
}) => {
  const { colors, isDark } = useTheme();

  if (!visible) return null;

  const typeConfig = {
    danger: {
      accentColor: '#EF4444',
      bgGlow: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
      iconName: icon || 'trash-can-outline',
    },
    warning: {
      accentColor: '#F59E0B',
      bgGlow: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
      iconName: icon || 'alert-circle-outline',
    },
    info: {
      accentColor: '#3B82F6',
      bgGlow: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
      iconName: icon || 'information-outline',
    },
  };

  const current = typeConfig[type] || typeConfig.danger;

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
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          {/* Header Icon & Close */}
          <View style={styles.topRow}>
            <View style={[styles.iconCircle, { backgroundColor: current.bgGlow }]}>
              <MaterialCommunityIcons name={current.iconName} size={28} color={current.accentColor} />
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} disabled={loading}>
              <MaterialCommunityIcons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Title & Message */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.btnCancel,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                  borderColor: colors.border,
                },
              ]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={[styles.btnCancelText, { color: colors.textSecondary }]}>
                {cancelText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.btnConfirm,
                {
                  backgroundColor: current.accentColor,
                  opacity: loading ? 0.7 : 1,
                },
              ]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.btnConfirmText}>{confirmText}</Text>
              )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 99999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
    zIndex: 100000,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 8,
  },
  message: {
    fontFamily: FONTS.regular,
    fontSize: 13.5,
    lineHeight: 20,
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  btnCancel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancelText: {
    fontFamily: FONTS.medium,
    fontSize: 13.5,
  },
  btnConfirm: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnConfirmText: {
    fontFamily: FONTS.bold,
    fontSize: 13.5,
    color: '#FFFFFF',
  },
});

export default ConfirmDialogModal;
