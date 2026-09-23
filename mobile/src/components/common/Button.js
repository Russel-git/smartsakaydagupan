import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { RADIUS, FONTS, SPACING, SHADOWS } from '../../utils/constants';

const Button = ({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size = 'md', // 'sm' | 'md' | 'lg'
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  ...props
}) => {
  const { colors } = useTheme();

  const getContainerStyle = () => {
    const base = {
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: SPACING.sm,
    };

    const sizes = {
      sm: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg },
      md: { paddingVertical: SPACING.md + 2, paddingHorizontal: SPACING.xl },
      lg: { paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xxl },
    };

    const variants = {
      primary: {
        backgroundColor: disabled ? colors.border : colors.primary,
        ...SHADOWS.sm,
      },
      secondary: {
        backgroundColor: disabled ? colors.border : colors.secondary,
        ...SHADOWS.sm,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: disabled ? colors.border : colors.primary,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
      danger: {
        backgroundColor: disabled ? colors.border : colors.error,
        ...SHADOWS.sm,
      },
    };

    return [base, sizes[size], variants[variant]];
  };

  const getTextStyle = () => {
    const sizes = {
      sm: { fontSize: FONTS.sizes.sm },
      md: { fontSize: FONTS.sizes.md },
      lg: { fontSize: FONTS.sizes.lg },
    };

    const variants = {
      primary: { color: '#FFFFFF', fontWeight: '600' },
      secondary: { color: '#FFFFFF', fontWeight: '600' },
      outline: { color: disabled ? colors.textMuted : colors.primary, fontWeight: '600' },
      ghost: { color: disabled ? colors.textMuted : colors.primary, fontWeight: '500' },
      danger: { color: '#FFFFFF', fontWeight: '600' },
    };

    return [sizes[size], variants[variant]];
  };

  return (
    <TouchableOpacity
      style={[...getContainerStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : '#FFFFFF'}
          size="small"
        />
      ) : (
        <>
          {icon}
          <Text style={[...getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

export default Button;
