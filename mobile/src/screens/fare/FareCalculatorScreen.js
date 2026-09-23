import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Animated, useRef,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Card, LoadingSpinner } from '../../components/common/SharedComponents';
import { faresAPI, routesAPI } from '../../api/services';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS, VEHICLE_TYPES, DISCOUNT_TYPES } from '../../utils/constants';
import { formatPeso } from '../../utils/helpers';

// Vehicle type gradient map
const VH_GRADIENTS = {
  traditional: ['#D97706', '#B45309'],
  modern:      ['#2563EB', '#1D4ED8'],
  tricycle:    ['#7C3AED', '#5B21B6'],
};

// Discount accent colors
const DISC_CONFIG = {
  none:    { gradient: ['#374151', '#1F2937'], textColor: '#FFFFFF', subColor: 'rgba(255,255,255,0.7)' },
  student: { gradient: ['#0EA5E9', '#0369A1'], textColor: '#FFFFFF', subColor: 'rgba(255,255,255,0.8)' },
  senior:  { gradient: ['#10B981', '#059669'], textColor: '#FFFFFF', subColor: 'rgba(255,255,255,0.8)' },
  pwd:     { gradient: ['#8B5CF6', '#6D28D9'], textColor: '#FFFFFF', subColor: 'rgba(255,255,255,0.8)' },
};

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
    (async () => {
      try {
        const { data } = await routesAPI.getAllRoutes();
        setRoutes(data.data || []);
      } catch (_) {}
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (selectedRoute) calculateFare();
  }, [selectedRoute, vehicleType, discount]);

  const calculateFare = async () => {
    if (!selectedRoute) return;
    setCalculating(true);
    try {
      const { data } = await faresAPI.calculateFare({
        routeId: selectedRoute._id,
        vehicleType,
        discount: discount !== 'none' ? discount : undefined,
      });
      setFareResult(data.data);
    } catch (_) {
      // Offline fallback
      const fares = {
        traditional: { base: 14, perKm: 2,   baseDist: 4 },
        modern:      { base: 17, perKm: 2.4,  baseDist: 4 },
        tricycle:    { base: 15, perKm: 3.0,  baseDist: 1 },
      };
      const f = fares[vehicleType] || fares.traditional;
      const dist = selectedRoute.distanceKm;
      const rawFare = dist <= f.baseDist ? f.base : f.base + (dist - f.baseDist) * f.perKm;
      const discountRate = discount !== 'none' ? 0.2 : 0;
      setFareResult({
        regularFare: Math.ceil(rawFare),
        discountedFare: Math.ceil(rawFare * (1 - discountRate)),
        distance: dist,
        baseFare: f.base,
        baseDistanceKm: f.baseDist,
        perKmRate: f.perKm,
      });
    }
    setCalculating(false);
  };

  if (loading) return <LoadingSpinner text="Loading routes..." />;

  const isTricycle = vehicleType === 'tricycle';
  const isDiscounted = discount !== 'none';
  const discCfg = DISC_CONFIG[discount] || DISC_CONFIG.none;
  const vhGradient = VH_GRADIENTS[vehicleType] || VH_GRADIENTS.traditional;

  const displayFare = fareResult
    ? (isDiscounted ? fareResult.discountedFare : fareResult.regularFare)
    : null;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ───────────────────────────────── */}
      <LinearGradient
        colors={['#7F1D2E', '#E11D48']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerBlob} />
        <Text style={styles.headerTitle}>Fare Calculator</Text>
        <Text style={styles.headerSub}>LTFRB-verified fares for any route</Text>
      </LinearGradient>

      <View style={styles.body}>

        {/* ── ROUTE SELECTION ───────────────────── */}
        <Text style={[styles.label, { color: colors.textPrimary }]}>Select Route</Text>
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.routeScrollContent}
          style={styles.routeScroll}
        >
          {routes.map((route) => {
            const isSelected = selectedRoute?._id === route._id;
            return (
              <TouchableOpacity
                key={route._id}
                style={[
                  styles.routeChip,
                  {
                    backgroundColor: isSelected ? COLORS.primary : colors.surface,
                    borderColor: isSelected ? COLORS.primary : colors.border,
                    ...SHADOWS.sm,
                  },
                ]}
                onPress={() => setSelectedRoute(route)}
                activeOpacity={0.75}
              >
                <Text style={[styles.routeChipName, { color: isSelected ? '#FFFFFF' : colors.textPrimary }]}>
                  {route.name}
                </Text>
                <Text style={[styles.routeChipDist, { color: isSelected ? 'rgba(255,255,255,0.75)' : colors.textMuted }]}>
                  ~{route.distanceKm} km
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── VEHICLE TYPE ──────────────────────── */}
        <Text style={[styles.label, { color: colors.textPrimary }]}>Vehicle Type</Text>
        <View style={styles.vhRow}>
          {VEHICLE_TYPES.map((vt) => {
            const isActive = vehicleType === vt.value;
            const grad = VH_GRADIENTS[vt.value];
            return (
              <TouchableOpacity
                key={vt.value}
                style={[styles.vhCard, { borderColor: isActive ? grad[0] : colors.border }]}
                onPress={() => setVehicleType(vt.value)}
                activeOpacity={0.8}
              >
                {isActive ? (
                  <LinearGradient colors={grad} style={styles.vhCardInner}>
                    <MaterialCommunityIcons name={vt.icon} size={22} color="#FFFFFF" />
                    <Text style={[styles.vhLabel, { color: '#FFFFFF' }]}>{vt.label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.vhCardInner, { backgroundColor: colors.surface }]}>
                    <MaterialCommunityIcons name={vt.icon} size={22} color={colors.textMuted} />
                    <Text style={[styles.vhLabel, { color: colors.textSecondary }]}>{vt.label}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── DISCOUNT SELECTION ────────────────── */}
        <Text style={[styles.label, { color: colors.textPrimary }]}>Statutory Discount (20% Off)</Text>
        <View style={styles.discGrid}>
          {DISCOUNT_TYPES.map((dt) => {
            const isActive = discount === dt.value;
            const cfg = DISC_CONFIG[dt.value];
            return (
              <TouchableOpacity
                key={dt.value}
                style={[styles.discCard, { borderColor: isActive ? cfg.gradient[0] : colors.border }]}
                onPress={() => setDiscount(dt.value)}
                activeOpacity={0.8}
              >
                {isActive ? (
                  <LinearGradient colors={cfg.gradient} style={styles.discCardInner}>
                    <MaterialCommunityIcons name={dt.icon} size={22} color="#FFFFFF" />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.discLabel, { color: '#FFFFFF' }]}>{dt.label}</Text>
                      <Text style={[styles.discTag, { color: 'rgba(255,255,255,0.8)' }]}>{dt.tag}</Text>
                    </View>
                    <MaterialCommunityIcons name="check-circle" size={18} color="rgba(255,255,255,0.9)" />
                  </LinearGradient>
                ) : (
                  <View style={[styles.discCardInner, { backgroundColor: colors.surface }]}>
                    <MaterialCommunityIcons name={dt.icon} size={22} color={colors.textMuted} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.discLabel, { color: colors.textPrimary }]}>{dt.label}</Text>
                      <Text style={[styles.discTag, { color: colors.textMuted }]}>{dt.tag}</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── RESULT CARD ───────────────────────── */}
        {fareResult && selectedRoute ? (
          <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }, SHADOWS.lg]}>
            {/* Top accent bar */}
            <LinearGradient
              colors={vhGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.resultBar}
            />

            {/* Fare hero */}
            <View style={styles.resultHero}>
              {isDiscounted && (
                <LinearGradient colors={discCfg.gradient} style={styles.discountPill}>
                  <MaterialCommunityIcons name="tag" size={12} color="#FFFFFF" />
                  <Text style={styles.discountPillText}>
                    20% OFF — {DISCOUNT_TYPES.find(d => d.value === discount)?.label}
                  </Text>
                </LinearGradient>
              )}

              <View style={[styles.baseFareBadge, isTricycle && { backgroundColor: '#FEF3C7' }]}>
                <MaterialCommunityIcons
                  name={isTricycle ? 'rickshaw' : 'shield-check'}
                  size={13}
                  color={isTricycle ? '#D97706' : '#059669'}
                />
                <Text style={[styles.baseFareBadgeText, isTricycle && { color: '#D97706' }]}>
                  {isTricycle
                    ? 'TFRB / LTFRB BASE TARIFF (FIRST 1 KM)'
                    : 'OFFICIAL BASE FARE (FIRST 4 KM)'}
                </Text>
              </View>

              <Text style={[styles.fareHero, { color: COLORS.primary }]}>
                {formatPeso(
                  isDiscounted
                    ? Math.ceil((fareResult.baseFare || (isTricycle ? 15 : vehicleType === 'traditional' ? 14 : 17)) * 0.8)
                    : (fareResult.baseFare || (isTricycle ? 15 : vehicleType === 'traditional' ? 14 : 17))
                )}
              </Text>

              {isDiscounted && (
                <Text style={[styles.fareOriginal, { color: colors.textMuted }]}>
                  Regular base: {formatPeso(fareResult.baseFare || 14)} (20% applied)
                </Text>
              )}
            </View>

            {/* Breakdown */}
            <View style={[styles.breakdownBox, { backgroundColor: colors.surfaceElevated || colors.background, borderColor: colors.border }]}>
              <View style={styles.breakdownItem}>
                <Text style={[styles.bkLabel, { color: colors.textMuted }]}>Base Distance</Text>
                <Text style={[styles.bkValue, { color: colors.textPrimary }]}>
                  First {fareResult.baseDistanceKm || (isTricycle ? 1 : 4)} km
                </Text>
              </View>
              <View style={[styles.bkDivider, { backgroundColor: colors.border }]} />
              <View style={styles.breakdownItem}>
                <Text style={[styles.bkLabel, { color: colors.textMuted }]}>Succeeding Rate</Text>
                <Text style={[styles.bkValue, { color: colors.textPrimary }]}>
                  +{formatPeso(fareResult.perKmRate || (isTricycle ? 3.0 : vehicleType === 'traditional' ? 2 : 2.4))} / km
                </Text>
              </View>
            </View>

            {/* Full route */}
            <View style={[styles.fullRouteBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fullRouteTitle, { color: colors.textSecondary }]}>
                  Full Route (~{selectedRoute.distanceKm} km)
                </Text>
                <Text style={[styles.fullRouteSub, { color: colors.textMuted }]}>
                  {isTricycle
                    ? 'Shared tariff for complete route'
                    : 'Only if riding the complete circuit'}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.fullRouteFare, { color: colors.textPrimary }]}>
                  {formatPeso(isDiscounted ? fareResult.discountedFare : fareResult.regularFare)}
                </Text>
                {isDiscounted && (
                  <Text style={[styles.fullRouteOriginal, { color: colors.textMuted }]}>
                    Reg: {formatPeso(fareResult.regularFare)}
                  </Text>
                )}
              </View>
            </View>

            {/* Tricycle special note */}
            {isTricycle && (
              <View style={[styles.noteBox, { backgroundColor: '#FEF3C720', borderColor: '#F59E0B40' }]}>
                <MaterialCommunityIcons name="information-outline" size={16} color="#D97706" />
                <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                  Direct/chartered trips: ₱50–₱80 depending on distance. Statutory 20% applies with valid ID.
                </Text>
              </View>
            )}

            <Text style={[styles.source, { color: colors.textMuted }]}>
              Source: {isTricycle ? 'Dagupan TFRB Ordinance / LTFRB Guidelines' : 'LTFRB Order, March 13, 2026'}
            </Text>
          </View>
        ) : (
          !selectedRoute && (
            <View style={styles.placeholder}>
              <View style={[styles.placeholderIcon, { backgroundColor: COLORS.primarySubtle }]}>
                <MaterialCommunityIcons name="calculator-variant-outline" size={40} color={COLORS.primary} />
              </View>
              <Text style={[styles.placeholderTitle, { color: colors.textPrimary }]}>
                Select a Route
              </Text>
              <Text style={[styles.placeholderSub, { color: colors.textMuted }]}>
                Choose a route above to calculate LTFRB fares
              </Text>
            </View>
          )
        )}

        <View style={{ height: 48 }} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingTop: 56, paddingBottom: SPACING.xxl,
    paddingHorizontal: SPACING.xxl,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  headerBlob: {
    position: 'absolute', top: -50, right: -40,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  headerTitle: {
    fontSize: FONTS.sizes.xxl, fontWeight: '900', color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSub: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.75)', marginTop: 4 },

  body: { padding: SPACING.xxl, paddingTop: SPACING.xl },

  label: {
    fontSize: 12, fontWeight: '800', textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: SPACING.sm,
  },

  // Route chips
  routeScroll: { marginBottom: SPACING.xxl },
  routeScrollContent: { paddingRight: SPACING.lg, gap: SPACING.sm },
  routeChip: {
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    borderRadius: RADIUS.xl, borderWidth: 1.5,
  },
  routeChipName: { fontSize: FONTS.sizes.sm, fontWeight: '700' },
  routeChipDist: { fontSize: FONTS.sizes.xs, marginTop: 2 },

  // Vehicle type
  vhRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xxl },
  vhCard: {
    flex: 1, borderRadius: RADIUS.lg, borderWidth: 1.5, overflow: 'hidden',
  },
  vhCardInner: {
    alignItems: 'center', paddingVertical: SPACING.lg, gap: SPACING.xs,
  },
  vhLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },

  // Discount
  discGrid: { gap: SPACING.sm, marginBottom: SPACING.xxl },
  discCard: { borderRadius: RADIUS.lg, borderWidth: 1.5, overflow: 'hidden' },
  discCardInner: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
  },
  discLabel: { fontSize: FONTS.sizes.sm, fontWeight: '700' },
  discTag:   { fontSize: 11, fontWeight: '600', marginTop: 2 },

  // Result card
  resultCard: {
    borderRadius: RADIUS.xl, borderWidth: 1, overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  resultBar: { height: 5, width: '100%' },

  resultHero: {
    alignItems: 'center', paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  discountPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: SPACING.md, paddingVertical: 5,
    borderRadius: RADIUS.full, marginBottom: SPACING.sm,
  },
  discountPillText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },

  baseFareBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: SPACING.md, paddingVertical: 5,
    borderRadius: RADIUS.full, marginBottom: SPACING.sm,
  },
  baseFareBadgeText: { fontSize: 10, fontWeight: '800', color: '#166534', letterSpacing: 0.5 },

  fareHero: { fontSize: 58, fontWeight: '900', letterSpacing: -2, marginVertical: 4 },
  fareOriginal: { fontSize: 12, fontWeight: '600' },

  // Breakdown
  breakdownBox: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: SPACING.lg, marginBottom: SPACING.md,
    borderRadius: RADIUS.md, borderWidth: 1, padding: SPACING.md,
  },
  breakdownItem: { flex: 1, alignItems: 'center' },
  bkLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  bkValue: { fontSize: FONTS.sizes.sm, fontWeight: '800', marginTop: 3 },
  bkDivider: { width: 1, height: 36, marginHorizontal: SPACING.sm },

  // Full route
  fullRouteBox: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: SPACING.lg, marginBottom: SPACING.md,
    padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1,
  },
  fullRouteTitle: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  fullRouteSub:   { fontSize: 10, marginTop: 2 },
  fullRouteFare:  { fontSize: FONTS.sizes.lg, fontWeight: '900' },
  fullRouteOriginal: { fontSize: 10, textDecorationLine: 'line-through', marginTop: 2 },

  // Note
  noteBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
    marginHorizontal: SPACING.lg, marginBottom: SPACING.sm,
    padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1,
  },
  noteText: { flex: 1, fontSize: 11, lineHeight: 16 },

  source: {
    fontSize: 10, fontStyle: 'italic', textAlign: 'center',
    paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg, marginTop: SPACING.xs,
  },

  // Placeholder
  placeholder: { alignItems: 'center', paddingVertical: SPACING.section, gap: SPACING.md },
  placeholderIcon: {
    width: 80, height: 80, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
  },
  placeholderTitle: { fontSize: FONTS.sizes.lg, fontWeight: '800' },
  placeholderSub:   { fontSize: FONTS.sizes.sm, textAlign: 'center' },
});

export default FareCalculatorScreen;
