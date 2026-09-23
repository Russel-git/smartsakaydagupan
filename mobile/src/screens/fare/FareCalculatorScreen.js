import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Card, LoadingSpinner } from '../../components/common/SharedComponents';
import { faresAPI, routesAPI } from '../../api/services';
import { FONTS, SPACING, RADIUS, VEHICLE_TYPES, DISCOUNT_TYPES } from '../../utils/constants';
import { formatPeso } from '../../utils/helpers';

const FareCalculatorScreen = () => {
  const { colors } = useTheme();
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [vehicleType, setVehicleType] = useState('traditional');
  const [discount, setDiscount] = useState('none');
  const [fareResult, setFareResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    const loadRoutes = async () => {
      try {
        const { data } = await routesAPI.getAllRoutes();
        setRoutes(data.data || []);
      } catch (e) { /* Fail silently */ }
      setLoading(false);
    };
    loadRoutes();
  }, []);

  useEffect(() => {
    if (selectedRoute) calculateFare();
  }, [selectedRoute, vehicleType, discount]);

  const calculateFare = async () => {
    if (!selectedRoute) return;
    setCalculating(true);
    try {
      const params = {
        routeId: selectedRoute._id,
        vehicleType,
        discount: discount !== 'none' ? discount : undefined,
      };
      const { data } = await faresAPI.calculateFare(params);
      setFareResult(data.data);
    } catch (e) {
      // Fallback calculation
      const fares = {
        traditional: { base: 14, perKm: 2, baseDist: 4 },
        modern: { base: 17, perKm: 2.4, baseDist: 4 },
        tricycle: { base: 15, perKm: 3.0, baseDist: 1 },
      };
      const f = fares[vehicleType] || fares.traditional;
      const dist = selectedRoute.distanceKm;
      let fare = dist <= f.baseDist ? f.base : f.base + (dist - f.baseDist) * f.perKm;
      const discountRate = discount !== 'none' ? 0.2 : 0;
      const discounted = fare * (1 - discountRate);
      setFareResult({
        regularFare: Math.ceil(fare),
        discountedFare: Math.ceil(discounted),
        distance: dist,
        baseFare: f.base,
        baseDistanceKm: f.baseDist,
        perKmRate: f.perKm,
      });
    }
    setCalculating(false);
  };

  if (loading) return <LoadingSpinner text="Loading routes..." />;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Fare Calculator</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Calculate LTFRB-verified fares for any route
        </Text>

        {/* Route Selection */}
        <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Select Route</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.routeScroll}>
          {routes.map((route) => (
            <TouchableOpacity
              key={route._id}
              style={[
                styles.routeChip,
                {
                  backgroundColor: selectedRoute?._id === route._id ? colors.primary : colors.surface,
                  borderColor: selectedRoute?._id === route._id ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedRoute(route)}
            >
              <Text
                style={[
                  styles.routeChipText,
                  { color: selectedRoute?._id === route._id ? '#FFFFFF' : colors.textPrimary },
                ]}
              >
                {route.name}
              </Text>
              <Text
                style={[
                  styles.routeChipDist,
                  { color: selectedRoute?._id === route._id ? 'rgba(255,255,255,0.7)' : colors.textMuted },
                ]}
              >
                ~{route.distanceKm} km
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Vehicle Type */}
        <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Vehicle Type</Text>
        <View style={styles.toggleRow}>
          {VEHICLE_TYPES.map((vt) => (
            <TouchableOpacity
              key={vt.value}
              style={[
                styles.toggle,
                {
                  backgroundColor: vehicleType === vt.value ? colors.primary : colors.surface,
                  borderColor: vehicleType === vt.value ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setVehicleType(vt.value)}
            >
              <MaterialCommunityIcons
                name={vt.icon}
                size={22}
                color={vehicleType === vt.value ? '#FFFFFF' : colors.textSecondary}
              />
              <Text
                style={{
                  color: vehicleType === vt.value ? '#FFFFFF' : colors.textPrimary,
                  fontWeight: '600',
                  fontSize: FONTS.sizes.sm,
                }}
              >
                {vt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Discount */}
        <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Statutory Discount (20% Off)</Text>
        <View style={styles.discountGrid}>
          {DISCOUNT_TYPES.map((dt) => {
            const isSelected = discount === dt.value;
            const isDiscountOption = dt.value !== 'none';
            return (
              <TouchableOpacity
                key={dt.value}
                style={[
                  styles.discountChip,
                  {
                    backgroundColor: isSelected
                      ? (isDiscountOption ? '#FEF3C7' : colors.primary)
                      : colors.surface,
                    borderColor: isSelected
                      ? (isDiscountOption ? '#D97706' : colors.primary)
                      : colors.border,
                    borderWidth: isSelected ? 2 : 1.5,
                  },
                ]}
                onPress={() => setDiscount(dt.value)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={dt.icon}
                  size={22}
                  color={isSelected
                    ? (isDiscountOption ? '#B45309' : '#FFFFFF')
                    : colors.textSecondary}
                />
                <View style={{ marginLeft: 8, flex: 1 }}>
                  <Text
                    style={{
                      color: isSelected
                        ? (isDiscountOption ? '#92400E' : '#FFFFFF')
                        : colors.textPrimary,
                      fontSize: FONTS.sizes.sm,
                      fontWeight: '700',
                    }}
                  >
                    {dt.label}
                  </Text>
                  <Text
                    style={{
                      color: isSelected
                        ? (isDiscountOption ? '#B45309' : 'rgba(255,255,255,0.85)')
                        : colors.textMuted,
                      fontSize: 11,
                      fontWeight: '600',
                      marginTop: 2,
                    }}
                  >
                    {dt.tag}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Result */}
        {fareResult && selectedRoute && (() => {
          const isTricycle = vehicleType === 'tricycle';
          const baseRate = fareResult.baseFare || (isTricycle ? 15 : vehicleType === 'traditional' ? 14 : 17);
          const baseDist = fareResult.baseDistanceKm || (isTricycle ? 1 : 4);
          const perKm = fareResult.perKmRate || (isTricycle ? 3.0 : vehicleType === 'traditional' ? 2 : 2.4);
          const isDiscounted = discount !== 'none';
          const baseFarePayable = isDiscounted ? Math.ceil(baseRate * 0.8) : baseRate;
          const loopFarePayable = isDiscounted ? fareResult.discountedFare : fareResult.regularFare;

          return (
            <Card style={[styles.resultCard, { borderTopWidth: 4, borderTopColor: isTricycle ? '#F59E0B' : colors.primary }]}>
              {/* Emphasized Base Fare */}
              <View style={[styles.baseFareBadge, isTricycle && { backgroundColor: '#F59E0B15' }]}>
                <MaterialCommunityIcons name={isTricycle ? 'rickshaw' : 'shield-check'} size={16} color={isTricycle ? '#D97706' : '#16A34A'} />
                <Text style={[styles.baseFareBadgeText, isTricycle && { color: '#D97706' }]}>
                  {isTricycle ? 'DAGUPAN TFRB / LTFRB TARIFF (FIRST 1.0 KM)' : 'OFFICIAL BASE FARE (FIRST 4 KM)'}
                </Text>
              </View>

              <Text style={[styles.resultFare, { color: isTricycle ? '#D97706' : colors.primary }]}>
                {formatPeso(baseFarePayable)}
              </Text>

              {isDiscounted ? (
                <Text style={[styles.resultOriginal, { color: colors.textMuted }]}>
                  Regular Base: {formatPeso(baseRate)} (20% Discount Applied)
                </Text>
              ) : (
                <Text style={[styles.baseFareCoverage, { color: colors.textSecondary }]}>
                  {isTricycle
                    ? 'Standard commuter tariff covering the first 1.0 km in Dagupan City'
                    : 'Standard minimum boarding fare covering 0 to 4 kilometers'}
                </Text>
              )}

              {/* Rate Breakdown */}
              <View style={[styles.breakdownBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <View style={styles.breakdownItem}>
                  <Text style={[styles.breakdownLabel, { color: colors.textMuted }]}>Base Distance</Text>
                  <Text style={[styles.breakdownValue, { color: colors.textPrimary }]}>First {baseDist}.0 km</Text>
                </View>
                <View style={styles.breakdownItem}>
                  <Text style={[styles.breakdownLabel, { color: colors.textMuted }]}>Succeeding Rate</Text>
                  <Text style={[styles.breakdownValue, { color: colors.textPrimary }]}>+{formatPeso(perKm)} / km</Text>
                </View>
              </View>

              {/* Secondary Full-Loop Ceiling Fare */}
              <View style={[styles.loopCeilingBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.loopCeilingTitle, { color: colors.textSecondary }]}>
                    Full Route Corridor (~{selectedRoute.distanceKm} km):
                  </Text>
                  <Text style={[styles.loopCeilingSub, { color: colors.textMuted }]}>
                    {isTricycle ? 'Metered / standard shared tariff for full route' : 'Only applies if you ride the complete route circuit'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.loopCeilingFare, { color: colors.textPrimary }]}>
                    {formatPeso(loopFarePayable)}
                  </Text>
                  {isDiscounted && (
                    <Text style={[styles.loopCeilingOriginal, { color: colors.textMuted }]}>
                      Reg: {formatPeso(fareResult.regularFare)}
                    </Text>
                  )}
                </View>
              </View>

              {/* Special Direct Trip Guidance for Tricycle */}
              {isTricycle && (
                <View style={[styles.specialTripBox, { backgroundColor: '#F59E0B12', borderColor: '#F59E0B40' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <MaterialCommunityIcons name="information" size={16} color="#D97706" style={{ marginRight: 6 }} />
                    <Text style={styles.specialTripTitle}>Special / Direct Trip Reference</Text>
                  </View>
                  <Text style={[styles.specialTripText, { color: colors.textSecondary }]}>
                    Direct / chartered trips within Downtown, CSI Lucao, or Bonuan typically range ₱50.00 – ₱80.00 depending on distance. Statutory 20% discount strictly applies for Students, PWDs, and Seniors with valid ID.
                  </Text>
                </View>
              )}

              <Text style={[styles.sourceText, { color: colors.textMuted }]}>
                Source: {isTricycle ? 'Dagupan City TFRB Ordinance / LTFRB Guidelines' : 'LTFRB Order, March 13, 2026'} • Valid for {selectedRoute.name}
              </Text>
            </Card>
          );
        })()}

        {!selectedRoute && (
          <View style={styles.placeholder}>
            <MaterialCommunityIcons name="calculator-variant" size={48} color={colors.textMuted} />
            <Text style={[styles.placeholderText, { color: colors.textMuted }]}>
              Select a route to calculate fare
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.xxl, paddingTop: SPACING.lg },
  title: { fontSize: FONTS.sizes.xxl, fontWeight: '800' },
  subtitle: { fontSize: FONTS.sizes.sm, marginTop: SPACING.xs, marginBottom: SPACING.xxl },
  sectionLabel: { fontSize: FONTS.sizes.sm, fontWeight: '700', marginBottom: SPACING.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  routeScroll: { marginBottom: SPACING.xxl },
  routeChip: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1.5, marginRight: SPACING.sm },
  routeChipText: { fontSize: FONTS.sizes.sm, fontWeight: '600' },
  routeChipDist: { fontSize: FONTS.sizes.xs, marginTop: 2 },
  toggleRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xxl },
  toggle: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1.5 },
  discountGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.xxl },
  discountChip: { minWidth: '47%', flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, borderRadius: RADIUS.md },
  resultCard: { alignItems: 'center', paddingVertical: SPACING.xl, paddingHorizontal: SPACING.lg },
  baseFareBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.xs,
  },
  baseFareBadgeText: {
    color: '#166534',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  resultFare: { fontSize: 52, fontWeight: '900', marginVertical: 4 },
  resultOriginal: { fontSize: FONTS.sizes.xs, fontWeight: '600', marginBottom: SPACING.md },
  baseFareCoverage: { fontSize: FONTS.sizes.xs, marginBottom: SPACING.md, textAlign: 'center' },
  breakdownBox: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
  },
  breakdownItem: {
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  breakdownValue: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    marginTop: 2,
  },
  loopCeilingBox: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  loopCeilingTitle: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
  },
  loopCeilingSub: {
    fontSize: 10,
    marginTop: 2,
  },
  loopCeilingFare: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '800',
  },
  loopCeilingOriginal: {
    fontSize: 10,
    textDecorationLine: 'line-through',
  },
  specialTripBox: {
    width: '100%',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  specialTripTitle: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    color: '#D97706',
  },
  specialTripText: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  sourceText: { fontSize: 10, marginTop: SPACING.xs, fontStyle: 'italic', textAlign: 'center' },
  placeholder: { alignItems: 'center', paddingVertical: SPACING.section, gap: SPACING.md },
  placeholderText: { fontSize: FONTS.sizes.md },
});

export default FareCalculatorScreen;
