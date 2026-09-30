import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../../components/common/SharedComponents';
import { FONTS, SPACING, RADIUS } from '../../utils/constants';

const RIGHTS = [
  { icon: 'cash-check', title: 'Pay only LTFRB-approved fare', desc: 'Drivers cannot charge more than the approved fare rate.' },
  { icon: 'sale', title: '20% discount for students, seniors, PWDs', desc: 'Present a valid ID to receive your discount.' },
  { icon: 'hand-back-right', title: 'Refuse overcharging', desc: 'You have the right to pay only the correct fare.' },
  { icon: 'phone', title: 'File complaints with LTFRB', desc: 'Call hotline 1342 or file through the LTFRB website.' },
  { icon: 'shield-check', title: 'Safe and roadworthy vehicle', desc: 'Vehicles must pass inspection and be properly maintained.' },
  { icon: 'view-dashboard', title: 'Displayed fare matrix', desc: 'Fare information must be posted inside the vehicle.' },
  { icon: 'bus-stop-covered', title: 'Proper loading/unloading zones', desc: 'Passengers must be picked up and dropped off at designated areas.' },
];

const LINKS = [
  { label: 'Land Transportation Office (LTO)', url: 'https://lto.gov.ph', icon: 'web' },
  { label: 'LTFRB', url: 'https://ltfrb.gov.ph', icon: 'web' },
  { label: 'LTFRB Complaint Hotline: 1342', url: 'tel:1342', icon: 'phone' },
  { label: 'Department of Transportation', url: 'https://dotr.gov.ph', icon: 'web' },
];

const CommuterRightsScreen = () => {
  const { colors } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Commuter Rights</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Know your rights as a public transport commuter in the Philippines
        </Text>

        {RIGHTS.map((right, i) => (
          <Card key={i}>
            <View style={styles.rightRow}>
              <View style={[styles.rightIcon, { backgroundColor: colors.primary + '15' }]}>
                <MaterialCommunityIcons name={right.icon} size={22} color={colors.primary} />
              </View>
              <View style={styles.rightText}>
                <Text style={[styles.rightTitle, { color: colors.textPrimary }]}>{right.title}</Text>
                <Text style={[styles.rightDesc, { color: colors.textSecondary }]}>{right.desc}</Text>
              </View>
            </View>
          </Card>
        ))}

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Helpful Links</Text>
        <Card>
          {LINKS.map((link, i) => (
            <TouchableOpacity key={i} style={styles.linkRow} onPress={() => Linking.openURL(link.url)}>
              <MaterialCommunityIcons name={link.icon} size={20} color={colors.primary} />
              <Text style={[styles.linkText, { color: colors.primary }]}>{link.label}</Text>
              <MaterialCommunityIcons name="open-in-new" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </Card>

        <Text style={[styles.legal, { color: colors.textMuted }]}>
          Reference: Republic Act 7394 (Consumer Act), LTFRB Memorandum Circulars, RA 10173 (Data Privacy Act)
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.xxl },
  title: { fontSize: FONTS.sizes.xxl, fontWeight: '800' },
  subtitle: { fontSize: FONTS.sizes.sm, marginTop: SPACING.xs, marginBottom: SPACING.xxl, lineHeight: 20 },
  rightRow: { flexDirection: 'row', gap: SPACING.md },
  rightIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  rightText: { flex: 1 },
  rightTitle: { fontSize: FONTS.sizes.md, fontWeight: '700' },
  rightDesc: { fontSize: FONTS.sizes.sm, marginTop: 2, lineHeight: 20 },
  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', marginBottom: SPACING.md, marginTop: SPACING.md },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.md },
  linkText: { flex: 1, fontSize: FONTS.sizes.md, fontWeight: '500' },
  legal: { fontSize: FONTS.sizes.xs, marginTop: SPACING.xl, textAlign: 'center', lineHeight: 18, marginBottom: SPACING.xxxl },
});

export default CommuterRightsScreen;
