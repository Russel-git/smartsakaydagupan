import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { FONTS, RADIUS } from '../../utils/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TOAST_CONFIG = {
  success: {
    color: '#10B981',
    bgColorLight: '#ECFDF5',
    borderColorLight: '#A7F3D0',
    icon: 'check-circle',
    badge: 'Success',
  },
  error: {
    color: '#EF4444',
    bgColorLight: '#FEF2F2',
    borderColorLight: '#FECACA',
    icon: 'alert-circle',
    badge: 'Error',
  },
  info: {
    color: '#2563EB',
    bgColorLight: '#EFF6FF',
    borderColorLight: '#BFDBFE',
    icon: 'information',
    badge: 'Notice',
  },
  warning: {
    color: '#F59E0B',
    bgColorLight: '#FFFBEB',
    borderColorLight: '#FDE68A',
    icon: 'alert',
    badge: 'Warning',
  },
};

const FeedbackToast = ({ toast, onDismiss }) => {
  const { colors, isDark } = useTheme();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (toast) {
      translateY.setValue(-80);
      opacity.setValue(0);
      scale.setValue(0.95);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 7,
          tension: 45,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -60,
          duration: 180,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    }
  }, [toast]);

  if (!toast) return null;

  const config = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info;
  const cardBg = isDark ? '#1E293B' : '#FFFFFF';
  const cardBorder = isDark ? '#334155' : config.borderColorLight;

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: cardBg,
            borderColor: cardBorder,
            transform: [{ translateY }, { scale }],
            opacity,
            shadowColor: config.color,
          },
        ]}
      >
        {/* Accent strip */}
        <View style={[styles.accentStrip, { backgroundColor: config.color }]} />

        {/* Icon */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: isDark ? config.color + '25' : config.bgColorLight },
          ]}
        >
          <MaterialCommunityIcons name={config.icon} size={22} color={config.color} />
        </View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                { color: isDark ? '#F8FAFC' : '#0F172A' },
              ]}
              numberOfLines={1}
            >
              {toast.title}
            </Text>
          </View>
          {toast.message ? (
            <Text
              style={[
                styles.message,
                { color: isDark ? '#94A3B8' : '#475569' },
              ]}
              numberOfLines={2}
            >
              {toast.message}
            </Text>
          ) : null}
        </View>

        {/* Dismiss Button */}
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onDismiss}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="close"
            size={18}
            color={isDark ? '#94A3B8' : '#64748B'}
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : Platform.OS === 'web' ? 20 : 36,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99999,
    elevation: 9999,
  },
  container: {
    width: Math.min(SCREEN_WIDTH * 0.92, 460),
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.lg || 14,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 14,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
  },
  accentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4.5,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginLeft: 2,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  message: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  closeBtn: {
    padding: 6,
    marginLeft: 8,
    borderRadius: 12,
  },
});

export default FeedbackToast;
