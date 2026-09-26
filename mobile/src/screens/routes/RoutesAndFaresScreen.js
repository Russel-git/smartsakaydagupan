import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { FONTS, SPACING, RADIUS } from '../../utils/constants';
import { getRideHistory } from '../../utils/storage';

import RouteMapScreen from '../map/RouteMapScreen';
import PinpointFareScreen from '../fare/PinpointFareScreen';
import FareCalculatorScreen from '../fare/FareCalculatorScreen';
import FareMatrixScreen from '../fare/FareMatrixScreen';

const RoutesAndFaresScreen = ({ route, navigation }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Cross-device top inset calculation:
  // On Android, use the maximum of insets.top and StatusBar.currentHeight to guarantee
  // that content is pushed below punch-hole cameras, notches, and status icons.
  const topInset = Platform.OS === 'android'
    ? Math.max(insets.top, StatusBar.currentHeight || 28)
    : insets.top;

  // Default tab: 'routes' | 'tricycle' | 'fares'
  const [activeTab, setActiveTab] = useState(route?.params?.initialTab || 'routes');
  const [fareSubTab, setFareSubTab] = useState('calculator'); // 'calculator' | 'matrix'
  const [historyCount, setHistoryCount] = useState(0);

  const loadHistoryCount = async () => {
    try {
      const hist = await getRideHistory();
      setHistoryCount(Array.isArray(hist) ? hist.length : 0);
    } catch (_) {}
  };

  useEffect(() => {
    loadHistoryCount();
  }, [activeTab]);

  useEffect(() => {
    if (route?.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
  }, [route?.params?.initialTab]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={colors.isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent={Platform.OS === 'android'}
      />

      {/* Top Navigation Bar: 3 Modes + Ride History Action */}
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            paddingTop: topInset + (Platform.OS === 'ios' ? 4 : 8),
            paddingLeft: Math.max(insets.left, SPACING.md),
            paddingRight: Math.max(insets.right, SPACING.md),
          },
        ]}
      >
        <View style={[styles.segmentContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
          {/* TAB 1: JEEPNEY ROUTES & HUBS */}
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeTab === 'routes' && {
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 2,
              },
            ]}
            onPress={() => setActiveTab('routes')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="van-passenger"
              size={16}
              color={activeTab === 'routes' ? '#FFFFFF' : colors.textSecondary}
            />
            <Text
              style={[
                styles.segmentText,
                { color: activeTab === 'routes' ? '#FFFFFF' : colors.textSecondary },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              Jeepneys
            </Text>
          </TouchableOpacity>

          {/* TAB 2: TRICYCLE PINPOINT */}
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeTab === 'tricycle' && {
                backgroundColor: '#D97706',
                shadowColor: '#D97706',
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 2,
              },
            ]}
            onPress={() => setActiveTab('tricycle')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="moped"
              size={16}
              color={activeTab === 'tricycle' ? '#FFFFFF' : colors.textSecondary}
            />
            <Text
              style={[
                styles.segmentText,
                { color: activeTab === 'tricycle' ? '#FFFFFF' : colors.textSecondary },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              Tricycle
            </Text>
          </TouchableOpacity>

          {/* TAB 3: OFFICIAL FARES */}
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeTab === 'fares' && {
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 2,
              },
            ]}
            onPress={() => setActiveTab('fares')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="calculator"
              size={16}
              color={activeTab === 'fares' ? '#FFFFFF' : colors.textSecondary}
            />
            <Text
              style={[
                styles.segmentText,
                { color: activeTab === 'fares' ? '#FFFFFF' : colors.textSecondary },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              Fares
            </Text>
          </TouchableOpacity>
        </View>

        {/* RIDE HISTORY BUTTON */}
        <TouchableOpacity
          style={[styles.historyBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
          onPress={() => navigation.navigate('RideHistory')}
          activeOpacity={0.8}
          accessibilityLabel="View Ride History"
        >
          <MaterialCommunityIcons name="history" size={20} color={colors.primary} />
          {historyCount > 0 && (
            <View style={[styles.historyBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.historyBadgeText}>
                {historyCount > 9 ? '9+' : historyCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View style={styles.body}>
        {activeTab === 'routes' && (
          <RouteMapScreen navigation={navigation} />
        )}

        {activeTab === 'tricycle' && (
          <PinpointFareScreen navigation={navigation} />
        )}

        {activeTab === 'fares' && (
          <View style={styles.fareContainer}>
            {/* Fare Sub-tab switcher */}
            <View style={[styles.subTabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
              <TouchableOpacity
                style={[
                  styles.subTabBtn,
                  fareSubTab === 'calculator' && [styles.subTabActive, { borderBottomColor: colors.primary }],
                ]}
                onPress={() => setFareSubTab('calculator')}
              >
                <Text
                  style={[
                    styles.subTabText,
                    { color: fareSubTab === 'calculator' ? colors.primary : colors.textMuted },
                  ]}
                >
                  Station Fare
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.subTabBtn,
                  fareSubTab === 'matrix' && [styles.subTabActive, { borderBottomColor: colors.primary }],
                ]}
                onPress={() => setFareSubTab('matrix')}
              >
                <Text
                  style={[
                    styles.subTabText,
                    { color: fareSubTab === 'matrix' ? colors.primary : colors.textMuted },
                  ]}
                >
                  Official Fare Matrix
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sub-tab view */}
            <View style={{ flex: 1 }}>
              {fareSubTab === 'calculator' ? (
                <FareCalculatorScreen navigation={navigation} />
              ) : (
                <FareMatrixScreen navigation={navigation} />
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: SPACING.sm + 2,
    borderBottomWidth: 1,
    gap: 8,
  },
  segmentContainer: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: RADIUS.full,
    padding: 3,
    borderWidth: 1,
  },
  segmentBtn: {
    flex: 1,
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderRadius: RADIUS.full,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
  },
  historyBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  historyBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  historyBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  body: {
    flex: 1,
  },
  fareContainer: {
    flex: 1,
  },
  subTabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: SPACING.md,
  },
  subTabBtn: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  subTabActive: {
    borderBottomWidth: 2,
  },
  subTabText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
  },
});

export default RoutesAndFaresScreen;
