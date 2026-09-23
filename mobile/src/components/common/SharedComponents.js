import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { RADIUS, FONTS, SPACING, SHADOWS } from '../../utils/constants';

export const Card = ({ children, style, ...props }) => {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}
      {...props}
    >
      {children}
    </View>
  );
};

export const LoadingSpinner = ({ size = 'large', text }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size={size} color={colors.primary} />
      {text && <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{text}</Text>}
    </View>
  );
};

export const EmptyState = ({ icon = 'inbox-outline', title, message, action }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name={icon} size={64} color={colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>{title}</Text>
      {message && (
        <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>{message}</Text>
      )}
      {action}
    </View>
  );
};

export const Badge = ({ count, style }) => {
  const { colors } = useTheme();
  if (!count || count <= 0) return null;
  return (
    <View style={[styles.badge, { backgroundColor: colors.error }, style]}>
      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
};

export const StatusBadge = ({ label, color, bgColor }) => {
  return (
    <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
      <Text style={[styles.statusText, { color }]}>{label}</Text>
    </View>
  );
};

export const SectionHeader = ({ title, actionText, onAction }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
      {actionText && (
        <Text style={[styles.sectionAction, { color: colors.primary }]} onPress={onAction}>
          {actionText}
        </Text>
      )}
    </View>
  );
};

export const Divider = ({ style }) => {
  const { colors } = useTheme();
  return <View style={[styles.divider, { backgroundColor: colors.border }, style]} />;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    ...SHADOWS.md,
    marginBottom: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxxl,
  },
  loadingText: {
    fontSize: FONTS.sizes.md,
    marginTop: SPACING.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxxl,
  },
  emptyTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    marginTop: SPACING.lg,
  },
  emptyMessage: {
    fontSize: FONTS.sizes.md,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 22,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  statusText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
  },
  sectionAction: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: SPACING.md,
  },
});
