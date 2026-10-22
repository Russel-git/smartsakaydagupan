import { useState } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useNotifications } from "../contexts/NotificationContext";
import { LoadingSpinner, Badge } from "../components/common/SharedComponents";
import { View, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LocationProvider } from "../contexts/LocationContext";

// Splash Screen
import AnimatedIntroScreen from "../screens/splash_screen/AnimatedIntroScreen";

// Landing Page Screens
import WelcomeScreen from "../screens/landing_page/WelcomeScreen";
import GetStartedScreen from "../screens/landing_page/GetStartedScreen";

// Auth screens
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import OtpScreen from "../screens/auth/OtpScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";

// Main screens
import HomeScreen from "../screens/home/HomeScreen";
import RoutesAndFaresScreen from "../screens/routes/RoutesAndFaresScreen";
import RouteDetailScreen from "../screens/map/RouteDetailScreen";
import FareMatrixScreen from "../screens/fare/FareMatrixScreen";
import PinpointFareScreen from "../screens/fare/PinpointFareScreen";
import SakayCircleScreen from "../screens/circle/SakayCircleScreen";
import RideTrackerScreen from "../screens/ride/RideTrackerScreen";
import RideHistoryScreen from "../screens/ride/RideHistoryScreen";
import AssistantScreen from "../screens/assistant/AssistantScreen";
import WeatherScreen from "../screens/weather/WeatherScreen";
import ComplaintsListScreen from "../screens/complaints/ComplaintsListScreen";
import SubmitComplaintScreen from "../screens/complaints/SubmitComplaintScreen";
import ComplaintDetailScreen from "../screens/complaints/ComplaintDetailScreen";
import NotificationsScreen from "../screens/notifications/NotificationsScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import ChangePasswordScreen from "../screens/profile/ChangePasswordScreen";
import CommuterRightsScreen from "../screens/profile/CommuterRightsScreen";
import TermsScreen from "../screens/profile/TermsScreen";
import GuestProfileScreen from "../screens/profile/GuestProfileScreen";

// Admin screens
import AdminPanelScreen from "../screens/admin/AdminPanelScreen";
import SendNotificationScreen from "../screens/admin/SendNotificationScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack
const AuthStack = () => (
  <Stack.Navigator
    initialRouteName={"Welcome - SmartSakay"}
    screenOptions={{ headerShown: false }}
  >
    <Stack.Screen name="Welcome - SmartSakay" component={WelcomeScreen} />
    <Stack.Screen
      name="Get Started - SmartSakay"
      component={GetStartedScreen}
    />
    <Stack.Screen name="Login - SmartSakay" component={LoginScreen} />
    <Stack.Screen name="Register - SmartSakay" component={RegisterScreen} />
    <Stack.Screen name="OTP - SmartSakay" component={OtpScreen} />
    <Stack.Screen
      name="Forgot Password - SmartSakay"
      component={ForgotPasswordScreen}
    />
    <Stack.Screen name="Terms" component={TermsScreen} />
  </Stack.Navigator>
);

// Home Stack
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Home - SmartSakay" component={HomeScreen} />
    <Stack.Screen
      name="Weather"
      component={WeatherScreen}
      options={{ headerShown: true, title: "Weather" }}
    />
    <Stack.Screen
      name="Notifications"
      component={NotificationsScreen}
      options={{ headerShown: true, title: "Notifications" }}
    />
    <Stack.Screen
      name="CommuterRights"
      component={CommuterRightsScreen}
      options={{ headerShown: true, title: "Commuter Rights" }}
    />
    <Stack.Screen
      name="ComplaintsList"
      component={ComplaintsListScreen}
      options={{ headerShown: true, title: "My Complaints" }}
    />
    <Stack.Screen
      name="SubmitComplaint"
      component={SubmitComplaintScreen}
      options={{ headerShown: true, title: "Report Grievance" }}
    />
    <Stack.Screen
      name="ComplaintDetail"
      component={ComplaintDetailScreen}
      options={{ headerShown: true, title: "Complaint Details" }}
    />
    <Stack.Screen
      name="ChangePassword"
      component={ChangePasswordScreen}
      options={{ headerShown: true, title: "Change Password" }}
    />
    <Stack.Screen
      name="ForgotPassword"
      component={ForgotPasswordScreen}
      options={{ headerShown: true, title: "Reset Password" }}
    />
    <Stack.Screen
      name="Terms"
      component={TermsScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

// Combined Routes & Fares Stack
const RoutesAndFaresStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen
      name="Routes & Fares - SmartSakay"
      component={RoutesAndFaresScreen}
    />
    <Stack.Screen
      name="RouteDetail"
      component={RouteDetailScreen}
      options={{ headerShown: true, title: "Route Details" }}
    />
    <Stack.Screen
      name="FareMatrix"
      component={FareMatrixScreen}
      options={{ headerShown: true, title: "Fare Matrix" }}
    />
    <Stack.Screen
      name="RideHistory"
      component={RideHistoryScreen}
      options={{ headerShown: true, title: "Ride History" }}
    />
    <Stack.Screen
      name="RideTracker"
      component={RideTrackerScreen}
      options={{ headerShown: true, title: "Jeepney Ride Tracker" }}
    />
    <Stack.Screen
      name="PinpointFare"
      component={PinpointFareScreen}
      options={{ headerShown: true, title: "Solo Ride / Visitor" }}
    />
    <Stack.Screen
      name="SakayCircle"
      component={SakayCircleScreen}
      options={{ headerShown: true, title: "SakayCircle" }}
    />
  </Stack.Navigator>
);

