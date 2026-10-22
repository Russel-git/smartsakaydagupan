import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StatusBar,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import { FONTS, SPACING, RADIUS } from "../../utils/constants";
import { isValidEmail } from "../../utils/helpers";
import { saveMunicipality, getMunicipality } from "../../utils/storage";

const MUNICIPALITIES = [
  { id: "Dagupan", name: "Dagupan City", subtitle: "Commercial Center & Coastal Hub" },
  { id: "Calasiao", name: "Calasiao", subtitle: "Putubongbong Capital & Highway Corridor" },
  { id: "Binmaley", name: "Binmaley", subtitle: "Seafood Capital & Western Highway" },
  { id: "Lingayen", name: "Lingayen", subtitle: "Provincial Capital & Historic Gulf" },
  { id: "Mangaldan", name: "Mangaldan", subtitle: "Agricultural & Northern Gateway" },
];

const LoginScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { login, error, setError } = useAuth();
  const { showSuccess, showError } = useFeedback();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [municipality, setMunicipality] = useState("Dagupan");
  const [showMunicipalityPicker, setShowMunicipalityPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    (async () => {
      const saved = await getMunicipality();
      if (saved) setMunicipality(saved);
    })();
  }, []);

  const topInset =
    Platform.OS === "android"
      ? Math.max(insets.top, StatusBar.currentHeight || 28)
      : insets.top;

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = "Email is required";
    else if (!isValidEmail(email)) e.email = "Invalid email format";
    if (!password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    setError(null);
    try {
      await saveMunicipality(municipality);
      const res = await login(email.trim(), password, municipality);
      const userName = res?.data?.user?.firstName || "Commuter";
      const muniName = MUNICIPALITIES.find((m) => m.id === municipality)?.name || municipality;
      showSuccess(
        "Successfully Logged In!",
        `Welcome back, ${userName}! Ready to navigate ${muniName}.`,
      );
    } catch (e) {
      showError(
        "Authentication Failed",
        e.message || "Please check your credentials and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("Welcome - SmartSakay");
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={Platform.OS === "android"}
      />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topInset + 16,
            paddingBottom: Math.max(insets.bottom, 20) + 24,
            paddingHorizontal: isTablet ? SPACING.xxxl : SPACING.xxl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.innerWrapper, { maxWidth: isTablet ? 460 : "100%" }]}
        >
          <TouchableOpacity
            onPress={handleBack}
            style={[
              styles.backBtn,
              { backgroundColor: isDark ? colors.surface : "#F1F5F9" },
            ]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={22}
              color={colors.textPrimary}
            />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text
              style={[styles.title, { color: colors.textPrimary }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              Welcome back
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Sign in to your SmartSakay account
            </Text>
          </View>

          {Boolean(error) ? (
            <View
              style={[
                styles.errorBox,
                {
                  backgroundColor: colors.error + "15",
                  borderColor: colors.error + "30",
                },
              ]}
            >
              <MaterialCommunityIcons
                name="alert-circle"
                size={18}
                color={colors.error}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {error}
                </Text>
                {typeof error === "string" &&
                error.toLowerCase().includes("not verified") ? (
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("Otp", {
                        email: email.trim(),
                        type: "registration",
                      })
                    }
                    style={{ marginTop: 8 }}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Text
                      style={{
                        color: colors.primary,
                        fontWeight: "700",
                        fontSize: 13,
                      }}
                    >
                      Enter Verification Code →
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ) : null}

          {/* Transit Area / Municipality Dropdown Selector */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: isDark ? "#93C5FD" : "#2563EB",
                marginBottom: 6,
                lineHeight: 18,
              }}
            >
              Choose your LGU to report your complain, ride and keep updated
            </Text>
            <Text
              style={[
                styles.label,
                { color: colors.textSecondary, marginBottom: 8, fontSize: 13, fontWeight: "600" },
              ]}
            >
              Transit Area / Municipality
            </Text>
            <TouchableOpacity
              onPress={() => setShowMunicipalityPicker(!showMunicipalityPicker)}
              style={[
                styles.pickerTrigger,
                {
                  backgroundColor: colors.surface,
                  borderColor: showMunicipalityPicker ? colors.primary : colors.border,
                },
              ]}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    backgroundColor: colors.primary + "15",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MaterialCommunityIcons
                    name="city-variant-outline"
                    size={18}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textPrimary }}>
                    {MUNICIPALITIES.find((m) => m.id === municipality)?.name || municipality}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    {MUNICIPALITIES.find((m) => m.id === municipality)?.subtitle || "Pangasinan Transit Zone"}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name={showMunicipalityPicker ? "chevron-up" : "chevron-down"}
                size={22}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {showMunicipalityPicker && (
              <View
                style={[
                  styles.dropdownList,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                {MUNICIPALITIES.map((item) => {
                  const isSelected = item.id === municipality;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={async () => {
                        setMunicipality(item.id);
                        setShowMunicipalityPicker(false);
                        await saveMunicipality(item.id);
                      }}
                      style={[
                        styles.dropdownItem,
                        isSelected && { backgroundColor: colors.primary + "15" },
                      ]}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: isSelected ? "700" : "600",
                            color: isSelected ? colors.primary : colors.textPrimary,
                          }}
                        >
                          {item.name}
                        </Text>
                        <Text style={{ fontSize: 11, color: colors.textMuted }}>
                          {item.subtitle}
                        </Text>
                      </View>
                      {isSelected && (
                        <MaterialCommunityIcons
                          name="check-circle"
                          size={18}
                          color={colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          <Input
            label="Email Address"
            placeholder="you@example.com"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setErrors({});
              setError(null);
            }}
            error={errors.email}
            keyboardType="email-address"
            leftIcon="email-outline"
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setErrors({});
              setError(null);
            }}
            error={errors.password}
            secureTextEntry
            leftIcon="lock-outline"
          />

          <TouchableOpacity
            onPress={() => navigation.navigate("Forgot Password - SmartSakay")}
            style={styles.forgotLink}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.8}
          >
            <Text style={[styles.forgotText, { color: colors.primary }]}>
              Forgot password?
            </Text>
          </TouchableOpacity>

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            size="lg"
            fullWidth
            style={styles.loginBtn}
          />

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Don't have an account?{" "}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Register - SmartSakay")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.8}
            >
              <Text style={[styles.footerLink, { color: colors.primary }]}>
                Create one
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  innerWrapper: {
    width: "100%",
    alignSelf: "center",
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xl,
  },
  header: { marginBottom: SPACING.xxl },
  title: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: "800",
    marginBottom: SPACING.xs,
  },
  subtitle: { fontSize: FONTS.sizes.md, lineHeight: 22 },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  errorText: { fontSize: FONTS.sizes.sm, flex: 1, lineHeight: 19 },
  forgotLink: {
    alignSelf: "flex-end",
    marginBottom: SPACING.xxl,
    marginTop: -SPACING.sm,
  },
  forgotText: { fontSize: FONTS.sizes.sm, fontWeight: "600" },
  loginBtn: { marginBottom: SPACING.xxl },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: { fontSize: FONTS.sizes.md },
  footerLink: { fontSize: FONTS.sizes.md, fontWeight: "700" },
  pickerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
  },
  dropdownList: {
    marginTop: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(150, 150, 150, 0.15)",
  },
});

export default LoginScreen;
