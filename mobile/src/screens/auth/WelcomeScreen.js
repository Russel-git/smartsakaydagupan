import React from 'react';
import { View, Text, StyleSheet, Image, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFeedback } from '../../contexts/FeedbackContext';
import Button from '../../components/common/Button';
import { FONTS, SPACING, RADIUS } from '../../utils/constants';

const WelcomeScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { enterGuestMode } = useAuth();
  const { showInfo } = useFeedback();

  const handleGuestMode = async () => {
    await enterGuestMode();
    showInfo('Guest Session Active', 'Browsing routes and fares in guest commuter mode.');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#1A56DB', '#1E40AF', '#0F172A']}
        style={styles.heroSection}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.logoContainer}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="bus" size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.appName}>SmartSakay</Text>
          <Text style={styles.appSubtitle}>Dagupan</Text>
        </View>
        <Text style={styles.tagline}>
          Your trusted commuter companion for{'\n'}Dagupan City and Pangasinan
        </Text>

        <View style={styles.featureRow}>
          {[
            { icon: 'cash-check', label: 'Verified Fares' },
            { icon: 'map-marker-radius', label: 'Route Finder' },
            { icon: 'robot', label: 'AI Assistant' },
          ].map((f, i) => (
            <View key={i} style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <MaterialCommunityIcons name={f.icon} size={22} color="#FBBF24" />
              </View>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <View style={styles.actionSection}>
        <Button
          title="Create Account"
          onPress={() => navigation.navigate('Register')}
          size="lg"
          style={styles.btn}
        />
        <Button
          title="Sign In"
          onPress={() => navigation.navigate('Login')}
          variant="outline"
          size="lg"
          style={styles.btn}
        />
        <Button
          title="Continue as Guest"
          onPress={handleGuestMode}
          variant="ghost"
          size="md"
          style={styles.guestBtn}
        />
        <Text style={[styles.guestNote, { color: colors.textMuted }]}>
          Guests can view fares and routes only
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroSection: {
    flex: 1.3,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.section,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  appName: {
    fontSize: FONTS.sizes.hero,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  appSubtitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '300',
    color: '#FBBF24',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginTop: -4,
  },
  tagline: {
    fontSize: FONTS.sizes.md,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xxl,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  featureItem: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureLabel: {
    fontSize: FONTS.sizes.xs,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  actionSection: {
    flex: 0.7,
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.xxxl,
    justifyContent: 'flex-start',
  },
  btn: {
    marginBottom: SPACING.md,
  },
  guestBtn: {
    marginTop: SPACING.sm,
  },
  guestNote: {
    fontSize: FONTS.sizes.xs,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
});

export default WelcomeScreen;
