import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
  TouchableOpacity,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useTheme } from "../../contexts/ThemeContext";
import { Card, LoadingSpinner } from "../../components/common/SharedComponents";
import { LocationPermissionModal } from "../../components/common/LocationPermissionPrompt";
import { weatherAPI } from "../../api/services";
import { FONTS, SPACING, RADIUS } from "../../utils/constants";
import { getWeatherIcon, getTravelAdvisory } from "../../utils/helpers";

const WeatherScreen = () => {
  const { colors } = useTheme();
  const [current, setCurrent] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const getUserLocation = async () => {
    try {
      if (Platform.OS === "web") {
        if (typeof navigator !== "undefined" && navigator.geolocation) {
          return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                setPermissionDenied(false);
                resolve({
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                  locationName: null,
                });
              },
              () => {
                setPermissionDenied(true);
                resolve(null);
              },
              { timeout: 8000, maximumAge: 300000 },
            );
          });
        }
        setPermissionDenied(true);
        return null;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setPermissionDenied(true);
        return null;
      }
      setPermissionDenied(false);

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 8000,
      });

      // Device-native reverse geocoding via expo-location
      let locationName = null;
      try {
        const geocoded = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (geocoded && geocoded.length > 0) {
          const g = geocoded[0];
          const city = g.city || g.subregion || g.district || g.name || "";
          const region = g.region || g.country || "";
          if (city && region && city !== region) {
            locationName = `${city}, ${region}`;
          } else {
            locationName = city || region || null;
          }
        }
      } catch (_) {}

      return {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        locationName,
      };
    } catch (_) {
      setPermissionDenied(true);
      return null;
    }
  };

  const loadWeather = async () => {
    try {
      let coords = userCoords;
      if (!coords) {
        coords = await getUserLocation();
        if (coords) setUserCoords(coords);
      }

      const params = coords
        ? {
            latitude: coords.latitude,
            longitude: coords.longitude,
            ...(coords.locationName
              ? { locationName: coords.locationName }
              : {}),
          }
        : {};

      const [currentRes, forecastRes] = await Promise.allSettled([
        weatherAPI.getCurrentWeather(params),
        weatherAPI.getForecast(params),
      ]);
      if (currentRes.status === "fulfilled")
        setCurrent(currentRes.value.data.data);
      if (forecastRes.status === "fulfilled")
        setForecast(forecastRes.value.data.data?.forecast || []);
    } catch (e) {
      /* */
    }
    setLoading(false);
  };

  useEffect(() => {
    loadWeather();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    const coords = await getUserLocation();
    if (coords) setUserCoords(coords);
    await loadWeather();
    setRefreshing(false);
  };

  if (loading) return <LoadingSpinner text="Loading weather data..." />;

  const getConditionString = (cond) => {
    if (!cond) return "Location Permission Needed";
    if (typeof cond === "string") return cond;
    if (typeof cond === "object" && cond.text) return cond.text;
    return "Location Permission Needed";
  };

  const hasLocation =
    current?.current?.hasLocation !== false && userCoords !== null;
  const condText = hasLocation
    ? getConditionString(current?.current?.condition || current?.condition)
    : "Location Permission Needed";

  const advisories =
    hasLocation && current
      ? getTravelAdvisory(
          condText,
          current.current?.wind_kph ?? current.current?.windKph ?? 0,
          current.current?.feelslike_c ?? current.current?.feelsLikeC ?? 0,
        )
      : [];

  const mainIcon = hasLocation
    ? getWeatherIcon(condText)
    : "map-marker-alert-outline";
  const isRainOrStorm =
    condText.toLowerCase().includes("rain") ||
    condText.toLowerCase().includes("thunder");

  // Location display text
  const locationStr = hasLocation
    ? current?.current?.coordinates?.location ||
      userCoords?.locationName ||
      "Your Location"
    : "Please turn on your location permission";

  const lat = current?.current?.coordinates?.latitude ?? userCoords?.latitude;
  const lng = current?.current?.coordinates?.longitude ?? userCoords?.longitude;
  const coordStr =
    hasLocation && lat && lng
      ? `(${Number(lat).toFixed(2)}° N, ${Number(lng).toFixed(2)}° E)`
      : "";

  return (
    <>
      <LocationPermissionModal
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onRetry={async () => {
          setShowLocationModal(false);
          await onRefresh();
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Current Weather Card */}
        <View style={[styles.currentCard, { backgroundColor: colors.primary }]}>
          <TouchableOpacity
            disabled={hasLocation}
            onPress={() => setShowLocationModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.locationText}>
              📍 {locationStr} {coordStr}
            </Text>
          </TouchableOpacity>
          <View style={styles.tempRow}>
            <MaterialCommunityIcons
              name={mainIcon}
              size={64}
              color={isRainOrStorm ? "#93C5FD" : "#FBBF24"}
            />
            <View>
              <Text style={styles.tempText}>
                {hasLocation &&
                (current?.current?.temp_c ?? current?.current?.tempC) !== null
                  ? `${current?.current?.temp_c ?? current?.current?.tempC}°C`
                  : "--°C"}
              </Text>
              <Text style={styles.condText}>{condText}</Text>
            </View>
          </View>

          {hasLocation ? (
            <View style={styles.detailsRow}>
              {[
                {
                  icon: "water-percent",
                  label: "Humidity",
                  value: `${current?.current?.humidity ?? "--"}%`,
                },
                {
                  icon: "weather-windy",
                  label: "Wind",
                  value: `${current?.current?.wind_kph ?? current?.current?.windKph ?? "--"} km/h`,
                },
                {
                  icon: "thermometer",
                  label: "Feels Like",
                  value: `${current?.current?.feelslike_c ?? current?.current?.feelsLikeC ?? "--"}°C`,
                },
              ].map((d, i) => (
                <View key={i} style={styles.detailItem}>
                  <MaterialCommunityIcons
                    name={d.icon}
                    size={18}
                    color="rgba(255,255,255,0.7)"
                  />
                  <Text style={styles.detailValue}>{d.value}</Text>
                  <Text style={styles.detailLabel}>{d.label}</Text>
                </View>
              ))}
            </View>
          ) : (
            <TouchableOpacity
              style={styles.enablePermBtn}
              onPress={() => setShowLocationModal(true)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="crosshairs-gps"
                size={18}
                color={colors.primary}
              />
              <Text style={[styles.enablePermText, { color: colors.primary }]}>
                Enable Location Permission
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.content}>
          {/* Permission Needed Banner if location is not granted */}
          {!hasLocation && (
            <Card
              style={[
                styles.permissionCard,
                { backgroundColor: colors.surface, borderColor: "#F59E0B" },
              ]}
            >
              <View style={styles.permissionRow}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={26}
                  color="#F59E0B"
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.permissionTitle,
                      { color: colors.textPrimary },
                    ]}
                  >
                    Location Permission Required
                  </Text>
                  <Text
                    style={[
                      styles.permissionSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Please turn on your device's location permission so
                    SmartSakay can retrieve real-time weather and localized
                    travel advisories for your exact area.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.grantBtn, { backgroundColor: colors.primary }]}
                onPress={() => setShowLocationModal(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.grantBtnText}>Tap to Allow Location</Text>
              </TouchableOpacity>
            </Card>
          )}

          {/* Automated Weather Notification Status Badge */}
          <Card
            style={[
              styles.daemonBadge,
              {
                backgroundColor: colors.surface,
                borderColor: colors.primary + "35",
              },
            ]}
          >
            <View style={styles.daemonRow}>
              <View style={styles.pulseDot} />
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.daemonTitle, { color: colors.textPrimary }]}
                >
                  Daily Transit Weather Alerts
                </Text>
                <Text
                  style={[
                    styles.daemonSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  Automated morning transit advisories are dispatched daily to
                  your Notifications tab to help plan your daily commute safely.
                </Text>
              </View>
              <MaterialCommunityIcons
                name="bell-ring-outline"
                size={22}
                color={colors.primary}
              />
            </View>
          </Card>

          {/* Travel Advisory */}
          {advisories.map((adv, i) => (
            <Card
              key={i}
              style={[
                styles.advisoryCard,
                {
                  borderLeftWidth: 3,
                  borderLeftColor:
                    adv.type === "warning"
                      ? colors.warning
                      : adv.type === "success"
                        ? colors.accent
                        : colors.info,
                },
              ]}
            >
              <View style={styles.advisoryRow}>
                <MaterialCommunityIcons
                  name={
                    adv.type === "warning"
                      ? "alert"
                      : adv.type === "success"
                        ? "check-circle"
                        : "information"
                  }
                  size={20}
                  color={
                    adv.type === "warning"
                      ? colors.warning
                      : adv.type === "success"
                        ? colors.accent
                        : colors.info
                  }
                />
                <Text
                  style={[styles.advisoryText, { color: colors.textPrimary }]}
                >
                  {adv.message}
                </Text>
              </View>
            </Card>
          ))}

          {/* 3-Day Forecast */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            3-Day Transit Forecast
          </Text>
          {forecast.length > 0 ? (
            forecast.map((day, i) => {
              const dayCondition =
                day.day?.condition?.text ||
                day.conditionText ||
                day.condition ||
                "Partly Cloudy";
              const dayIcon = getWeatherIcon(dayCondition);
              const rainChance =
                day.day?.daily_chance_of_rain ?? day.chanceOfRain;

              return (
                <Card key={i} style={styles.forecastCard}>
                  <View style={styles.forecastRow}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: SPACING.md,
                        flex: 1,
                      }}
                    >
                      <MaterialCommunityIcons
                        name={dayIcon}
                        size={28}
                        color={colors.primary}
                      />
                      <View style={styles.forecastLeft}>
                        <Text
                          style={[
                            styles.forecastDay,
                            { color: colors.textPrimary },
                          ]}
                        >
                          {i === 0
                            ? "Today"
                            : new Date(day.date).toLocaleDateString("en-PH", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                        </Text>
                        <Text
                          style={[
                            styles.forecastCond,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {dayCondition}{" "}
                          {rainChance !== undefined
                            ? `• ${rainChance}% rain`
                            : ""}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.forecastRight}>
                      <Text
                        style={[
                          styles.forecastHigh,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {day.day?.maxtemp_c ?? day.maxTempC ?? "--"}°
                      </Text>
                      <Text
                        style={[
                          styles.forecastLow,
                          { color: colors.textMuted },
                        ]}
                      >
                        {day.day?.mintemp_c ?? day.minTempC ?? "--"}°
                      </Text>
                    </View>
                  </View>
                </Card>
              );
            })
          ) : (
            <Card>
              <Text style={[styles.noData, { color: colors.textMuted }]}>
                {hasLocation
                  ? "Forecast data not available"
                  : "Please enable location permission to view forecast"}
              </Text>
            </Card>
          )}

          <Text style={[styles.footer, { color: colors.textMuted }]}>
            SmartSakay Realtime Weather • RIDE SAFE. RIDE SMART.
          </Text>
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  currentCard: {
    paddingTop: 50,
    paddingBottom: SPACING.xxl,
    paddingHorizontal: SPACING.xxl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  locationText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: FONTS.sizes.sm,
    marginBottom: SPACING.md,
    fontWeight: "600",
  },
  tempRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  tempText: { fontSize: 56, fontWeight: "800", color: "#FFFFFF" },
  condText: { fontSize: FONTS.sizes.lg, color: "rgba(255,255,255,0.9)" },
  detailsRow: { flexDirection: "row", justifyContent: "space-around" },
  detailItem: { alignItems: "center", gap: 4 },
  detailValue: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: FONTS.sizes.md,
  },
  detailLabel: { color: "rgba(255,255,255,0.6)", fontSize: FONTS.sizes.xs },
  enablePermBtn: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    gap: 8,
    marginTop: 8,
  },
  enablePermText: { fontWeight: "700", fontSize: FONTS.sizes.sm },
  content: { padding: SPACING.xl },
  permissionCard: {
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
    borderWidth: 1.5,
    borderRadius: RADIUS.lg,
  },
  permissionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  permissionTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: "700",
    marginBottom: 4,
  },
  permissionSubtitle: { fontSize: FONTS.sizes.xs, lineHeight: 18 },
  grantBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
  },
  grantBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: FONTS.sizes.sm,
  },
  advisoryCard: { marginBottom: SPACING.sm },
  advisoryRow: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  advisoryText: { fontSize: FONTS.sizes.sm, flex: 1, lineHeight: 20 },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
    marginBottom: SPACING.md,
    marginTop: SPACING.md,
  },
  forecastCard: { marginBottom: SPACING.sm },
  forecastRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  forecastLeft: { flex: 1 },
  forecastDay: { fontSize: FONTS.sizes.md, fontWeight: "600" },
  forecastCond: { fontSize: FONTS.sizes.sm, marginTop: 2 },
  forecastRight: { flexDirection: "row", gap: SPACING.md },
  forecastHigh: { fontSize: FONTS.sizes.lg, fontWeight: "700" },
  forecastLow: { fontSize: FONTS.sizes.lg },
  noData: {
    textAlign: "center",
    fontSize: FONTS.sizes.sm,
    paddingVertical: SPACING.md,
  },
  footer: {
    textAlign: "center",
    fontSize: FONTS.sizes.xs,
    marginTop: SPACING.xl,
  },
  daemonBadge: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
  },
  daemonRow: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
  },
  daemonTitle: { fontSize: FONTS.sizes.sm, fontWeight: "700", marginBottom: 2 },
  daemonSubtitle: { fontSize: FONTS.sizes.xs, lineHeight: 16 },
});

export default WeatherScreen;
