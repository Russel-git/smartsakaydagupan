import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTheme } from '../../contexts/ThemeContext';
import { Card, LoadingSpinner } from '../../components/common/SharedComponents';
import { faresAPI, routesAPI } from '../../api/services';
import { FONTS, SPACING, RADIUS, VEHICLE_TYPES, DISCOUNT_TYPES } from '../../utils/constants';
import { formatPeso } from '../../utils/helpers';

// Haversine distance helper
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const FareCalculatorScreen = () => {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;

  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [vehicleType, setVehicleType] = useState('traditional');
  const [discount, setDiscount] = useState('none');
  const [loading, setLoading] = useState(true);

  // Trip Distance State
  const [tripDistanceKm, setTripDistanceKm] = useState(4.0);
  const [boardingStopIndex, setBoardingStopIndex] = useState(null);
  const [dropoffStopIndex, setDropoffStopIndex] = useState(null);

  // Live Alight / Ride Tracking Meter State
  const [isLiveMeterActive, setIsLiveMeterActive] = useState(false);
  const [liveMeterDistanceKm, setLiveMeterDistanceKm] = useState(0);
  const [liveMeterDurationSec, setLiveMeterDurationSec] = useState(0);
  const [hasAlighted, setHasAlighted] = useState(false);

  const lastLocationRef = useRef(null);
  const locationSubRef = useRef(null);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    const loadRoutes = async () => {
      try {
        const { data } = await routesAPI.getAllRoutes();
        const routeList = data.data || [];
        setRoutes(routeList);
        if (routeList.length > 0) {
          setSelectedRoute(routeList[0]);
          setTripDistanceKm(Math.min(routeList[0].distanceKm || 4, 4.0));
        }
      } catch (e) {
        /* Fail silently */
      }
      setLoading(false);
    };
    loadRoutes();

    return () => {
      stopLiveMeter();
    };
  }, []);

  const handleSelectRoute = (route) => {
    setSelectedRoute(route);
    setBoardingStopIndex(null);
    setDropoffStopIndex(null);
    if (!isLiveMeterActive) {
      setTripDistanceKm(Math.min(route.distanceKm || 4, 4.0));
    }
  };

  // Stop selection distance calculation
  const handleSelectStop = (index, type) => {
    if (!selectedRoute?.waypoints || selectedRoute.waypoints.length < 2) return;

    let bIdx = boardingStopIndex;
    let dIdx = dropoffStopIndex;

    if (type === 'boarding') {
      bIdx = index;
      setBoardingStopIndex(index);
      if (dIdx !== null && dIdx <= index) {
        dIdx = Math.min(index + 1, selectedRoute.waypoints.length - 1);
        setDropoffStopIndex(dIdx);
      }
    } else {
      dIdx = index;
      setDropoffStopIndex(index);
      if (bIdx !== null && bIdx >= index) {
        bIdx = Math.max(0, index - 1);
        setBoardingStopIndex(bIdx);
      }
    }

    if (bIdx !== null && dIdx !== null) {
      const w1 = selectedRoute.waypoints[bIdx];
      const w2 = selectedRoute.waypoints[dIdx];
      const dist = calculateDistanceKm(w1.lat, w1.lng, w2.lat, w2.lng);
      if (dist) {
        setTripDistanceKm(Number(Math.max(1, dist * 1.3).toFixed(1))); // 1.3 road winding factor
      }
    }
  };

  // Live Alight / Meter Tracking
  const startLiveMeter = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('GPS Permission Required', 'Please enable location permissions to use live ride tracking.');
        return;
      }

      setLiveMeterDistanceKm(0);
      setLiveMeterDurationSec(0);
      setHasAlighted(false);
      setIsLiveMeterActive(true);

      const cur = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      lastLocationRef.current = cur?.coords ? { lat: cur.coords.latitude, lng: cur.coords.longitude } : null;

      timerIntervalRef.current = setInterval(() => {
        setLiveMeterDurationSec((prev) => prev + 1);
      }, 1000);

      locationSubRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 8 },
        (loc) => {
          if (!loc?.coords) return;
          const nextLoc = { lat: loc.coords.latitude, lng: loc.coords.longitude };
          if (lastLocationRef.current) {
            const stepDist = calculateDistanceKm(
              lastLocationRef.current.lat,
              lastLocationRef.current.lng,
              nextLoc.lat,
              nextLoc.lng
            );
            if (stepDist && stepDist > 0.005) {
              setLiveMeterDistanceKm((prev) => {
                const updated = Number((prev + stepDist).toFixed(2));
                setTripDistanceKm(updated);
                return updated;
              });
            }
          }
          lastLocationRef.current = nextLoc;
        }
      );
    } catch (e) {
      console.warn('Live meter error:', e);
    }
  };

  const stopLiveMeter = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (locationSubRef.current) {
      locationSubRef.current.remove();
      locationSubRef.current = null;
    }
    setIsLiveMeterActive(false);
  };

  const handleAlightNow = () => {
    stopLiveMeter();
    setHasAlighted(true);
  };

  // LTFRB Official Calculation Engine
  const computeFare = (distance) => {
    const isModern = vehicleType === 'modern';
    const baseFare = isModern ? 17.0 : 14.0;
    const baseDistanceKm = 4.0;
    const perKmRate = isModern ? 2.4 : 2.0;

    let subtotal = 0;
    let extraKm = 0;
    let extraCharge = 0;

    if (distance <= baseDistanceKm) {
      subtotal = baseFare;
    } else {
      extraKm = Number((distance - baseDistanceKm).toFixed(2));
      extraCharge = Number((extraKm * perKmRate).toFixed(2));
      subtotal = baseFare + extraCharge;
    }

    const isDiscounted = discount !== 'none';
    const discountRate = isDiscounted ? 0.2 : 0;
    const discountAmount = isDiscounted ? subtotal * discountRate : 0;
    const discountedSubtotal = subtotal - discountAmount;

    const finalPayableFare = Math.ceil(discountedSubtotal);
    const regularPayableFare = Math.ceil(subtotal);

    return {
      baseFare,
      baseDistanceKm,
      perKmRate,
      distanceKm: distance,
      extraKm,
      extraCharge,
      subtotal,
      isDiscounted,
      discountRate,
      discountAmount,
      finalPayableFare,
      regularPayableFare,
    };
  };

  const currentFare = computeFare(tripDistanceKm);

  if (loading) return <LoadingSpinner text="Loading routes..." />;

  const formatSec = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={[styles.content, { maxWidth: isTablet ? 720 : '100%', alignSelf: 'center', width: '100%' }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Fare Calculator</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          LTFRB Base Fare + Succeeding Km Engine • Actual Alighting Fare
        </Text>

        {/* 1. Route Selection */}
        <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>1. Select Jeepney Route</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.routeScroll}>
          {routes.map((route) => {
            const isSelected = selectedRoute?._id === route._id;
            return (
              <TouchableOpacity
                key={route._id}
                style={[
                  styles.routeChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => handleSelectRoute(route)}
              >
                <Text
                  style={[
                    styles.routeChipText,
                    { color: isSelected ? '#FFFFFF' : colors.textPrimary },
                  ]}
                >
                  {route.name}
                </Text>
                <Text
                  style={[
                    styles.routeChipDist,
                    { color: isSelected ? 'rgba(255,255,255,0.7)' : colors.textMuted },
                  ]}
                >
                  ~{route.distanceKm} km • {route.category || 'city'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 2. Public Vehicle Type */}
        <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>2. Public Vehicle Type</Text>
        <View style={styles.toggleRow}>
          {VEHICLE_TYPES.filter((vt) => vt.value === 'traditional' || vt.value === 'modern').map((vt) => {
            const isSelected = vehicleType === vt.value;
            const isModern = vt.value === 'modern';
            return (
              <TouchableOpacity
                key={vt.value}
                style={[
                  styles.toggle,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setVehicleType(vt.value)}
              >
                <MaterialCommunityIcons
                  name={vt.icon}
                  size={20}
                  color={isSelected ? '#FFFFFF' : colors.textSecondary}
                />
                <View>
                  <Text
                    style={{
                      color: isSelected ? '#FFFFFF' : colors.textPrimary,
                      fontWeight: '700',
                      fontSize: FONTS.sizes.sm,
                    }}
                  >
                    {vt.label}
                  </Text>
                  <Text
                    style={{
                      color: isSelected ? 'rgba(255,255,255,0.8)' : colors.textMuted,
                      fontSize: 10,
                      fontWeight: '600',
                    }}
                  >
                    {isModern ? '₱17.00 Base + ₱2.40/km' : '₱14.00 Base + ₱2.00/km'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 3. Passenger Fare Category (Discount) */}
        <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>3. Commuter Category</Text>
        <View style={styles.discountGrid}>
          {DISCOUNT_TYPES.map((dt) => {
            const isSelected = discount === dt.value;
            return (
              <TouchableOpacity
                key={dt.value}
                style={[
                  styles.discountChip,
                  {
                    backgroundColor: isSelected ? colors.accent + '20' : colors.surface,
                    borderColor: isSelected ? colors.accent : colors.border,
                  },
                ]}
                onPress={() => setDiscount(dt.value)}
              >
                <MaterialCommunityIcons
                  name={dt.icon}
                  size={16}
                  color={isSelected ? colors.accent : colors.textMuted}
                />
                <Text
                  style={{
                    color: isSelected ? colors.accent : colors.textPrimary,
                    fontSize: FONTS.sizes.xs,
                    fontWeight: '700',
                  }}
                >
                  {dt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 4. Live Ride Meter Option (Board Jeepney -> Alight Upon Arrival) */}
        <Card style={[styles.liveMeterBanner, { borderColor: isLiveMeterActive ? '#10B981' : colors.border }]}>
          <View style={styles.liveMeterHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
              <MaterialCommunityIcons
                name={isLiveMeterActive ? 'record-circle' : 'crosshairs-gps'}
                size={20}
                color={isLiveMeterActive ? '#EF4444' : colors.primary}
              />
              <Text style={[styles.liveMeterTitle, { color: colors.textPrimary }]}>
                {isLiveMeterActive
                  ? 'Ride In Progress • Live Odometer Active'
                  : hasAlighted
                  ? 'Trip Completed • Alighted'
                  : 'Live "Get Off" Ride Meter'}
              </Text>
            </View>
            {isLiveMeterActive && (
              <View style={styles.liveTimerBadge}>
                <Text style={styles.liveTimerText}>{formatSec(liveMeterDurationSec)}</Text>
              </View>
            )}
          </View>

          <Text style={[styles.liveMeterDesc, { color: colors.textSecondary }]}>
            {isLiveMeterActive
              ? `Currently tracking your trip along ${selectedRoute?.name || 'this route'}. Tap "Alight / Get Off" when getting off to see your final payable fare.`
              : 'Hop on a jeepney and tap "Board Jeepney Now". When you reach your stop and get off, tap "Alight / Get Off" to see the exact actual fare to pay the driver.'}
          </Text>

          <View style={styles.liveMeterActionRow}>
            {!isLiveMeterActive ? (
              <TouchableOpacity
                style={[styles.meterStartBtn, { backgroundColor: '#10B981' }]}
                onPress={startLiveMeter}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="bus" size={18} color="#FFFFFF" />
                <Text style={styles.meterStartBtnText}>
                  {hasAlighted ? 'Board Another Jeepney' : 'Board Jeepney Now (Track Ride)'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.meterStopBtn, { backgroundColor: '#EF4444' }]}
                onPress={handleAlightNow}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="bus-stop" size={18} color="#FFFFFF" />
                <Text style={styles.meterStopBtnText}>
                  I'm Getting Off Now (Alight & View Fare)
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>

        {/* 5. Trip Distance Controller */}
        <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>
          4. Trip Distance: {tripDistanceKm.toFixed(1)} km
        </Text>

        {/* Quick Distance Presets */}
        <View style={styles.distanceChipsRow}>
          {[
            { label: '4.0 km (Base)', dist: 4.0 },
            { label: '7.0 km', dist: 7.0 },
            { label: '10.0 km', dist: 10.0 },
            { label: '15.0 km', dist: 15.0 },
            { label: `Full (~${selectedRoute?.distanceKm || 20} km)`, dist: selectedRoute?.distanceKm || 20 },
          ].map((preset) => {
            const isSelected = Math.abs(tripDistanceKm - preset.dist) < 0.2;
            return (
              <TouchableOpacity
                key={preset.label}
                style={[
                  styles.distancePresetChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setTripDistanceKm(Number(preset.dist.toFixed(1)))}
              >
                <Text
                  style={[
                    styles.distancePresetText,
                    { color: isSelected ? '#FFFFFF' : colors.textPrimary },
                  ]}
                >
                  {preset.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Distance Stepper */}
        <View style={[styles.stepperContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.stepperBtn, { borderColor: colors.border }]}
            onPress={() => setTripDistanceKm((prev) => Math.max(1.0, Number((prev - 0.5).toFixed(1))))}
          >
            <MaterialCommunityIcons name="minus" size={18} color={colors.textPrimary} />
            <Text style={[styles.stepperBtnLabel, { color: colors.textPrimary }]}>0.5 km</Text>
          </TouchableOpacity>

          <View style={styles.stepperValueContainer}>
            <Text style={[styles.stepperValue, { color: colors.textPrimary }]}>
              {tripDistanceKm.toFixed(1)} <Text style={{ fontSize: FONTS.sizes.sm, color: colors.textMuted }}>km</Text>
            </Text>
            <Text style={[styles.stepperSubtext, { color: colors.textSecondary }]}>
              {tripDistanceKm <= 4.0
                ? 'Covers First 4.0 km Base Minimum'
                : `4.0 km Base + ${(tripDistanceKm - 4.0).toFixed(1)} km Succeeding`}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.stepperBtn, { borderColor: colors.border }]}
            onPress={() =>
              setTripDistanceKm((prev) =>
                Math.min(selectedRoute?.distanceKm || 35, Number((prev + 0.5).toFixed(1)))
              )
            }
          >
            <MaterialCommunityIcons name="plus" size={18} color={colors.textPrimary} />
            <Text style={[styles.stepperBtnLabel, { color: colors.textPrimary }]}>0.5 km</Text>
          </TouchableOpacity>
        </View>

        {/* Optional: Stop-to-Stop Selector if route has waypoints */}
        {selectedRoute?.waypoints && selectedRoute.waypoints.length >= 2 && (
          <View style={styles.stopSelectorWrapper}>
            <Text style={[styles.stopSelectorHeader, { color: colors.textSecondary }]}>
              Or Pick Stops Along {selectedRoute.name}:
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
              {selectedRoute.waypoints.map((wp, idx) => {
                const isBoarding = boardingStopIndex === idx;
                const isDropoff = dropoffStopIndex === idx;
                return (
                  <TouchableOpacity
                    key={wp.order || idx}
                    style={[
                      styles.stopChip,
                      {
                        backgroundColor: isBoarding ? '#10B981' : isDropoff ? '#EF4444' : colors.surface,
                        borderColor: isBoarding ? '#10B981' : isDropoff ? '#EF4444' : colors.border,
                      },
                    ]}
                    onPress={() => {
                      if (boardingStopIndex === null || (boardingStopIndex !== null && dropoffStopIndex !== null)) {
                        handleSelectStop(idx, 'boarding');
                      } else {
                        handleSelectStop(idx, 'dropoff');
                      }
                    }}
                  >
                    <Text style={{ fontSize: 10, color: isBoarding || isDropoff ? '#FFFFFF' : colors.textMuted }}>
                      {isBoarding ? '🟢 Boarding' : isDropoff ? '🔴 Alighting' : `Stop #${wp.order || idx + 1}`}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: isBoarding || isDropoff ? '#FFFFFF' : colors.textPrimary,
                        maxWidth: 120,
                      }}
                    >
                      {wp.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* 6. Dynamic Result Card */}
        <Card
          style={[
            styles.resultCard,
            {
              borderTopWidth: 5,
              borderTopColor: vehicleType === 'modern' ? '#0284C7' : colors.primary,
              backgroundColor: colors.surface,
            },
          ]}
        >
          {/* Header Badge */}
          <View
            style={[
              styles.baseFareBadge,
              { backgroundColor: vehicleType === 'modern' ? '#0284C715' : '#16A34A15' },
            ]}
          >
            <MaterialCommunityIcons
              name="check-decagram"
              size={16}
              color={vehicleType === 'modern' ? '#0284C7' : '#16A34A'}
            />
            <Text
              style={[
                styles.baseFareBadgeText,
                { color: vehicleType === 'modern' ? '#0284C7' : '#166534' },
              ]}
            >
              {hasAlighted
                ? 'ACTUAL FARE UPON ALIGHTING'
                : isLiveMeterActive
                ? 'CURRENT METERED TRIP FARE'
                : 'CALCULATED COMMUTER FARE'}
            </Text>
          </View>

          {/* Actual Payable Fare Large Number */}
          <Text
            style={[
              styles.resultFare,
              { color: vehicleType === 'modern' ? '#0284C7' : colors.primary },
            ]}
          >
            {formatPeso(currentFare.finalPayableFare)}
          </Text>

          <Text style={[styles.actualAlightingLabel, { color: colors.textSecondary }]}>
            {hasAlighted
              ? 'Exact amount to hand to the jeepney driver now'
              : 'Amount to pay driver upon getting off the jeepney'}
          </Text>

          {currentFare.isDiscounted && (
            <View style={styles.discountBanner}>
              <MaterialCommunityIcons name="percent-outline" size={13} color="#16A34A" />
              <Text style={styles.discountBannerText}>
                20% Statutory Discount Applied (Regular: {formatPeso(currentFare.regularPayableFare)})
              </Text>
            </View>
          )}

          {/* Transparent Itemized Fare Breakdown */}
          <View
            style={[
              styles.breakdownTable,
              { backgroundColor: colors.surfaceElevated || colors.background, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.breakdownTableHeader, { color: colors.textPrimary }]}>
              Official LTFRB Fare Computation:
            </Text>

            {/* Row 1: Base Fare */}
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownRowLeft}>
                <MaterialCommunityIcons name="ticket-outline" size={15} color={colors.primary} />
                <Text style={[styles.breakdownRowTitle, { color: colors.textPrimary }]}>
                  Base Fare (First 4.0 km)
                </Text>
              </View>
              <Text style={[styles.breakdownRowPrice, { color: colors.textPrimary }]}>
                {formatPeso(currentFare.baseFare)}
              </Text>
            </View>

            {/* Row 2: Succeeding Distance Charge */}
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownRowLeft}>
                <MaterialCommunityIcons name="map-marker-distance" size={15} color="#D97706" />
                <View>
                  <Text style={[styles.breakdownRowTitle, { color: colors.textPrimary }]}>
                    Succeeding Distance
                  </Text>
                  <Text style={{ fontSize: 10, color: colors.textMuted }}>
                    {currentFare.extraKm > 0
                      ? `${currentFare.extraKm} km × ${formatPeso(currentFare.perKmRate)}/km`
                      : 'Within 4.0 km base allowance'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.breakdownRowPrice, { color: colors.textPrimary }]}>
                +{formatPeso(currentFare.extraCharge)}
              </Text>
            </View>

            {/* Row 3: Discount if applicable */}
            {currentFare.isDiscounted && (
              <View style={styles.breakdownRow}>
                <View style={styles.breakdownRowLeft}>
                  <MaterialCommunityIcons name="tag-outline" size={15} color="#16A34A" />
                  <Text style={[styles.breakdownRowTitle, { color: '#16A34A' }]}>
                    20% Discount (Student/Senior/PWD)
                  </Text>
                </View>
                <Text style={[styles.breakdownRowPrice, { color: '#16A34A' }]}>
                  -{formatPeso(currentFare.discountAmount)}
                </Text>
              </View>
            )}

            <View style={[styles.breakdownDivider, { backgroundColor: colors.border }]} />

            {/* Final Total Row */}
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownTotalTitle, { color: colors.textPrimary }]}>
                Total Actual Fare:
              </Text>
              <Text
                style={[
                  styles.breakdownTotalPrice,
                  { color: vehicleType === 'modern' ? '#0284C7' : colors.primary },
                ]}
              >
                {formatPeso(currentFare.finalPayableFare)}
              </Text>
            </View>
          </View>

          {/* Full Corridor Reference */}
          <View style={[styles.fullCorridorRef, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fullCorridorTitle, { color: colors.textSecondary }]}>
                Full Corridor End-to-End (~{selectedRoute?.distanceKm} km):
              </Text>
              <Text style={[styles.fullCorridorSub, { color: colors.textMuted }]}>
                Only payable if you ride the entire length of {selectedRoute?.name}
              </Text>
            </View>
            <Text style={[styles.fullCorridorPrice, { color: colors.textPrimary }]}>
              {formatPeso(computeFare(selectedRoute?.distanceKm || 20).finalPayableFare)}
            </Text>
          </View>

          <Text style={[styles.sourceText, { color: colors.textMuted }]}>
            LTFRB Region 1 Public Utility Jeepney Fare Schedule • Valid for Dagupan City
          </Text>
        </Card>

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
  sectionLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  routeScroll: { marginBottom: SPACING.xxl },
  routeChip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    marginRight: SPACING.sm,
    minHeight: 54,
    justifyContent: 'center',
  },
  routeChipText: { fontSize: FONTS.sizes.sm, fontWeight: '700' },
  routeChipDist: { fontSize: FONTS.sizes.xs, marginTop: 2 },
  toggleRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xxl },
  toggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    minHeight: 56,
  },
  discountGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.xxl },
  discountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    minHeight: 38,
  },
  liveMeterBanner: {
    padding: SPACING.lg,
    borderWidth: 1.5,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.xxl,
  },
  liveMeterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  liveMeterTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '800',
  },
  liveTimerBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  liveTimerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  liveMeterDesc: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: SPACING.md,
  },
  liveMeterActionRow: {
    flexDirection: 'row',
  },
  meterStartBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  meterStartBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: FONTS.sizes.sm,
  },
  meterStopBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  meterStopBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: FONTS.sizes.sm,
  },
  distanceChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  distancePresetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  distancePresetText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  stepperBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  stepperBtnLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 1,
  },
  stepperValueContainer: {
    alignItems: 'center',
  },
  stepperValue: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '900',
  },
  stepperSubtext: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  stopSelectorWrapper: {
    marginBottom: SPACING.lg,
  },
  stopSelectorHeader: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  stopChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginRight: 8,
  },
  resultCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.xl,
  },
  baseFareBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.xs,
  },
  baseFareBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  resultFare: {
    fontSize: 54,
    fontWeight: '900',
    marginVertical: 2,
  },
  actualAlightingLabel: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  discountBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.md,
  },
  discountBannerText: {
    color: '#166534',
    fontSize: 11,
    fontWeight: '700',
  },
  breakdownTable: {
    width: '100%',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  breakdownTableHeader: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  breakdownRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breakdownRowTitle: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '600',
  },
  breakdownRowPrice: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
  },
  breakdownDivider: {
    height: 1,
    marginVertical: SPACING.sm,
  },
  breakdownTotalTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '800',
  },
  breakdownTotalPrice: {
    fontSize: FONTS.sizes.md,
    fontWeight: '900',
  },
  fullCorridorRef: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  fullCorridorTitle: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
  },
  fullCorridorSub: {
    fontSize: 10,
    marginTop: 2,
  },
  fullCorridorPrice: {
    fontSize: FONTS.sizes.md,
    fontWeight: '800',
  },
  sourceText: {
    fontSize: 10,
    marginTop: SPACING.xs,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default FareCalculatorScreen;
