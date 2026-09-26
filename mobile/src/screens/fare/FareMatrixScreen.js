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

const FareMatrixScreen = () => {
  const { colors, isDark } = useTheme();
  const [matrix, setMatrix] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState('traditional'); // 'traditional' | 'modern'
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
          Official LTFRB-approved fare matrix for all Dagupan City PUV routes
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
                First 4 km • +₱2.00/km
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
                First 4 km • +₱2.40/km
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Vehicle Type Switcher Tabs for Table */}
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
              Traditional Jeepney Fares
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
              Modern PUJ Fares
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

        <Text style={[styles.tableNote, { color: colors.textSecondary }]}>
          Regulated LTFRB Dagupan City Route Fare Schedule:
        </Text>

        {/* Exact Table Layout Requested by User */}
        {/* jeepney routes title | minimum fare | km | succeding fare per km | 20% discounted fare */}
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

              // Full route regular fare and discounted fare
              const fullRouteRegular = routeData?.regularFare || Math.ceil(minFare + Math.max(0, dist - currentBaseDist) * succeedingRate);
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
                    <Text style={[styles.subNoteText, { color: colors.textMuted }]}>
                      Base: 4 km
                    </Text>
                  </View>

                  {/* Column 4: Succeeding Fare per KM */}
                  <View style={styles.colSucceeding}>
                    <Text style={[styles.cellText, { color: colors.textPrimary, fontWeight: '700' }]}>
                      +{formatPeso(succeedingRate)} / km
                    </Text>
                    <Text style={[styles.subNoteText, { color: colors.textMuted }]}>
                      After first 4 km
                    </Text>
                  </View>

                  {/* Column 5: 20% Discounted Fare */}
                  <View style={styles.colDiscounted}>
                    <Text style={[styles.cellText, styles.discountedText]}>
                      {formatPeso(currentMinDiscounted)}
                    </Text>
                    <Text style={[styles.subNoteText, { color: colors.textMuted }]}>
                      Route max: {formatPeso(fullRouteDiscounted)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

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
  discountToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    marginBottom: SPACING.md,
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
    minWidth: 640,
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
    width: 170,
    paddingLeft: 6,
    paddingRight: 6,
  },
  colMinFare: {
    width: 105,
    alignItems: 'center',
  },
  colKm: {
    width: 80,
    alignItems: 'center',
  },
  colSucceeding: {
    width: 145,
    alignItems: 'center',
  },
  colDiscounted: {
    width: 135,
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
