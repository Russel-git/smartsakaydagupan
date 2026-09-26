import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { faresAPI } from '../../api/services';
import { LoadingSpinner } from '../../components/common/SharedComponents';
import { formatPeso } from '../../utils/helpers';
import { FONTS, SPACING, RADIUS } from '../../utils/constants';

const KM_STEPS = [
  { km: 4, label: '1 - 4 km (Base)', extraKm: 0 },
  { km: 5, label: '5 km', extraKm: 1 },
  { km: 6, label: '6 km', extraKm: 2 },
  { km: 7, label: '7 km', extraKm: 3 },
  { km: 8, label: '8 km', extraKm: 4 },
  { km: 9, label: '9 km', extraKm: 5 },
  { km: 10, label: '10 km', extraKm: 6 },
  { km: 11, label: '11 km', extraKm: 7 },
  { km: 12, label: '12 km', extraKm: 8 },
  { km: 13, label: '13 km', extraKm: 9 },
  { km: 14, label: '14 km', extraKm: 10 },
  { km: 15, label: '15 km', extraKm: 11 },
  { km: 18, label: '18 km', extraKm: 14 },
  { km: 20, label: '20 km', extraKm: 16 },
];

const FareMatrixScreen = () => {
  const { colors, isDark } = useTheme();
  const [matrix, setMatrix] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState('traditional'); // 'traditional' | 'modern'
  const [viewMode, setViewMode] = useState('routes'); // 'routes' | 'km_ladder'
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

  // Group by route for Traditional and Modern PUJ
  const grouped = (Array.isArray(matrix) ? matrix : []).reduce((acc, item) => {
    const routeName = item.routeId?.name || 'Unknown';
    if (!acc[routeName]) {
      acc[routeName] = {
        traditional: null,
        modern: null,
        distance: item.distanceKm,
        code: item.routeId?.code || '',
      };
    }
    if (item.vehicleType === 'traditional' || item.vehicleType === 'modern') {
      acc[routeName][item.vehicleType] = item;
    }
    if (item.distanceKm && !acc[routeName].distance) {
      acc[routeName].distance = item.distanceKm;
    }
    return acc;
  }, {});

  const isModern = selectedVehicle === 'modern';
  const currentBaseFare = isModern ? 17 : 14;
  const currentBaseDist = 4;
  const currentPerKm = isModern ? 2.4 : 2.0;
  const currentMinDiscounted = isModern ? 14 : 12;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Fare Matrix</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Official LTFRB-approved fare matrix & per-km added difference schedule
        </Text>

        {/* Emphasized Regulated Base Fares Banner (Public Jeepneys Only) */}
        <View style={[styles.baseFareHero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.baseFareHeroHeader}>
            <Text style={styles.baseFareHeroTag}>OFFICIAL REGULATED BASE FARES</Text>
          </View>
          <View style={styles.baseFareCardsRow}>
            <TouchableOpacity
              style={[
                styles.baseFareCard,
                { borderColor: '#D97706' },
                selectedVehicle === 'traditional' && { backgroundColor: '#D9770615', borderWidth: 2.5 },
              ]}
              onPress={() => setSelectedVehicle('traditional')}
              activeOpacity={0.8}
            >
              <Text style={[styles.baseFareVehicle, { color: '#D97706' }]}>🚐 Traditional PUJ</Text>
              <Text style={[styles.baseFareNum, { color: '#D97706' }]}>
                {formatPeso(showDiscounted ? 12 : 14)}
              </Text>
              <Text style={[styles.baseFareRate, { color: colors.textSecondary }]}>
                First 4 km • <Text style={{ fontWeight: '800', color: '#D97706' }}>+₱2.00/km added</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.baseFareCard,
                { borderColor: '#2563EB' },
                selectedVehicle === 'modern' && { backgroundColor: '#2563EB15', borderWidth: 2.5 },
              ]}
              onPress={() => setSelectedVehicle('modern')}
              activeOpacity={0.8}
            >
              <Text style={[styles.baseFareVehicle, { color: '#2563EB' }]}>🚌 Modern PUJ</Text>
              <Text style={[styles.baseFareNum, { color: '#2563EB' }]}>
                {formatPeso(showDiscounted ? 14 : 17)}
              </Text>
              <Text style={[styles.baseFareRate, { color: colors.textSecondary }]}>
                First 4 km • <Text style={{ fontWeight: '800', color: '#2563EB' }}>+₱2.40/km added</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Vehicle Type Switcher Tabs */}
        <View style={styles.puvSelectorRow}>
          <TouchableOpacity
            style={[
              styles.puvTabBtn,
              selectedVehicle === 'traditional'
                ? { backgroundColor: '#D97706', borderColor: '#D97706' }
                : { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => setSelectedVehicle('traditional')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="van-passenger"
              size={16}
              color={selectedVehicle === 'traditional' ? '#FFFFFF' : colors.textSecondary}
            />
            <Text
              style={[
                styles.puvTabText,
                { color: selectedVehicle === 'traditional' ? '#FFFFFF' : colors.textPrimary },
              ]}
            >
              Traditional (+₱2.00/km)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.puvTabBtn,
              selectedVehicle === 'modern'
                ? { backgroundColor: '#2563EB', borderColor: '#2563EB' }
                : { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => setSelectedVehicle('modern')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="bus"
              size={16}
              color={selectedVehicle === 'modern' ? '#FFFFFF' : colors.textSecondary}
            />
            <Text
              style={[
                styles.puvTabText,
                { color: selectedVehicle === 'modern' ? '#FFFFFF' : colors.textPrimary },
              ]}
            >
              Modern PUJ (+₱2.40/km)
            </Text>
          </TouchableOpacity>
        </View>

        {/* View Mode Switcher: Route Table vs Per-KM Added Difference Ladder */}
        <View style={[styles.viewModeBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.viewModeBtn,
              viewMode === 'routes' && [styles.viewModeBtnActive, { backgroundColor: isModern ? '#2563EB' : '#D97706' }],
            ]}
            onPress={() => setViewMode('routes')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="table"
              size={15}
              color={viewMode === 'routes' ? '#FFFFFF' : colors.textSecondary}
            />
            <Text
              style={[
                styles.viewModeBtnText,
                { color: viewMode === 'routes' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              Jeepney Routes Matrix
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.viewModeBtn,
              viewMode === 'km_ladder' && [styles.viewModeBtnActive, { backgroundColor: isModern ? '#2563EB' : '#D97706' }],
            ]}
            onPress={() => setViewMode('km_ladder')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="stairs-up"
              size={15}
              color={viewMode === 'km_ladder' ? '#FFFFFF' : colors.textSecondary}
            />
            <Text
              style={[
                styles.viewModeBtnText,
                { color: viewMode === 'km_ladder' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              Per-KM Added Fare Differences
            </Text>
          </TouchableOpacity>
        </View>

        {/* 20% Discount Toggle */}
        <TouchableOpacity
          style={[
            styles.discountToggle,
            {
              backgroundColor: showDiscounted ? colors.accent + '20' : colors.surface,
              borderColor: showDiscounted ? colors.accent : colors.border,
            },
          ]}
          onPress={() => setShowDiscounted(!showDiscounted)}
        >
          <MaterialCommunityIcons
            name={showDiscounted ? 'check-circle' : 'ticket-percent-outline'}
            size={16}
            color={showDiscounted ? colors.accent : colors.textSecondary}
          />
          <Text
            style={{
              color: showDiscounted ? colors.accent : colors.textPrimary,
              fontWeight: '700',
              fontSize: FONTS.sizes.sm,
              marginLeft: 6,
            }}
          >
            {showDiscounted ? 'Showing 20% Discounted Rate' : 'Show 20% Discounted Rate (Students, PWDs, Seniors)'}
          </Text>
        </TouchableOpacity>

        {/* ========================================================================= */}
        {/* VIEW 1: ROUTE-BY-ROUTE TABLE WITH FARE DIFFERENCE PER KM ADDED           */}
        {/* ========================================================================= */}
        {viewMode === 'routes' ? (
          <>
            <Text style={[styles.tableNote, { color: colors.textSecondary }]}>
              Official Route Matrix showing minimum fare and fare difference per km added:
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableScroll}>
              <View style={styles.tableWrapper}>
                {/* Table Header */}
                <View style={[styles.tableHeader, { backgroundColor: isModern ? '#1E40AF' : '#92400E' }]}>
                  <Text style={[styles.headerCell, styles.colRouteTitle]}>Jeepney Routes Title</Text>
                  <Text style={[styles.headerCell, styles.colMinFare]}>Minimum Fare</Text>
                  <Text style={[styles.headerCell, styles.colKm]}>KM</Text>
                  <Text style={[styles.headerCell, styles.colSucceeding]}>Succeeding Fare per KM</Text>
                  <Text style={[styles.headerCell, styles.colDiscounted]}>20% Discounted Fare</Text>
                </View>

                {/* Table Rows */}
                {Object.entries(grouped).map(([routeName, data], i) => {
                  const routeData = data[selectedVehicle];
                  const dist = data.distance || (routeData?.distanceKm) || 4;
                  const minFare = currentBaseFare;
                  const succeedingRate = currentPerKm;
                  const extraKm = Math.max(0, Math.round((dist - currentBaseDist) * 10) / 10);
                  const fareDifference = Math.ceil(extraKm * succeedingRate);

                  // Full route regular fare and discounted fare
                  const fullRouteRegular = routeData?.regularFare || Math.ceil(minFare + fareDifference);
                  const fullRouteDiscounted = routeData?.discountedFare || Math.ceil(fullRouteRegular * 0.8);

                  return (
                    <View
                      key={i}
                      style={[
                        styles.tableRow,
                        {
                          backgroundColor: i % 2 === 0 ? colors.surface : colors.surfaceElevated,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      {/* Column 1: Jeepney Routes Title */}
                      <View style={styles.colRouteTitle}>
                        <Text
                          style={[styles.cellText, styles.routeTitleText, { color: colors.textPrimary }]}
                          numberOfLines={2}
                        >
                          {routeName}
                        </Text>
                        {Boolean(data.code) && (
                          <Text style={[styles.routeCodeText, { color: colors.textMuted }]}>
                            {data.code}
                          </Text>
                        )}
                      </View>

                      {/* Column 2: Minimum Fare */}
                      <View style={styles.colMinFare}>
                        <Text style={[styles.cellText, styles.minFareText, { color: isModern ? '#2563EB' : '#D97706' }]}>
                          {formatPeso(minFare)}
                        </Text>
                        <Text style={[styles.subNoteText, { color: colors.textMuted }]}>
                          (First 4.0 km)
                        </Text>
                      </View>

                      {/* Column 3: KM */}
                      <View style={styles.colKm}>
                        <Text style={[styles.cellText, { color: colors.textPrimary, fontWeight: '700' }]}>
                          {dist} km
                        </Text>
                        <Text style={[styles.subNoteText, { color: '#0284C7', fontWeight: '700' }]}>
                          +{extraKm} km added
                        </Text>
                      </View>

                      {/* Column 4: Succeeding Fare per KM & Difference Added */}
                      <View style={styles.colSucceeding}>
                        <Text style={[styles.cellText, { color: '#16A34A', fontWeight: '800' }]}>
                          +{formatPeso(fareDifference)} added
                        </Text>
                        <Text style={[styles.subNoteText, { color: colors.textMuted }]}>
                          (+{formatPeso(succeedingRate)} / km)
                        </Text>
                      </View>

                      {/* Column 5: 20% Discounted Fare */}
                      <View style={styles.colDiscounted}>
                        <Text style={[styles.cellText, styles.discountedText]}>
                          {formatPeso(currentMinDiscounted)} min
                        </Text>
                        <Text style={[styles.subNoteText, { color: colors.textMuted }]}>
                          Full route: {formatPeso(fullRouteDiscounted)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </>
        ) : (
          /* ========================================================================= */
          /* VIEW 2: PER-KM INCREMENTAL FARE DIFFERENCE LADDER (KM-BY-KM GUIDE)        */
          /* ========================================================================= */
          <>
            <View style={[styles.infoBanner, { backgroundColor: isDark ? 'rgba(2, 132, 199, 0.12)' : '#F0F9FF', borderColor: '#0284C7' }]}>
              <MaterialCommunityIcons name="information" size={20} color="#0284C7" />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={[styles.infoBannerTitle, { color: isDark ? '#BAE6FD' : '#0369A1' }]}>
                  {isModern ? 'Modern PUJ' : 'Traditional Jeepney'} Fare Differences per KM Added
                </Text>
                <Text style={[styles.infoBannerSub, { color: colors.textSecondary }]}>
                  First 4.0 km is base fare ({formatPeso(currentBaseFare)}). Each additional kilometer adds exactly +{formatPeso(currentPerKm)}.
                </Text>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableScroll}>
              <View style={[styles.tableWrapper, { minWidth: 600 }]}>
                {/* Ladder Header */}
                <View style={[styles.tableHeader, { backgroundColor: isModern ? '#1E40AF' : '#92400E' }]}>
                  <Text style={[styles.headerCell, { width: 120, textAlign: 'left', paddingLeft: 8 }]}>Total Distance</Text>
                  <Text style={[styles.headerCell, { width: 100 }]}>KM Added</Text>
                  <Text style={[styles.headerCell, { width: 130 }]}>Fare Diff Added</Text>
                  <Text style={[styles.headerCell, { width: 120 }]}>Regular Fare</Text>
                  <Text style={[styles.headerCell, { width: 130 }]}>20% Discounted</Text>
                </View>

                {/* Ladder Rows */}
                {KM_STEPS.map((step, idx) => {
                  const addedKm = step.extraKm;
                  const diffAdded = Math.ceil(addedKm * currentPerKm);
                  const regFare = currentBaseFare + diffAdded;
                  const discFare = Math.ceil(regFare * 0.8);
                  const savings = regFare - discFare;

                  return (
                    <View
                      key={`ladder-${idx}`}
                      style={[
                        styles.tableRow,
                        {
                          backgroundColor: idx === 0
                            ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7')
                            : (idx % 2 === 0 ? colors.surface : colors.surfaceElevated),
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      {/* Distance */}
                      <View style={{ width: 120, paddingLeft: 8 }}>
                        <Text style={[styles.cellText, { textAlign: 'left', fontWeight: '800', color: colors.textPrimary }]}>
                          {step.label}
                        </Text>
                        {idx === 0 && (
                          <Text style={{ fontSize: 9, color: '#16A34A', fontWeight: '800' }}>
                            OFFICIAL BASE
                          </Text>
                        )}
                      </View>

                      {/* KM Added */}
                      <View style={{ width: 100, alignItems: 'center' }}>
                        <Text style={[styles.cellText, { color: addedKm === 0 ? colors.textMuted : '#0284C7', fontWeight: '700' }]}>
                          {addedKm === 0 ? '0 km (Base)' : `+${addedKm} km`}
                        </Text>
                      </View>

                      {/* Fare Difference Added */}
                      <View style={{ width: 130, alignItems: 'center' }}>
                        <Text
                          style={[
                            styles.cellText,
                            {
                              color: addedKm === 0 ? colors.textMuted : '#16A34A',
                              fontWeight: '900',
                              fontSize: 13,
                            },
                          ]}
                        >
                          {addedKm === 0 ? 'Base' : `+${formatPeso(diffAdded)}`}
                        </Text>
                        {addedKm > 0 && (
                          <Text style={{ fontSize: 9, color: colors.textMuted }}>
                            +{formatPeso(currentPerKm)} / km
                          </Text>
                        )}
                      </View>

                      {/* Regular Total Fare */}
                      <View style={{ width: 120, alignItems: 'center' }}>
                        <Text style={[styles.cellText, { fontWeight: '900', color: isModern ? '#2563EB' : '#D97706', fontSize: 13 }]}>
                          {formatPeso(regFare)}
                        </Text>
                      </View>

                      {/* 20% Discounted Fare */}
                      <View style={{ width: 130, alignItems: 'center' }}>
                        <Text style={[styles.cellText, { fontWeight: '900', color: '#16A34A', fontSize: 13 }]}>
                          {formatPeso(discFare)}
                        </Text>
                        <Text style={{ fontSize: 9, color: colors.textMuted }}>
                          Save {formatPeso(savings)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </>
        )}

        <Text style={[styles.footer, { color: colors.textMuted }]}>
          Source: Official LTFRB Memorandum Order & City Transport Regulations{'\n'}
          20% statutory discount applies nationwide for Students, Senior Citizens, and Persons with Disabilities (PWDs).
        </Text>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg },
  title: { fontSize: FONTS.sizes.xxl, fontWeight: '800' },
  subtitle: { fontSize: FONTS.sizes.sm, marginTop: SPACING.xs, marginBottom: SPACING.md },
  baseFareHero: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  baseFareHeroHeader: {
    marginBottom: SPACING.sm,
  },
  baseFareHeroTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16A34A',
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
  puvSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  puvTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
  },
  puvTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  viewModeBar: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  viewModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  viewModeBtnActive: {
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  viewModeBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  discountToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    marginBottom: SPACING.md,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  infoBannerTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  infoBannerSub: {
    fontSize: 11,
    marginTop: 2,
  },
  tableNote: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  tableScroll: {
    borderRadius: RADIUS.md,
  },
  tableWrapper: {
    minWidth: 660,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: RADIUS.md,
    marginBottom: 2,
  },
  headerCell: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
  },
  colRouteTitle: {
    width: 175,
    paddingLeft: 6,
    paddingRight: 6,
  },
  colMinFare: {
    width: 105,
    alignItems: 'center',
  },
  colKm: {
    width: 100,
    alignItems: 'center',
  },
  colSucceeding: {
    width: 155,
    alignItems: 'center',
  },
  colDiscounted: {
    width: 125,
    alignItems: 'center',
  },
  cellText: {
    fontSize: 12,
    textAlign: 'center',
  },
  routeTitleText: {
    textAlign: 'left',
    fontWeight: '700',
  },
  routeCodeText: {
    fontSize: 10,
    marginTop: 1,
  },
  minFareText: {
    fontWeight: '900',
    fontSize: 13,
  },
  subNoteText: {
    fontSize: 10,
    marginTop: 1,
  },
  discountedText: {
    color: '#16A34A',
    fontWeight: '900',
    fontSize: 13,
  },
  footer: {
    fontSize: FONTS.sizes.xs,
    textAlign: 'center',
    marginTop: SPACING.xl,
    lineHeight: 18,
  },
});

export default FareMatrixScreen;
