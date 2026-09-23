import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { LoadingSpinner } from '../../components/common/SharedComponents';
import { faresAPI } from '../../api/services';
import { FONTS, SPACING, RADIUS } from '../../utils/constants';
import { formatPeso } from '../../utils/helpers';

const FareMatrixScreen = () => {
  const { colors } = useTheme();
  const [matrix, setMatrix] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDiscounted, setShowDiscounted] = useState(false);

  useEffect(() => {
    const loadMatrix = async () => {
      try {
        const { data } = await faresAPI.getFareMatrix();
        setMatrix(Array.isArray(data.data) ? data.data : []);
      } catch (e) {
        setMatrix([]);
      }
      setLoading(false);
    };
    loadMatrix();
  }, []);

  if (loading) return <LoadingSpinner text="Loading fare matrix..." />;

  // Group by route
  const grouped = (Array.isArray(matrix) ? matrix : []).reduce((acc, item) => {
    const routeName = item.routeId?.name || 'Unknown';
    if (!acc[routeName]) acc[routeName] = { traditional: null, modern: null, tricycle: null, distance: item.distanceKm };
    if (item.vehicleType) acc[routeName][item.vehicleType] = item;
    return acc;
  }, {});

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Fare Matrix</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          LTFRB & Dagupan City TFRB-approved fares for all PUV routes
        </Text>

        {/* Emphasized Base Fare Banner */}
        <View style={[styles.baseFareHero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.baseFareHeroHeader}>
            <Text style={styles.baseFareHeroTag}>OFFICIAL REGULATED BASE FARES</Text>
          </View>
          <View style={styles.baseFareCardsRow}>
            <View style={[styles.baseFareCard, { borderColor: '#F59E0B' }]}>
              <Text style={styles.baseFareVehicle}>🚐 Traditional</Text>
              <Text style={[styles.baseFareNum, { color: '#D97706' }]}>
                {formatPeso(showDiscounted ? 12 : 14)}
              </Text>
              <Text style={[styles.baseFareRate, { color: colors.textSecondary }]}>
                +₱2.00/km (4km)
              </Text>
            </View>

            <View style={[styles.baseFareCard, { borderColor: '#3B82F6' }]}>
              <Text style={styles.baseFareVehicle}>🚌 Modern PUJ</Text>
              <Text style={[styles.baseFareNum, { color: '#2563EB' }]}>
                {formatPeso(showDiscounted ? 14 : 17)}
              </Text>
              <Text style={[styles.baseFareRate, { color: colors.textSecondary }]}>
                +₱2.40/km (4km)
              </Text>
            </View>

            <View style={[styles.baseFareCard, { borderColor: '#10B981' }]}>
              <Text style={styles.baseFareVehicle}>🛺 Tricycle</Text>
              <Text style={[styles.baseFareNum, { color: '#059669' }]}>
                {formatPeso(showDiscounted ? 12 : 15)}
              </Text>
              <Text style={[styles.baseFareRate, { color: colors.textSecondary }]}>
                +₱3.00/km (1km)
              </Text>
            </View>
          </View>
        </View>

        {/* Tricycle Zone & Special Trip Reference Guide */}
        <View style={[styles.trikeGuideCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.trikeGuideHeader}>
            <Text style={{ fontSize: 16 }}>🛺</Text>
            <Text style={[styles.trikeGuideTitle, { color: colors.textPrimary }]}>
              Dagupan City Tricycle Tariff & Special Trip Guide
            </Text>
          </View>
          <Text style={[styles.trikeGuideSub, { color: colors.textSecondary }]}>
            Regulated under Dagupan City TFRB Ordinance and LTFRB National Guidelines:
          </Text>

          <View style={styles.trikeZoneList}>
            <View style={styles.trikeZoneRow}>
              <Text style={[styles.trikeZoneDest, { color: colors.textPrimary }]}>• Downtown ↔ CSI The City Mall (Lucao)</Text>
              <Text style={[styles.trikeZoneFare, { color: colors.primary }]}>₱50 – ₱70 special / ₱15 shared</Text>
            </View>
            <View style={styles.trikeZoneRow}>
              <Text style={[styles.trikeZoneDest, { color: colors.textPrimary }]}>• Downtown ↔ Bonuan Tondaligan Beach</Text>
              <Text style={[styles.trikeZoneFare, { color: colors.primary }]}>₱60 – ₱80 special / ₱20 shared</Text>
            </View>
            <View style={styles.trikeZoneRow}>
              <Text style={[styles.trikeZoneDest, { color: colors.textPrimary }]}>• Downtown ↔ Nepo Mall / Tapuac Colleges</Text>
              <Text style={[styles.trikeZoneFare, { color: colors.primary }]}>₱40 – ₱50 special / ₱15 shared</Text>
            </View>
            <View style={styles.trikeZoneRow}>
              <Text style={[styles.trikeZoneDest, { color: colors.textPrimary }]}>• Downtown ↔ Mayombo / Caranglaan</Text>
              <Text style={[styles.trikeZoneFare, { color: colors.primary }]}>₱40 – ₱50 special / ₱15 shared</Text>
            </View>
          </View>
          <Text style={[styles.trikeDiscountNote, { color: colors.accent }]}>
            ℹ️ Mandatory 20% statutory discount applies for Students, PWDs, and Seniors (RA 10931, RA 9994, RA 9442).
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.discountToggle, { backgroundColor: showDiscounted ? colors.accent + '20' : colors.surface, borderColor: showDiscounted ? colors.accent : colors.border }]}
          onPress={() => setShowDiscounted(!showDiscounted)}
        >
          <Text style={{ color: showDiscounted ? colors.accent : colors.textPrimary, fontWeight: '600', fontSize: FONTS.sizes.sm }}>
            {showDiscounted ? '✓ Showing Discounted (20% Off)' : 'Show Discounted Fares (20% Off)'}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.tableNote, { color: colors.textSecondary }]}>
          Full Route Loop Ceiling Fares (Maximum possible fare per route):
        </Text>

        {/* Table Header */}
        <View style={[styles.tableHeader, { backgroundColor: colors.primary }]}>
          <Text style={[styles.headerCell, styles.routeCell]}>Route</Text>
          <Text style={[styles.headerCell, styles.distCell]}>Dist.</Text>
          <Text style={[styles.headerCell, styles.fareCell]}>Trad.</Text>
          <Text style={[styles.headerCell, styles.fareCell]}>Modern</Text>
          <Text style={[styles.headerCell, styles.fareCell]}>Trike</Text>
        </View>

        {Object.entries(grouped).map(([routeName, data], i) => (
          <View key={i} style={[styles.tableRow, { backgroundColor: i % 2 === 0 ? colors.surface : colors.surfaceElevated, borderColor: colors.border }]}>
            <Text style={[styles.cell, styles.routeCell, { color: colors.textPrimary, fontWeight: '600' }]} numberOfLines={1}>
              {routeName}
            </Text>
            <Text style={[styles.cell, styles.distCell, { color: colors.textSecondary }]}>
              {data.distance} km
            </Text>
            <Text style={[styles.cell, styles.fareCell, { color: '#D97706', fontWeight: '700' }]}>
              {data.traditional
                ? formatPeso(showDiscounted ? data.traditional.discountedFare : data.traditional.regularFare)
                : '—'}
            </Text>
            <Text style={[styles.cell, styles.fareCell, { color: '#2563EB', fontWeight: '700' }]}>
              {data.modern
                ? formatPeso(showDiscounted ? data.modern.discountedFare : data.modern.regularFare)
                : '—'}
            </Text>
            <Text style={[styles.cell, styles.fareCell, { color: '#059669', fontWeight: '700' }]}>
              {data.tricycle
                ? formatPeso(showDiscounted ? data.tricycle.discountedFare : data.tricycle.regularFare)
                : '—'}
            </Text>
          </View>
        ))}

        <Text style={[styles.footer, { color: colors.textMuted }]}>
          Source: LTFRB Order & Dagupan City TFRB Tariff Ordinance, 2026{'\n'}
          20% statutory discount for Students, Senior Citizens, and PWDs
        </Text>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.xl },
  title: { fontSize: FONTS.sizes.xxl, fontWeight: '800' },
  subtitle: { fontSize: FONTS.sizes.sm, marginTop: SPACING.xs, marginBottom: SPACING.lg },
  discountToggle: { alignSelf: 'flex-start', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, borderWidth: 1.5, marginBottom: SPACING.md },
  baseFareHero: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  baseFareHeroHeader: {
    marginBottom: SPACING.sm,
  },
  baseFareHeroTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 0.5,
  },
  baseFareCardsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  baseFareCard: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  baseFareVehicle: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
  },
  baseFareNum: {
    fontSize: 26,
    fontWeight: '900',
    marginVertical: 2,
  },
  baseFareRate: {
    fontSize: 10,
  },
  trikeGuideCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  trikeGuideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  trikeGuideTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '800',
  },
  trikeGuideSub: {
    fontSize: 11,
    marginBottom: SPACING.sm,
  },
  trikeZoneList: {
    gap: 6,
    marginBottom: SPACING.sm,
  },
  trikeZoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  trikeZoneDest: {
    fontSize: 11,
    fontWeight: '600',
  },
  trikeZoneFare: {
    fontSize: 11,
    fontWeight: '700',
  },
  trikeDiscountNote: {
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 4,
  },
  tableNote: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  tableHeader: { flexDirection: 'row', paddingVertical: SPACING.md, paddingHorizontal: SPACING.sm, borderRadius: RADIUS.md, marginBottom: 2 },
  headerCell: { color: '#FFFFFF', fontSize: FONTS.sizes.xs, fontWeight: '700', textAlign: 'center' },
  routeCell: { flex: 2.2, textAlign: 'left', paddingLeft: SPACING.sm },
  distCell: { flex: 0.9, textAlign: 'center' },
  fareCell: { flex: 1.1, textAlign: 'center' },
  tableRow: { flexDirection: 'row', paddingVertical: SPACING.md, paddingHorizontal: SPACING.sm, borderBottomWidth: 0.5 },
  cell: { fontSize: FONTS.sizes.xs, textAlign: 'center' },
  footer: { fontSize: FONTS.sizes.xs, textAlign: 'center', marginTop: SPACING.xl, lineHeight: 18 },
});

export default FareMatrixScreen;
