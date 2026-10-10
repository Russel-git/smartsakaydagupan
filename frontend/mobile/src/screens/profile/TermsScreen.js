import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { TermsContent } from "../../components/legal/TermsAndConditionsModal";
import { Card } from "../../components/common/SharedComponents";
import { FONTS, SPACING, RADIUS } from "../../utils/constants";
import { touchHitSlop, MIN_TOUCH_TARGET } from "../../utils/responsive";

const TermsScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;

  const topInset =
    Platform.OS === "android"
      ? Math.max(insets.top, StatusBar.currentHeight || 28)
      : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={Platform.OS === "android"}
      />

      {/* Screen Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            paddingTop: topInset + 10,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[
            styles.backButton,
            {
              backgroundColor: isDark ? colors.background : "#F1F5F9",
              minWidth: MIN_TOUCH_TARGET,
              minHeight: MIN_TOUCH_TARGET,
            },
          ]}
          hitSlop={touchHitSlop(8)}
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={22}
            color={colors.textPrimary}
          />
        </TouchableOpacity>

        <View style={styles.headerTextWrapper}>
          <Text
            style={[styles.headerTitle, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            Terms & Transit Disclaimers
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            Dagupan City Commuter Regulations
          </Text>
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: Math.max(insets.bottom, 20) + 24,
            maxWidth: isTablet ? 680 : "100%",
            alignSelf: "center",
            width: "100%",
          },
        ]}
        showsVerticalScrollIndicator={true}
      >
        {/* Important Advisory Highlight */}
        <Card style={styles.highlightCard}>
          <View style={styles.highlightRow}>
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: colors.primary + "15" },
              ]}
            >
              <MaterialCommunityIcons
                name="shield-check"
                size={24}
                color={colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.highlightTitle, { color: colors.textPrimary }]}
              >
                Official Dagupan Public Transit Notice
              </Text>
              <Text
                style={[
                  styles.highlightText,
                  { color: colors.textSecondary },
                ]}
              >
                SmartSakay operates in partnership with local transit data to
                ensure fair jeepney fares, passenger safety, and accessibility.
              </Text>
            </View>
          </View>
        </Card>

        {/* Legal Sections Body */}
        <Card>
          <TermsContent colors={colors} isDark={isDark} />
        </Card>

        {/* Quick Link to Commuter Rights */}
        <TouchableOpacity
          style={[
            styles.rightsLinkCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
          onPress={() => navigation.navigate("CommuterRights")}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="scale-balance"
            size={24}
            color={colors.primary}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.rightsTitle, { color: colors.textPrimary }]}
            >
              Read Your Commuter Rights
            </Text>
            <Text
              style={[styles.rightsSubtitle, { color: colors.textSecondary }]}
            >
              Learn about statutory 20% discounts, passenger etiquette, and POSO
              guidelines.
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={colors.textMuted}
          />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.md,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextWrapper: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.xs,
  },
  scrollContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  highlightCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#2563EB",
  },
  highlightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  highlightTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
    marginBottom: 2,
  },
  highlightText: {
    fontSize: FONTS.sizes.xs,
    lineHeight: 18,
  },
  rightsLinkCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  rightsTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  rightsSubtitle: {
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },
});

export default TermsScreen;
