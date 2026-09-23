import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { FONTS, SPACING, RADIUS } from '../../utils/constants';

import RouteMapScreen from '../map/RouteMapScreen';
import FareCalculatorScreen from '../fare/FareCalculatorScreen';
import FareMatrixScreen from '../fare/FareMatrixScreen';

const RoutesAndFaresScreen = ({ route, navigation }) => {
  const { colors } = useTheme();
  // Default to 'routes', but allow passing initialTab: 'fares' or 'routes' via route.params
  const [activeTab, setActiveTab] = useState(route?.params?.initialTab || 'routes');
  const [fareSubTab, setFareSubTab] = useState('calculator'); // 'calculator' | 'matrix'

  useEffect(() => {
    if (route?.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
  }, [route?.params?.initialTab]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Segmented Tab Switcher */}
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.segmentContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
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
              name="map-marker-radius"
              size={18}
              color={activeTab === 'routes' ? '#FFFFFF' : colors.textSecondary}
            />
            <Text
              style={[
                styles.segmentText,
                { color: activeTab === 'routes' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              Route Maps
            </Text>
          </TouchableOpacity>

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
              size={18}
              color={activeTab === 'fares' ? '#FFFFFF' : colors.textSecondary}
            />
            <Text
              style={[
                styles.segmentText,
                { color: activeTab === 'fares' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              Fares & Matrix
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.body}>
        {activeTab === 'routes' ? (
          <RouteMapScreen navigation={navigation} />
        ) : (
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
                  Fare Calculator
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: RADIUS.full,
    padding: 3,
    borderWidth: 1,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  segmentText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
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
