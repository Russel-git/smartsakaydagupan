import React, { useState, useRef } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { FONTS, SPACING, RADIUS } from "../../utils/constants";
import {
  touchHitSlop,
  MIN_TOUCH_TARGET,
  scaleFont,
} from "../../utils/responsive";

const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
  const paddingToBottom = 40;
  return (
    layoutMeasurement.height + contentOffset.y >=
    contentSize.height - paddingToBottom
  );
};

export const TERMS_LAST_UPDATED = "October 2026";

export const TermsContent = ({ colors, isDark }) => (
  <View style={styles.termsBody}>
    {/* Section 1 */}
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <MaterialCommunityIcons
          name="bus-clock"
          size={20}
          color={colors.primary}
        />
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          1. Purpose & Service Scope
        </Text>
      </View>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        SmartSakay Dagupan is a public commuter companion developed to provide
        transparent transit schedules, jeepney routes, official fare estimates,
        and municipal advisories across Dagupan City and connecting Pangasinan
        corridors (Binmaley, Lingayen, Calasiao, Mangaldan).
      </Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        SmartSakay Dagupan does not own, operate, or dispatch public utility
        vehicles (PUVs). We do not collect ride fares or driver commissions.
      </Text>
    </View>

    {/* Section 2 */}
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <MaterialCommunityIcons
          name="calculator-variant"
          size={20}
          color={colors.primary}
        />
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          2. Fare Estimation & LTFRB Matrix Disclaimer
        </Text>
      </View>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        • <Text style={styles.boldText}>Fare Matrix Authority:</Text> Base fares
        and distance computations correspond to official LTFRB Region 1 fare
        matrices and Dagupan City Council tricycle fare regulations.
      </Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        • <Text style={styles.boldText}>Statutory Discounts:</Text> Under
        Philippine laws (RA 9994 for Senior Citizens, RA 7277 for Persons with
        Disabilities, and RA 11314 for Students), a 20% discount applies to all
        regular public transport fares upon presentation of valid ID.
      </Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        • <Text style={styles.boldText}>Discrepancies:</Text> Actual fares
        collected by drivers may vary during special route deviations or
        unofficial negotiations. SmartSakay is not liable for driver
        overcharging; users are encouraged to file an official report via the
        SmartSakay Grievance module.
      </Text>
    </View>

    {/* Section 3 */}
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <MaterialCommunityIcons
          name="routes"
          size={20}
          color={colors.primary}
        />
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          3. Jeepney Routes, Terminals & Rerouting
        </Text>
      </View>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        Route alignments (e.g., Downtown Loop, Perez Blvd, AB Fernandez, Tapuac,
        Lucao, Bonuan Gueset/Binloc) reflect designated LTFRB franchises. During
        local festivities, street markets, road works, or POSO traffic
        modifications, vehicles may take alternate routes.
      </Text>
    </View>

    {/* Section 4 */}
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <MaterialCommunityIcons
          name="weather-pouring"
          size={20}
          color="#D97706"
        />
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          4. Weather & Tidal Flood Warning Disclaimers
        </Text>
      </View>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        Dagupan City is prone to high-tide river swells and heavy monsoon
        inundations (notably along Pantol, Malued, Mayapyap, and Herrero-Perez).
        SmartSakay weather and flood alerts are derived from Open-Meteo forecasts
        and municipal notifications.
      </Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        These notices are for travel guidance only. In emergency situations or
        typhoons, commuters must adhere to official directives from the Dagupan
        City Disaster Risk Reduction and Management Office (CDRRMO).
      </Text>
    </View>

    {/* Section 5 */}
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <MaterialCommunityIcons
          name="shield-account"
          size={20}
          color={colors.primary}
        />
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          5. Commuter Privacy & Account Rights (RA 10173)
        </Text>
      </View>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        In compliance with the Philippine Data Privacy Act of 2012, your personal
        information (name, email) is secured and never sold to third parties.
      </Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        • <Text style={styles.boldText}>Account Deletion Right:</Text> Under
        Apple App Store and Google Play policies, commuters retain the absolute
        right to permanently delete their account and personal ride records at
        any time directly within Profile Settings.
      </Text>
    </View>

    {/* Section 6 */}
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <MaterialCommunityIcons
          name="alert-octagon-outline"
          size={20}
          color={colors.primary}
        />
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          6. Limitation of Liability
        </Text>
      </View>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        SmartSakay Dagupan and its developers shall not be liable for missed
        trips, delay penalties, property loss, or personal injuries sustained
        during transit. Commuters are advised to exercise personal caution when
        traveling.
      </Text>
    </View>

    <View style={styles.updatedBadge}>
      <Text style={[styles.updatedText, { color: colors.textMuted }]}>
        Terms & Transit Disclaimers • Version 1.0 ({TERMS_LAST_UPDATED})
      </Text>
    </View>
  </View>
);

