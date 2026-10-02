import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { RADIUS, FONTS, SPACING } from '../../utils/constants';

const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'none',
  leftIcon,
  rightIcon,
  multiline = false,
  numberOfLines = 1,
  editable = true,
  style,
  inputStyle,
  ...props
}) => {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const borderColor = error
    ? colors.error
    : isFocused
    ? colors.primary
    : colors.border;

  return (
    <View style={[styles.container, style]}>
      {Boolean(label) ? (
        <Text style={[styles.label, { color: colors.textPrimary, fontSize: isTablet ? FONTS.sizes.sm + 1 : FONTS.sizes.sm }]}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.inputContainer,
          {
            borderColor,
            backgroundColor: editable ? colors.surface : colors.surfaceElevated,
            minHeight: multiline ? Math.max(52, numberOfLines * 36) : (isTablet ? 54 : 48),
            borderRadius: isTablet ? RADIUS.lg : RADIUS.md,
          },
          multiline && { alignItems: 'flex-start' },
        ]}
      >
        {Boolean(leftIcon) ? (
          <MaterialCommunityIcons
            name={leftIcon}
            size={isTablet ? 22 : 20}
            color={isFocused ? colors.primary : colors.textMuted}
            style={styles.leftIcon}
          />
        ) : null}
        <TextInput
          style={[
            styles.input,
            {
              color: colors.textPrimary,
              fontSize: isTablet ? FONTS.sizes.md + 1 : FONTS.sizes.md,
            },
            multiline && { textAlignVertical: 'top', paddingTop: SPACING.md },
            inputStyle,
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {Boolean(secureTextEntry) ? (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.rightIcon}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons
              name={showPassword ? 'eye-off' : 'eye'}
              size={isTablet ? 22 : 20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        ) : null}
        {Boolean(rightIcon) && !secureTextEntry ? (
          <View style={styles.rightIcon}>{rightIcon}</View>
        ) : null}
      </View>
      {Boolean(error) ? (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
    width: '100%',
  },
  label: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    marginBottom: SPACING.xs + 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
  },
  input: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    paddingVertical: SPACING.md - 2,
  },
  leftIcon: {
    marginRight: SPACING.sm,
  },
  rightIcon: {
    marginLeft: SPACING.sm,
  },
  error: {
    fontSize: FONTS.sizes.xs,
    marginTop: SPACING.xs,
  },
});

export default Input;
