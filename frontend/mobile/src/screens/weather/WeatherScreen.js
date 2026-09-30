import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Card, LoadingSpinner } from '../../components/common/SharedComponents';
import { weatherAPI } from '../../api/services';
import { FONTS, SPACING, RADIUS } from '../../utils/constants';
import { getWeatherIcon, getTravelAdvisory } from '../../utils/helpers';

const WeatherScreen = () => {
  const { colors } = useTheme();
  const [current, setCurrent] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadWeather = async () => {
    try {
      const [currentRes, forecastRes] = await Promise.allSettled([
        weatherAPI.getCurrentWeather(),
        weatherAPI.getForecast(),
      ]);
      if (currentRes.status === 'fulfilled') setCurrent(currentRes.value.data.data);
      if (forecastRes.status === 'fulfilled') setForecast(forecastRes.value.data.data?.forecast || []);
    } catch (e) { /* */ }
    setLoading(false);
  };

  useEffect(() => { loadWeather(); }, []);

  const onRefresh = async () => { setRefreshing(true); await loadWeather(); setRefreshing(false); };

  if (loading) return <LoadingSpinner text="Loading weather data..." />;

  const getConditionString = (cond) => {
    if (!cond) return 'Partly Cloudy';
    if (typeof cond === 'string') return cond;
    if (typeof cond === 'object' && cond.text) return cond.text;
    return 'Partly Cloudy';
  };

  const condText = getConditionString(current?.current?.condition || current?.condition);
  const advisories = current
    ? getTravelAdvisory(
        condText,
        current.current?.wind_kph ?? current.current?.windKph ?? 0,
        current.current?.feelslike_c ?? current.current?.feelsLikeC ?? 0
      )
    : [];

  const mainIcon = getWeatherIcon(condText);
  const isRainOrStorm = condText.toLowerCase().includes('rain') || condText.toLowerCase().includes('thunder');

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      {/* Current Weather */}
      <View style={[styles.currentCard, { backgroundColor: colors.primary }]}>
        <Text style={styles.locationText}>📍 Dagupan City, Pangasinan (16.04° N, 120.33° E)</Text>
        <View style={styles.tempRow}>
          <MaterialCommunityIcons name={mainIcon} size={64} color={isRainOrStorm ? "#93C5FD" : "#FBBF24"} />
          <View>
            <Text style={styles.tempText}>
              {current?.current?.temp_c ?? current?.current?.tempC ?? '--'}°C
            </Text>
            <Text style={styles.condText}>
              {condText}
            </Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          {[
            { icon: 'water-percent', label: 'Humidity', value: `${current?.current?.humidity ?? '--'}%` },
            { icon: 'weather-windy', label: 'Wind', value: `${current?.current?.wind_kph ?? current?.current?.windKph ?? '--'} km/h` },
            { icon: 'thermometer', label: 'Feels Like', value: `${current?.current?.feelslike_c ?? current?.current?.feelsLikeC ?? '--'}°C` },
          ].map((d, i) => (
            <View key={i} style={styles.detailItem}>
              <MaterialCommunityIcons name={d.icon} size={18} color="rgba(255,255,255,0.7)" />
              <Text style={styles.detailValue}>{d.value}</Text>
              <Text style={styles.detailLabel}>{d.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.content}>
        {/* Automated Weather Notification Status Badge */}
        <Card style={[styles.daemonBadge, { backgroundColor: colors.surface, borderColor: colors.primary + '35' }]}>
          <View style={styles.daemonRow}>
            <View style={styles.pulseDot} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.daemonTitle, { color: colors.textPrimary }]}>
                Dagupan Auto-Weather Alerts Active
              </Text>
              <Text style={[styles.daemonSubtitle, { color: colors.textSecondary }]}>
                Continuously monitors Dagupan City weather. When rain, thunderstorms, or severe heat occur, transit alerts are dispatched automatically to your Notifications tab.
              </Text>
            </View>
            <MaterialCommunityIcons name="bell-ring-outline" size={22} color={colors.primary} />
          </View>
        </Card>

        {/* Travel Advisory */}
        {advisories.map((adv, i) => (
          <Card key={i} style={[styles.advisoryCard, {
            borderLeftWidth: 3,
            borderLeftColor: adv.type === 'warning' ? colors.warning : adv.type === 'success' ? colors.accent : colors.info,
          }]}>
            <View style={styles.advisoryRow}>
              <MaterialCommunityIcons
                name={adv.type === 'warning' ? 'alert' : adv.type === 'success' ? 'check-circle' : 'information'}
                size={20}
                color={adv.type === 'warning' ? colors.warning : adv.type === 'success' ? colors.accent : colors.info}
              />
              <Text style={[styles.advisoryText, { color: colors.textPrimary }]}>{adv.message}</Text>
            </View>
          </Card>
        ))}

        {/* 3-Day Forecast */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>3-Day Transit Forecast</Text>
        {forecast.length > 0 ? (
          forecast.map((day, i) => {
            const dayCondition = day.day?.condition?.text || day.conditionText || day.condition || 'Partly Cloudy';
            const dayIcon = getWeatherIcon(dayCondition);
            const rainChance = day.day?.daily_chance_of_rain ?? day.chanceOfRain;

            return (
              <Card key={i} style={styles.forecastCard}>
                <View style={styles.forecastRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 }}>
                    <MaterialCommunityIcons name={dayIcon} size={28} color={colors.primary} />
                    <View style={styles.forecastLeft}>
                      <Text style={[styles.forecastDay, { color: colors.textPrimary }]}>
                        {i === 0 ? 'Today' : new Date(day.date).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </Text>
                      <Text style={[styles.forecastCond, { color: colors.textSecondary }]}>
                        {dayCondition} {rainChance !== undefined ? `• ${rainChance}% rain` : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.forecastRight}>
                    <Text style={[styles.forecastHigh, { color: colors.textPrimary }]}>
                      {day.day?.maxtemp_c ?? day.maxTempC ?? '--'}°
                    </Text>
                    <Text style={[styles.forecastLow, { color: colors.textMuted }]}>
                      {day.day?.mintemp_c ?? day.minTempC ?? '--'}°
                    </Text>
                  </View>
                </View>
              </Card>
            );
          })
        ) : (
          <Card>
            <Text style={[styles.noData, { color: colors.textMuted }]}>Forecast data not available</Text>
          </Card>
        )}

        <Text style={[styles.footer, { color: colors.textMuted }]}>
          Live Telemetry: Open-Meteo & WeatherAPI • Free & Real-Time • Hourly Automated Sync
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  currentCard: { paddingTop: 50, paddingBottom: SPACING.xxl, paddingHorizontal: SPACING.xxl, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  locationText: { color: 'rgba(255,255,255,0.8)', fontSize: FONTS.sizes.sm, marginBottom: SPACING.md },
  tempRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xl, marginBottom: SPACING.xl },
  tempText: { fontSize: 56, fontWeight: '800', color: '#FFFFFF' },
  condText: { fontSize: FONTS.sizes.lg, color: 'rgba(255,255,255,0.8)' },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  detailItem: { alignItems: 'center', gap: 4 },
  detailValue: { color: '#FFFFFF', fontWeight: '700', fontSize: FONTS.sizes.md },
  detailLabel: { color: 'rgba(255,255,255,0.6)', fontSize: FONTS.sizes.xs },
  content: { padding: SPACING.xl },
  advisoryCard: { marginBottom: SPACING.sm },
  advisoryRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  advisoryText: { fontSize: FONTS.sizes.sm, flex: 1, lineHeight: 20 },
  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', marginBottom: SPACING.md, marginTop: SPACING.md },
  forecastCard: { marginBottom: SPACING.sm },
  forecastRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  forecastLeft: { flex: 1 },
  forecastDay: { fontSize: FONTS.sizes.md, fontWeight: '600' },
  forecastCond: { fontSize: FONTS.sizes.sm, marginTop: 2 },
  forecastRight: { flexDirection: 'row', gap: SPACING.md },
  forecastHigh: { fontSize: FONTS.sizes.lg, fontWeight: '700' },
  forecastLow: { fontSize: FONTS.sizes.lg },
  noData: { textAlign: 'center', fontSize: FONTS.sizes.sm },
  footer: { textAlign: 'center', fontSize: FONTS.sizes.xs, marginTop: SPACING.xl },
  daemonBadge: { marginBottom: SPACING.md, padding: SPACING.md, borderWidth: 1, borderRadius: RADIUS.lg },
  daemonRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  pulseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981' },
  daemonTitle: { fontSize: FONTS.sizes.sm, fontWeight: '700', marginBottom: 2 },
  daemonSubtitle: { fontSize: FONTS.sizes.xs, lineHeight: 16 },
});

export default WeatherScreen;
