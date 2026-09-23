import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../../components/common/SharedComponents';
import { FONTS, SPACING, RADIUS } from '../../utils/constants';

const RouteDetailScreen = ({ route: navRoute }) => {
  const route = navRoute.params?.route;
  const { colors } = useTheme();

  if (!route) return null;

  const hasGpxPath = route.path && route.path.length > 0;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={[styles.categoryBadge, { backgroundColor: route.category === 'city' ? '#FBBF24' : '#34D399' }]}>
          <Text style={styles.categoryText}>
            {route.category.toUpperCase()} JEEPNEY • {route.isLoop !== false ? 'CONTINUOUS LOOP' : 'STATIC CORRIDOR'}
          </Text>
        </View>
        <Text style={styles.routeName}>{route.name}</Text>
        <Text style={styles.routeDistance}>Loop / Distance: ~{route.distanceKm} km</Text>
      </View>

      <View style={styles.content}>
        {/* Static Transit Corridor Card */}
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Transit Corridor Details</Text>
          <View style={styles.corridorBox}>
            <MaterialCommunityIcons name="transit-connection-variant" size={22} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.corridorLabel, { color: colors.textMuted }]}>Official Loop / Path</Text>
              <Text style={[styles.corridorValue, { color: colors.textPrimary }]}>
                {route.corridor || route.description || 'Continuous municipal transit corridor'}
              </Text>
            </View>
          </View>

          {route.description ? (
            <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
              {route.description}
            </Text>
          ) : null}

          {/* GPX Track Status */}
          {hasGpxPath ? (
            <View style={styles.gpxStatusBanner}>
              <MaterialCommunityIcons name="check-decagram" size={20} color="#10B981" />
              <View style={{ flex: 1 }}>
                <Text style={styles.gpxTitle}>GPX Street Track Mapped</Text>
                <Text style={styles.gpxSub}>
                  {route.path.length} GPS track coordinates mapped to Dagupan City road network
                </Text>
              </View>
            </View>
          ) : null}
        </Card>

        {/* Downtown Dagupan Central Staging Hub */}
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Boarding Area & Central Staging</Text>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-marker-radius" size={20} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.textPrimary, fontWeight: '600' }]}>
              Downtown Dagupan (Central Hub)
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="information-outline" size={20} color={colors.textMuted} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              All jeepneys can be seen and boarded in Downtown Dagupan along Perez Blvd and A.B. Fernandez Ave.
            </Text>
          </View>
        </Card>

        {/* Operating Hours & Dispatch */}
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Service Schedule</Text>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="clock-outline" size={20} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.textPrimary }]}>
              {route.operatingHours?.start || '04:00'} — {route.operatingHours?.end || '21:00'} (Daily)
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="repeat" size={20} color={colors.secondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              {route.isLoop !== false ? 'Continuous loop operation without fixed terminus' : 'Fixed point-to-point corridor'}
            </Text>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 50,
    paddingBottom: SPACING.xxl,
    paddingHorizontal: SPACING.xxl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.sm,
  },
  categoryText: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: '#0F172A' },
  routeName: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: '#FFFFFF' },
  routeDistance: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.85)', marginTop: SPACING.xs },
  content: { padding: SPACING.lg, gap: SPACING.md },
  sectionTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', marginBottom: SPACING.md },
  corridorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    backgroundColor: 'rgba(37,99,235,0.05)',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  corridorLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
  corridorValue: { fontSize: FONTS.sizes.sm, fontWeight: '700', lineHeight: 20 },
  descriptionText: { fontSize: FONTS.sizes.xs + 1, lineHeight: 18, marginTop: 4 },
  gpxStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#ECFDF5',
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  gpxTitle: { fontSize: FONTS.sizes.xs, fontWeight: '800', color: '#065F46' },
  gpxSub: { fontSize: 11, color: '#047857', marginTop: 1 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.sm },
  infoText: { fontSize: FONTS.sizes.sm, flex: 1 },
});

export default RouteDetailScreen;
