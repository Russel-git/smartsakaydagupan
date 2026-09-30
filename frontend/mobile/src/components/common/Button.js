import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
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
  fullWidth = false,
  ...props
}) => {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;

  const getContainerStyle = () => {
    // Touch targets: mobile standard is min 44-48px, tablets 52-58px
    const minHeights = {
      sm: isTablet ? 44 : 40,
      md: isTablet ? 52 : 48,
      lg: isTablet ? 58 : 52,
    };

    const base = {
      borderRadius: isTablet ? RADIUS.lg : RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: isTablet ? SPACING.md : SPACING.sm,
      minHeight: minHeights[size] || (isTablet ? 52 : 48),
      width: fullWidth ? '100%' : undefined,
    };

    const sizes = {
      sm: {
        paddingVertical: isTablet ? SPACING.sm + 2 : SPACING.sm,
        paddingHorizontal: isTablet ? SPACING.xl : SPACING.lg,
      },
      md: {
        paddingVertical: isTablet ? SPACING.md + 4 : SPACING.md + 2,
        paddingHorizontal: isTablet ? SPACING.xxl : SPACING.xl,
      },
      lg: {
        paddingVertical: isTablet ? SPACING.lg + 4 : SPACING.lg,
        paddingHorizontal: isTablet ? SPACING.xxxl : SPACING.xxl,
      },
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
    const fontSizes = {
      sm: isTablet ? FONTS.sizes.sm + 1 : FONTS.sizes.sm,
      md: isTablet ? FONTS.sizes.md + 1 : FONTS.sizes.md,
      lg: isTablet ? FONTS.sizes.lg + 1 : FONTS.sizes.lg,
    };

    const variants = {
      primary: { color: '#FFFFFF', fontWeight: '700' },
      secondary: { color: '#FFFFFF', fontWeight: '700' },
      outline: { color: disabled ? colors.textMuted : colors.primary, fontWeight: '700' },
      ghost: { color: disabled ? colors.textMuted : colors.primary, fontWeight: '600' },
      danger: { color: '#FFFFFF', fontWeight: '700' },
    };

    return [
      {
        fontSize: fontSizes[size],
        textAlign: 'center',
        letterSpacing: 0.3,
      },
      variants[variant],
    ];
  };

  return (
    <TouchableOpacity
      style={[...getContainerStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : '#FFFFFF'}
          size={size === 'lg' ? 'small' : 'small'}
        />
      ) : (
        <>
          {icon}
          <Text
            style={[...getTextStyle(), textStyle]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.82}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

export default Button;
