import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/common/SharedComponents';
import { FONTS, SPACING, RADIUS } from '../../utils/constants';

const GuestProfileScreen = ({ navigation }) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const { exitGuestMode } = useAuth();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Header Profile Card */}
        <View style={[styles.profileHeader, { backgroundColor: colors.primary }]}>
          <View style={styles.avatarCircle}>
            <MaterialCommunityIcons name="account-outline" size={44} color="#FFFFFF" />
          </View>
          <Text style={styles.profileName}>Guest Commuter</Text>
          <View style={styles.guestBadge}>
            <MaterialCommunityIcons name="shield-outline" size={14} color="#FBBF24" />
            <Text style={styles.guestBadgeText}>Guest Session</Text>
          </View>
        </View>

        {/* Upgrade Banner */}
        <Card style={[styles.upgradeCard, { borderColor: colors.primary + '35' }]}>
          <View style={styles.upgradeHeader}>
            <View style={[styles.upgradeIconCircle, { backgroundColor: colors.primary + '18' }]}>
              <MaterialCommunityIcons name="star-four-points" size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.upgradeTitle, { color: colors.textPrimary }]}>Unlock Full Capabilities</Text>
              <Text style={[styles.upgradeSubtitle, { color: colors.textSecondary }]}>
                Register a free account to file transport complaints and chat with the AI assistant.
              </Text>
            </View>
          </View>

          <View style={styles.perksList}>
            {[
              'File and track verified complaints with LTFRB Dagupan',
              '24/7 SmartSakay AI Commuter Assistant access',
              'Real-time transit rerouting and severe weather alerts',
            ].map((perk, i) => (
              <View key={i} style={styles.perkItem}>
                <MaterialCommunityIcons name="check-circle" size={16} color="#10B981" />
                <Text style={[styles.perkItemText, { color: colors.textPrimary }]}>{perk}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => exitGuestMode('Register')}
          >
            <MaterialCommunityIcons name="account-plus" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.primaryBtnText}>Create Free Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: colors.border }]}
            onPress={() => exitGuestMode('Login')}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>Sign In to Existing Account</Text>
          </TouchableOpacity>
        </Card>

        {/* Public Commuter Resources */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Commuter Guidelines</Text>

        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.navigate('CommuterRights')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#3B82F620' }]}>
            <MaterialCommunityIcons name="scale-balance" size={20} color="#3B82F6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Commuter Rights & 20% Discount</Text>
            <Text style={[styles.menuSublabel, { color: colors.textMuted }]}>Students, Seniors, and PWD benefits</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Preferences */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 20 }]}>Preferences</Text>
        <View style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.menuIcon, { backgroundColor: '#8B5CF620' }]}>
            <MaterialCommunityIcons name="theme-light-dark" size={20} color="#8B5CF6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Dark Mode</Text>
            <Text style={[styles.menuSublabel, { color: colors.textMuted }]}>Toggle high-contrast dark theme</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={(val) => toggleTheme(val ? 'dark' : 'light')}
            trackColor={{ false: '#767577', true: colors.primary }}
          />
        </View>

        {/* Dagupan City Transit Information */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 20 }]}>Dagupan Transit Support</Text>
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => Linking.openURL('tel:0755220000').catch(() => {})}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#10B98120' }]}>
            <MaterialCommunityIcons name="phone-in-talk" size={20} color="#10B981" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Dagupan Traffic Management Hotline</Text>
            <Text style={[styles.menuSublabel, { color: colors.textMuted }]}>(075) 522-0000</Text>
          </View>
          <MaterialCommunityIcons name="open-in-new" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.footerNote}>
          <Text style={[styles.versionText, { color: colors.textMuted }]}>
            SmartSakay Dagupan v1.0.0 • Public Transit Companion
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  profileHeader: {
    paddingTop: 36,
    paddingBottom: 28,
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 20,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  guestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  guestBadgeText: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '600',
  },
  upgradeCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 20,
  },
  upgradeHeader: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  upgradeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  upgradeSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  perksList: {
    gap: 8,
    marginBottom: 18,
    paddingTop: 4,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  perkItemText: {
    fontSize: 12,
    fontWeight: '500',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    marginBottom: 10,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontWeight: '600',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginHorizontal: 20,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuSublabel: {
    fontSize: 12,
  },
  footerNote: {
    marginTop: 28,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 11,
  },
});

export default GuestProfileScreen;
