import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Linking,
  Modal,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { FONTS, SPACING, RADIUS } from "../../utils/constants";

const STEPS =
  Platform.OS === "web"
    ? [
        "Click the lock icon beside the web address",
        "Open Site settings (or Permissions)",
        "Set Location to Allow",
        "Come back here. It updates automatically",
      ]
    : [
        "Tap “Open Settings” below",
        "Choose Permissions, then Location",
        "Select “While using the app” (Allow)",
        "Come back to SmartSakay",
      ];

export const LocationPermissionBanner = ({ onPress }) => (
  <TouchableOpacity
    style={styles.banner}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <MaterialCommunityIcons name="map-marker-off" size={20} color="#B45309" />
    <View style={{ flex: 1 }}>
      <Text style={styles.bannerTitle}>Location is turned off</Text>
      <Text style={styles.bannerSub}>
        Check your settings and allow location to see your live position.
      </Text>
    </View>
    <View style={styles.bannerBtn}>
      <Text style={styles.bannerBtnText}>Fix</Text>
    </View>
  </TouchableOpacity>
);

// Full instructions card inside a modal
export const LocationPermissionModal = ({ visible, onClose, onRetry }) => {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name="map-marker-off"
              size={34}
              color="#EA580C"
            />
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Please allow location
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            SmartSakay needs your location to track your ride and show where you
            are. Check your permission settings:
          </Text>

          <View
            style={[
              styles.stepsBox,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            {STEPS.map((s, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.textPrimary }]}>
                  {s}
                </Text>
              </View>
            ))}
          </View>

          {Platform.OS !== "web" && (
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={() => Linking.openSettings()}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="cog" size={18} color="#FFF" />
              <Text style={styles.primaryBtnText}>Open Settings</Text>
            </TouchableOpacity>
          )}

          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: colors.border }]}
              onPress={onClose}
            >
              <Text
                style={[
                  styles.secondaryBtnText,
                  { color: colors.textSecondary },
                ]}
              >
                Not now
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: colors.primary }]}
              onPress={onRetry}
            >
              <Text
                style={[styles.secondaryBtnText, { color: colors.primary }]}
              >
                Try again
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FEF3C7",
    borderBottomWidth: 1,
    borderBottomColor: "#F59E0B",
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
  },
  bannerTitle: { fontSize: 12, fontWeight: "800", color: "#92400E" },
  bannerSub: { fontSize: 11, color: "#B45309", marginTop: 1 },
  bannerBtn: {
    backgroundColor: "#D97706",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  bannerBtnText: { color: "#FFF", fontSize: 11, fontWeight: "800" },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.lg,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: "center",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFEDD5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  title: { fontSize: FONTS.sizes.xl, fontWeight: "900", textAlign: "center" },
  subtitle: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  stepsBox: {
    width: "100%",
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: 10,
    marginBottom: SPACING.md,
  },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#EA580C",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: { color: "#FFF", fontSize: 11, fontWeight: "800" },
  stepText: { flex: 1, fontSize: 12, fontWeight: "600" },
  primaryBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    marginBottom: 10,
  },
  primaryBtnText: { color: "#FFF", fontSize: 14, fontWeight: "800" },
  row: { flexDirection: "row", gap: 10, width: "100%" },
  secondaryBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 11,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  secondaryBtnText: { fontSize: 13, fontWeight: "700" },
});
