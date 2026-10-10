import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import { usersAPI } from "../../api/services";
import { FONTS, SPACING, RADIUS } from "../../utils/constants";
import { touchHitSlop, MIN_TOUCH_TARGET } from "../../utils/responsive";

const DeleteAccountModal = ({ visible, onClose }) => {
  const { colors, isDark } = useTheme();
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useFeedback();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = Explanatory warning, 2 = Confirmation challenge

  const resetModal = () => {
    setConfirmText("");
    setPassword("");
    setLoading(false);
    setStep(1);
    if (onClose) onClose();
  };

  const isConfirmed = confirmText.trim().toUpperCase() === "DELETE";

  const handleDeleteAccount = async () => {
    if (!isConfirmed) return;

    setLoading(true);
    try {
      await usersAPI.deleteMyAccount({ password: password.trim() || undefined });

      resetModal();
      await logout();

      showSuccess(
        "Account Deleted",
        "Your commuter account and personal data have been permanently removed.",
      );
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete account. Please try again.";
      showError("Account Deletion Failed", msg);
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={resetModal}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: colors.surface,
              maxWidth: isTablet ? 520 : "92%",
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          {/* Danger Header Badge */}
          <View style={styles.header}>
            <View style={styles.dangerIconBadge}>
              <MaterialCommunityIcons
                name="alert-octagon"
                size={32}
                color="#DC2626"
              />
            </View>

            <Text
              style={[styles.headerTitle, { color: colors.textPrimary }]}
            >
              Delete Commuter Account
            </Text>

            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              App Store & Google Play Policy Compliant Deletion
            </Text>
          </View>

          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {step === 1 ? (
              <>
                {/* Warning notice box */}
                <View
                  style={[
                    styles.warningBox,
                    {
                      backgroundColor: isDark ? "#450A0A" : "#FEF2F2",
                      borderColor: isDark ? "#991B1B" : "#FCA5A5",
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="information-outline"
                    size={20}
                    color="#DC2626"
                  />
                  <Text
                    style={[
                      styles.warningBoxText,
                      { color: isDark ? "#FECACA" : "#991B1B" },
                    ]}
                  >
                    This action is permanent and cannot be undone. All data
                    associated with {user?.email} will be immediately erased.
                  </Text>
                </View>

                {/* What gets deleted list */}
                <Text
                  style={[styles.listHeader, { color: colors.textPrimary }]}
                >
                  The following data will be permanently removed:
                </Text>

                <View style={styles.dataPointRow}>
                  <MaterialCommunityIcons
                    name="account-remove-outline"
                    size={20}
                    color="#DC2626"
                  />
                  <Text
                    style={[styles.dataPointText, { color: colors.textSecondary }]}
                  >
                    Your commuter profile, full name, and registered email address
                  </Text>
                </View>

                <View style={styles.dataPointRow}>
                  <MaterialCommunityIcons
                    name="map-clock-outline"
                    size={20}
                    color="#DC2626"
                  />
                  <Text
                    style={[styles.dataPointText, { color: colors.textSecondary }]}
                  >
                    All personal ride history, receipts, and route bookmarks
                  </Text>
                </View>

                <View style={styles.dataPointRow}>
                  <MaterialCommunityIcons
                    name="shield-key-outline"
                    size={20}
                    color="#DC2626"
                  />
                  <Text
                    style={[styles.dataPointText, { color: colors.textSecondary }]}
                  >
                    Authentication refresh tokens, password hashes, and OTP codes
                  </Text>
                </View>

                <View style={styles.dataPointRow}>
                  <MaterialCommunityIcons
                    name="file-document-remove-outline"
                    size={20}
                    color="#DC2626"
                  />
                  <Text
                    style={[styles.dataPointText, { color: colors.textSecondary }]}
                  >
                    Personal identification attached to submitted complaints
                  </Text>
                </View>
              </>
            ) : (
              <>
                {/* Step 2 Challenge Input */}
                <Text
                  style={[styles.challengeInstructions, { color: colors.textPrimary }]}
                >
                  To verify your intent, please type{" "}
                  <Text style={styles.boldRed}>DELETE</Text> in the field below:
                </Text>

                <TextInput
                  style={[
                    styles.challengeInput,
                    {
                      backgroundColor: colors.background,
                      borderColor: isConfirmed ? "#DC2626" : colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder="Type DELETE to confirm"
                  placeholderTextColor={colors.textMuted}
                  value={confirmText}
                  onChangeText={setConfirmText}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />

                <Text
                  style={[
                    styles.optionalPasswordLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Account Password (Optional verification):
                </Text>

                <TextInput
                  style={[
                    styles.challengeInput,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                {
                  borderColor: colors.border,
                  backgroundColor: isDark ? colors.background : "#F1F5F9",
                  minHeight: MIN_TOUCH_TARGET,
                },
              ]}
              onPress={step === 2 ? () => setStep(1) : resetModal}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.cancelButtonText, { color: colors.textSecondary }]}
              >
                {step === 2 ? "Back" : "Keep Account"}
              </Text>
            </TouchableOpacity>

            {step === 1 ? (
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  {
                    backgroundColor: "#DC2626",
                    minHeight: MIN_TOUCH_TARGET,
                  },
                ]}
                onPress={() => setStep(2)}
                activeOpacity={0.8}
              >
                <Text style={styles.continueButtonText}>
                  Continue to Delete
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.deleteButton,
                  {
                    backgroundColor: isConfirmed ? "#DC2626" : "#FCA5A5",
                    minHeight: MIN_TOUCH_TARGET,
                  },
                ]}
                onPress={handleDeleteAccount}
                disabled={!isConfirmed || loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="trash-can-outline"
                      size={18}
                      color="#FFFFFF"
                    />
                    <Text style={styles.deleteButtonText}>
                      Permanently Delete
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "100%",
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    overflow: "hidden",
  },
  header: {
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  dangerIconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "800",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
    textAlign: "center",
  },
  bodyScroll: {
    maxHeight: 280,
  },
  bodyContent: {
    paddingVertical: SPACING.xs,
    gap: SPACING.md,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  warningBoxText: {
    fontSize: FONTS.sizes.xs,
    lineHeight: 18,
    flex: 1,
    fontWeight: "600",
  },
  listHeader: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
    marginTop: SPACING.xs,
  },
  dataPointRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
  },
  dataPointText: {
    fontSize: FONTS.sizes.xs,
    lineHeight: 18,
    flex: 1,
  },
  challengeInstructions: {
    fontSize: FONTS.sizes.sm,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
  boldRed: {
    color: "#DC2626",
    fontWeight: "800",
  },
  challengeInput: {
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: FONTS.sizes.md,
    fontWeight: "600",
  },
  optionalPasswordLabel: {
    fontSize: FONTS.sizes.xs,
    marginTop: SPACING.sm,
  },
  footerRow: {
    flexDirection: "row",
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  cancelButton: {
    flex: 1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.md,
  },
  cancelButtonText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  continueButton: {
    flex: 1.2,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.md,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  deleteButton: {
    flex: 1.4,
    borderRadius: RADIUS.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: SPACING.md,
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
});

export default DeleteAccountModal;
