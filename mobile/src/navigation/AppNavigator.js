import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';
import { LoadingSpinner, Badge } from '../components/common/SharedComponents';
import { View } from 'react-native';

// Auth screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OtpScreen from '../screens/auth/OtpScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Main screens
import HomeScreen from '../screens/home/HomeScreen';
import RoutesAndFaresScreen from '../screens/routes/RoutesAndFaresScreen';
import RouteDetailScreen from '../screens/map/RouteDetailScreen';
import FareMatrixScreen from '../screens/fare/FareMatrixScreen';
import RideTrackerScreen from '../screens/ride/RideTrackerScreen';
import AssistantScreen from '../screens/assistant/AssistantScreen';
import WeatherScreen from '../screens/weather/WeatherScreen';
import ComplaintsListScreen from '../screens/complaints/ComplaintsListScreen';
import SubmitComplaintScreen from '../screens/complaints/SubmitComplaintScreen';
import ComplaintDetailScreen from '../screens/complaints/ComplaintDetailScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';
import CommuterRightsScreen from '../screens/profile/CommuterRightsScreen';
import GuestProfileScreen from '../screens/profile/GuestProfileScreen';

// Admin screens
import AdminPanelScreen from '../screens/admin/AdminPanelScreen';
import SendNotificationScreen from '../screens/admin/SendNotificationScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack
const AuthStack = ({ initialRouteName = 'Welcome' }) => (
  <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="Otp" component={OtpScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </Stack.Navigator>
);

// Home Stack
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain" component={HomeScreen} />
    <Stack.Screen name="Weather" component={WeatherScreen} options={{ headerShown: true, title: 'Dagupan Weather & Flood Advisory' }} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: true, title: 'Notifications' }} />
    <Stack.Screen name="CommuterRights" component={CommuterRightsScreen} options={{ headerShown: true, title: 'Commuter Rights' }} />
    <Stack.Screen name="SubmitComplaint" component={SubmitComplaintScreen} options={{ headerShown: true, title: 'Report Complaint' }} />
    <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ headerShown: true, title: 'Change Password' }} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: true, title: 'Reset Password' }} />
  </Stack.Navigator>
);

// Combined Routes & Fares Stack
const RoutesAndFaresStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="RoutesAndFaresMain" component={RoutesAndFaresScreen} />
    <Stack.Screen name="RouteDetail" component={RouteDetailScreen} options={{ headerShown: true, title: 'Route Details' }} />
    <Stack.Screen name="FareMatrix" component={FareMatrixScreen} options={{ headerShown: true, title: 'Fare Matrix' }} />
  </Stack.Navigator>
);

// Live Ride Tracker Stack
const RideStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="RideTracker" component={RideTrackerScreen} />
  </Stack.Navigator>
);

// More Stack (Commuter features)
const MoreStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="ComplaintsList" component={ComplaintsListScreen} options={{ headerShown: true, title: 'My Complaints' }} />
    <Stack.Screen name="SubmitComplaint" component={SubmitComplaintScreen} options={{ headerShown: true, title: 'Report Complaint' }} />
    <Stack.Screen name="ComplaintDetail" component={ComplaintDetailScreen} options={{ headerShown: true, title: 'Complaint Details' }} />
    <Stack.Screen name="CommuterRights" component={CommuterRightsScreen} options={{ headerShown: true, title: 'Commuter Rights' }} />
    <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ headerShown: true, title: 'Change Password' }} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: true, title: 'Reset Password' }} />
    <Stack.Screen name="AdminPanel" component={AdminPanelScreen} options={{ headerShown: true, title: 'Admin Panel' }} />
    <Stack.Screen name="SendNotification" component={SendNotificationScreen} options={{ headerShown: true, title: 'Send Notification' }} />
  </Stack.Navigator>
);

// Guest Tab Navigator (limited access)
const GuestTabs = () => {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: 6,
          paddingTop: 4,
          height: 58,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Home: 'home',
            RoutesAndFares: 'map-marker-radius',
            Ride: 'steering',
            Assistant: 'robot',
            Account: 'account-outline',
          };
          return <MaterialCommunityIcons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen
        name="RoutesAndFares"
        component={RoutesAndFaresStack}
        options={{ title: 'Routes & Fares' }}
      />
      <Tab.Screen
        name="Ride"
        component={RideStack}
        options={{ title: 'Ride' }}
      />
      <Tab.Screen name="Assistant" component={AssistantScreen} />
      <Tab.Screen name="Account" component={GuestProfileScreen} />
    </Tab.Navigator>
  );
};

// Main Tab Navigator (authenticated)
const MainTabs = () => {
  const { colors } = useTheme();
  const { unreadCount } = useNotifications();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: 6,
          paddingTop: 4,
          height: 58,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Home: 'home',
            RoutesAndFares: 'map-marker-radius',
            Ride: 'steering',
            Assistant: 'robot',
            More: 'menu',
          };
          return (
            <View>
              <MaterialCommunityIcons name={icons[route.name]} size={size} color={color} />
              {route.name === 'More' && <Badge count={unreadCount} />}
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen
        name="RoutesAndFares"
        component={RoutesAndFaresStack}
        options={{ title: 'Routes & Fares' }}
      />
      <Tab.Screen
        name="Ride"
        component={RideStack}
        options={{ title: 'Ride' }}
      />
      <Tab.Screen name="Assistant" component={AssistantScreen} />
      <Tab.Screen name="More" component={MoreStack} />
    </Tab.Navigator>
  );
};

// App Navigator
const AppNavigator = () => {
  const { user, isLoading, isGuest, initialAuthScreen } = useAuth();
  const { colors } = useTheme();

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
      regular: { fontFamily: 'System', fontWeight: '400' },
      medium: { fontFamily: 'System', fontWeight: '500' },
      bold: { fontFamily: 'System', fontWeight: '700' },
      heavy: { fontFamily: 'System', fontWeight: '900' },
    },
  };

  return (
    <NavigationContainer theme={customTheme}>
      {user ? (
        <MainTabs />
      ) : isGuest ? (
        <GuestTabs />
      ) : (
        <AuthStack initialRouteName={initialAuthScreen || 'Welcome'} />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
