import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ACCESS_TOKEN: '@smartsakay_access_token',
  REFRESH_TOKEN: '@smartsakay_refresh_token',
  USER: '@smartsakay_user',
  THEME: '@smartsakay_theme',
  GUEST_MODE: '@smartsakay_guest_mode',
  RIDE_HISTORY: '@smartsakay_ride_history',
};

// Token storage
export const saveTokens = async (accessToken, refreshToken) => {
  try {
    if (typeof AsyncStorage?.multiSet === 'function') {
      await AsyncStorage.multiSet([
        [KEYS.ACCESS_TOKEN, accessToken],
        [KEYS.REFRESH_TOKEN, refreshToken],
      ]);
      return;
    }
  } catch (e) {
    // Fall back to sequential setItem
  }
  await AsyncStorage.setItem(KEYS.ACCESS_TOKEN, accessToken);
  await AsyncStorage.setItem(KEYS.REFRESH_TOKEN, refreshToken);
};

export const getAccessToken = () => AsyncStorage.getItem(KEYS.ACCESS_TOKEN);
export const getRefreshToken = () => AsyncStorage.getItem(KEYS.REFRESH_TOKEN);

export const clearTokens = async () => {
  try {
    if (typeof AsyncStorage?.multiRemove === 'function') {
      await AsyncStorage.multiRemove([KEYS.ACCESS_TOKEN, KEYS.REFRESH_TOKEN]);
      return;
    }
  } catch (e) {
    // Fall back to sequential removeItem
  }
  await AsyncStorage.removeItem(KEYS.ACCESS_TOKEN);
  await AsyncStorage.removeItem(KEYS.REFRESH_TOKEN);
};

// User storage
export const saveUser = async (user) => {
  await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
};

export const getUser = async () => {
  const data = await AsyncStorage.getItem(KEYS.USER);
  return data ? JSON.parse(data) : null;
};

export const clearUser = () => AsyncStorage.removeItem(KEYS.USER);

// Theme preference
export const saveTheme = (theme) => AsyncStorage.setItem(KEYS.THEME, theme);
export const getTheme = () => AsyncStorage.getItem(KEYS.THEME);

// Guest mode
export const setGuestMode = (isGuest) =>
  AsyncStorage.setItem(KEYS.GUEST_MODE, JSON.stringify(isGuest));
export const getGuestMode = async () => {
  const data = await AsyncStorage.getItem(KEYS.GUEST_MODE);
  return data ? JSON.parse(data) : false;
};

// Ride History
export const getRideHistory = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.RIDE_HISTORY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.warn('Error reading ride history:', e);
    return [];
  }
};

export const saveRideToHistory = async (ride) => {
  try {
    const history = await getRideHistory();
    const updated = [ride, ...history].slice(0, 50); // Keep last 50 rides
    await AsyncStorage.setItem(KEYS.RIDE_HISTORY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('Error saving ride history:', e);
  }
};

export const clearRideHistory = async () => {
  try {
    await AsyncStorage.removeItem(KEYS.RIDE_HISTORY);
  } catch (e) {
    console.warn('Error clearing ride history:', e);
  }
};

// Clear all app data
export const clearAllData = async () => {
  const keys = Object.values(KEYS);
  try {
    if (typeof AsyncStorage?.multiRemove === 'function') {
      await AsyncStorage.multiRemove(keys);
      return;
    }
  } catch (e) {
    // Fall back to sequential removeItem
  }
  for (const k of keys) {
    await AsyncStorage.removeItem(k);
  }
};

export default {
  saveTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens,
  saveUser,
  getUser,
  clearUser,
  saveTheme,
  getTheme,
  setGuestMode,
  getGuestMode,
  getRideHistory,
  saveRideToHistory,
  clearRideHistory,
  clearAllData,
};
