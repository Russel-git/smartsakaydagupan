import { Dimensions, PixelRatio, Platform, useWindowDimensions } from "react-native";

// Standard mobile baseline (iPhone 11 / SE standard)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * Standard horizontal scale
 */
export const scale = (size) => {
  const { width } = Dimensions.get("window");
  return Math.round((width / BASE_WIDTH) * size);
};

/**
 * Standard vertical scale
 */
export const verticalScale = (size) => {
  const { height } = Dimensions.get("window");
  return Math.round((height / BASE_HEIGHT) * size);
};

/**
 * Moderate scale with customizable dampening factor (default 0.4)
 * Prevents elements from shrinking too small on 320px or blowing up on tablets
 */
export const moderateScale = (size, factor = 0.4) => {
  const { width } = Dimensions.get("window");
  const scaled = (width / BASE_WIDTH) * size;
  return Math.round(size + (scaled - size) * factor);
};

/**
 * Clamped font scaling for high accessibility / small viewports
 * Prevents multi-line overflow on tight button labels
 */
export const scaleFont = (size, maxScale = 1.2) => {
  const { width } = Dimensions.get("window");
  const fontScale = PixelRatio.getFontScale();
  const baseScaled = moderateScale(size, 0.3);
  const clampedScale = Math.min(fontScale, maxScale);
  return Math.round(baseScaled * clampedScale);
};

/**
 * Recommended Minimum Touch Target Sizes
 * Android Material: 48dp | Apple HIG: 44pt
 */
export const MIN_TOUCH_TARGET = Platform.OS === "ios" ? 44 : 48;

/**
 * Standard Accessible Hit Slop
 */
export const touchHitSlop = (inset = 10) => ({
  top: inset,
  bottom: inset,
  left: inset,
  right: inset,
});

/**
 * Helper style preset for minimum touch targets
 */
export const touchTargetStyle = {
  minWidth: MIN_TOUCH_TARGET,
  minHeight: MIN_TOUCH_TARGET,
  justifyContent: "center",
  alignItems: "center",
};

/**
 * Viewport Classification and Responsive Hook
 * Supports:
 * - 320px (Compact / high font scaling)
 * - 360px - 375px (Standard Android budget devices & iPhone SE)
 * - 390px - 393px (Standard modern flagships)
 * - 412px - 430px (Android Plus/Ultra & iPhone Pro Max)
 * - 600px+ (Tablets / Foldables)
 */
export const useResponsive = () => {
  const { width, height } = useWindowDimensions();
  const fontScale = PixelRatio.getFontScale();

  const isCompact = width <= 340; // 320px screens
  const isBudgetAndroid = width > 340 && width < 380; // 360px - 375px
  const isStandardFlagship = width >= 380 && width < 410; // 390px - 393px
  const isLargePhone = width >= 410 && width < 600; // 412px - 430px
  const isTablet = Math.min(width, height) >= 600;

  // Maximum content width container for tablets and large foldables
  const maxContentWidth = isTablet ? 640 : "100%";

  return {
    width,
    height,
    fontScale,
    isCompact,
    isBudgetAndroid,
    isStandardFlagship,
    isLargePhone,
    isTablet,
    maxContentWidth,
    scale: (size) => Math.round((width / BASE_WIDTH) * size),
    verticalScale: (size) => Math.round((height / BASE_HEIGHT) * size),
    moderateScale: (size, factor = 0.4) =>
      Math.round(size + ((width / BASE_WIDTH) * size - size) * factor),
    scaleFont: (size, maxFactor = 1.2) => {
      const baseScaled = moderateScale(size, 0.3);
      return Math.round(baseScaled * Math.min(fontScale, maxFactor));
    },
    touchHitSlop,
    MIN_TOUCH_TARGET,
  };
};

export default {
  scale,
  verticalScale,
  moderateScale,
  scaleFont,
  MIN_TOUCH_TARGET,
  touchHitSlop,
  touchTargetStyle,
  useResponsive,
};