const Assistant = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Assistant - SmartSakay" component={AssistantScreen} />
  </Stack.Navigator>
);

// More Stack (Commuter features)
const MoreStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Profile - SmartSakay" component={ProfileScreen} />
    <Stack.Screen
      name="RideHistory"
      component={RideHistoryScreen}
      options={{ headerShown: true, title: "Ride History" }}
    />
    <Stack.Screen
      name="ComplaintsList"
      component={ComplaintsListScreen}
      options={{ headerShown: true, title: "My Complaints" }}
    />
    <Stack.Screen
      name="SubmitComplaint"
      component={SubmitComplaintScreen}
      options={{ headerShown: true, title: "Report Complaint" }}
    />
    <Stack.Screen
      name="ComplaintDetail"
      component={ComplaintDetailScreen}
      options={{ headerShown: true, title: "Complaint Details" }}
    />
    <Stack.Screen
      name="CommuterRights"
      component={CommuterRightsScreen}
      options={{ headerShown: true, title: "Commuter Rights" }}
    />
    <Stack.Screen
      name="ChangePassword"
      component={ChangePasswordScreen}
      options={{ headerShown: true, title: "Change Password" }}
    />
    <Stack.Screen
      name="ForgotPassword"
      component={ForgotPasswordScreen}
      options={{ headerShown: true, title: "Reset Password" }}
    />
    <Stack.Screen
      name="AdminPanel"
      component={AdminPanelScreen}
      options={{ headerShown: true, title: "Admin Panel" }}
    />
    <Stack.Screen
      name="SendNotification"
      component={SendNotificationScreen}
      options={{ headerShown: true, title: "Send Notification" }}
    />
    <Stack.Screen
      name="Terms"
      component={TermsScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

const Guest = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Account - SmartSakay" component={GuestProfileScreen} />
  </Stack.Navigator>
);

// Guest Tab Navigator (limited access)
const GuestTabs = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(
    insets.bottom,
    Platform.OS === "android" ? 18 : 12,
  );
  const tabHeight = 62 + bottomPadding;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: bottomPadding,
          paddingTop: 8,
          height: tabHeight,
          elevation: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Home: "home",
            RoutesAndFares: "routes",
            Assistant: "robot",
            Account: "account-outline",
          };
          return (
            <MaterialCommunityIcons
              name={icons[route.name]}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen
        name="RoutesAndFares"
        component={RoutesAndFaresStack}
        options={{ title: "Routes & Fares" }}
      />
      <Tab.Screen name="Assistant" component={Assistant} />
      <Tab.Screen name="Account" component={Guest} />
    </Tab.Navigator>
  );
};

// Main Tab Navigator (authenticated)
const MainTabs = () => {
  const { colors } = useTheme();
  const { unreadCount } = useNotifications();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(
    insets.bottom,
    Platform.OS === "android" ? 18 : 12,
  );
  const tabHeight = 62 + bottomPadding;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: bottomPadding,
          paddingTop: 8,
          height: tabHeight,
          elevation: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Home: "home",
            RoutesAndFares: "routes",
            Assistant: "robot",
            Profile: "account",
          };
          return (
            <View>
              <MaterialCommunityIcons
                name={icons[route.name]}
                size={size}
                color={color}
              />
              {route.name === "Profile" && <Badge count={unreadCount} />}
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen
        name="RoutesAndFares"
        component={RoutesAndFaresStack}
        options={{ title: "Routes & Fares" }}
      />
      <Tab.Screen name="Assistant" component={Assistant} />
      <Tab.Screen name="Profile" component={MoreStack} />
    </Tab.Navigator>
  );
};

// App Navigator
const AppNavigator = () => {
  const { user, isLoading, isGuest, initialAuthScreen } = useAuth();
  const { colors } = useTheme();

  const [showIntro, setShowIntro] = useState(true);

  if (showIntro) {
    return <AnimatedIntroScreen onFinish={() => setShowIntro(false)} />;
  }

  if (isLoading) {
    return <LoadingSpinner text="Loading SmartSakay..." />;
  }

  const customTheme = {
    ...DefaultTheme,
    dark: false,
    colors: {
      ...DefaultTheme?.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.border,
      notification: colors.error,
    },
    fonts: DefaultTheme?.fonts || {
      regular: { fontFamily: "System", fontWeight: "400" },
      medium: { fontFamily: "System", fontWeight: "500" },
      bold: { fontFamily: "System", fontWeight: "700" },
      heavy: { fontFamily: "System", fontWeight: "900" },
    },
  };

  return (
    <LocationProvider>
      <NavigationContainer theme={customTheme}>
        {user ? (
          <MainTabs />
        ) : isGuest ? (
          <GuestTabs />
        ) : (
          <AuthStack
            initialRouteName={initialAuthScreen || "Welcome - SmartSakay"}
          />
        )}
      </NavigationContainer>
    </LocationProvider>
  );
};

export default AppNavigator;