const TermsAndConditionsModal = ({
  visible,
  onClose,
  onAccept,
  readOnly = false,
  title = "Terms & Conditions",
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;

  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const scrollViewRef = useRef(null);

  const handleScroll = ({ nativeEvent }) => {
    if (readOnly || hasScrolledToBottom) return;
    if (isCloseToBottom(nativeEvent)) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAcceptPress = () => {
    if (onAccept) {
      onAccept();
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: colors.surface,
              maxHeight: height * 0.9,
              maxWidth: isTablet ? 620 : "100%",
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.header,
              {
                borderBottomColor: colors.border,
              },
            ]}
          >
            <View style={styles.headerTitleRow}>
              <MaterialCommunityIcons
                name="file-document-check-outline"
                size={24}
                color={colors.primary}
              />
              <Text
                style={[styles.headerTitle, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {title}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, { minWidth: MIN_TOUCH_TARGET, minHeight: MIN_TOUCH_TARGET }]}
              hitSlop={touchHitSlop(8)}
              accessibilityLabel="Close terms dialog"
            >
              <MaterialCommunityIcons
                name="close"
                size={22}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Subtitle / Advisory Notice */}
          <View
            style={[
              styles.advisoryBanner,
              { backgroundColor: isDark ? "#1E293B" : "#F8FAFC" },
            ]}
          >
            <MaterialCommunityIcons
              name="information-outline"
              size={18}
              color={colors.primary}
            />
            <Text
              style={[
                styles.advisoryText,
                { color: colors.textSecondary },
              ]}
            >
              Please review our local Dagupan transit advisories, fare rules, and
              privacy protections.
            </Text>
          </View>

          {/* Scrollable Terms Content */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={true}
          >
            <TermsContent colors={colors} isDark={isDark} />
          </ScrollView>

          {/* Footer Controls */}
          <View
            style={[
              styles.footer,
              {
                borderTopColor: colors.border,
                backgroundColor: colors.surface,
              },
            ]}
          >
            {!readOnly && !hasScrolledToBottom && (
              <View style={styles.scrollHintRow}>
                <MaterialCommunityIcons
                  name="arrow-down-circle-outline"
                  size={16}
                  color={colors.textMuted}
                />
                <Text
                  style={[styles.scrollHintText, { color: colors.textMuted }]}
                >
                  Scroll to bottom to enable acceptance
                </Text>
              </View>
            )}

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[
                  styles.cancelBtn,
                  {
                    borderColor: colors.border,
                    backgroundColor: isDark ? colors.background : "#F1F5F9",
                    minHeight: MIN_TOUCH_TARGET,
                  },
                ]}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.cancelBtnText, { color: colors.textSecondary }]}
                >
                  {readOnly ? "Close" : "Decline"}
                </Text>
              </TouchableOpacity>

              {!readOnly && (
                <TouchableOpacity
                  style={[
                    styles.acceptBtn,
                    {
                      backgroundColor: hasScrolledToBottom
                        ? colors.primary
                        : isDark
                        ? "#334155"
                        : "#CBD5E1",
                      minHeight: MIN_TOUCH_TARGET,
                    },
                  ]}
                  onPress={handleAcceptPress}
                  disabled={!hasScrolledToBottom}
                  activeOpacity={hasScrolledToBottom ? 0.8 : 1}
                >
                  <MaterialCommunityIcons
                    name="check-circle-outline"
                    size={18}
                    color="#FFFFFF"
                  />
                  <Text style={styles.acceptBtnText}>
                    {hasScrolledToBottom ? "I Accept Terms" : "Read to Accept"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalContainer: {
    width: "100%",
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    flex: 1,
  },
  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
  },
  closeButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  advisoryBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  advisoryText: {
    fontSize: FONTS.sizes.xs,
    flex: 1,
    lineHeight: 16,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  termsBody: {
    gap: SPACING.lg,
  },
  section: {
    gap: SPACING.xs,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: "700",
  },
  paragraph: {
    fontSize: FONTS.sizes.sm,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: "700",
  },
  updatedBadge: {
    alignItems: "center",
    paddingVertical: SPACING.md,
  },
  updatedText: {
    fontSize: FONTS.sizes.xs,
    fontStyle: "italic",
  },
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  scrollHintRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: SPACING.sm,
  },
  scrollHintText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.md,
  },
  cancelBtnText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
  },
  acceptBtn: {
    flex: 2,
    borderRadius: RADIUS.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: SPACING.md,
  },
  acceptBtnText: {
    color: "#FFFFFF",
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
});

export default TermsAndConditionsModal;
