import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { FeedbackProvider } from './src/contexts/FeedbackContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import AppNavigator from './src/navigation/AppNavigator';

LogBox.ignoreLogs([
  'Cannot connect to Expo CLI',
  'The action \'NAVIGATE\'',
  'Browser geolocation fallback',
  '"sparkles" is not a valid icon name',
  'is not a valid icon name for family',
]);


class MobileErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('SmartSakay Mobile Error:', error, errorInfo);
  }

  handleReload = () => {
    if (typeof window !== 'undefined' && window.location) {
      window.location.reload();
    } else {
      this.setState({ hasError: false, error: null });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>SmartSakay Commuter</Text>
          <Text style={errorStyles.subtitle}>Something went wrong while rendering the screen.</Text>
          <Text style={errorStyles.errorText}>{this.state.error?.message || 'Unexpected error'}</Text>
          <TouchableOpacity style={errorStyles.btn} onPress={this.handleReload}>
            <Text style={errorStyles.btnText}>Reload App</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#F87171',
    textAlign: 'center',
    marginBottom: 24,
  },
  btn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default function App() {
  return (
    <MobileErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider style={{ flex: 1 }}>
          <ThemeProvider>
            <FeedbackProvider>
              <AuthProvider>
                <NotificationProvider>
                  <StatusBar style="auto" />
                  <AppNavigator />
                </NotificationProvider>
              </AuthProvider>
            </FeedbackProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </MobileErrorBoundary>
  );
}
