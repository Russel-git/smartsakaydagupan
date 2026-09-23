import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, usersAPI } from '../api/services';
import { getErrorMessage } from '../api/client';
import {
  saveTokens, clearTokens, saveUser, getUser, clearUser,
  getAccessToken, setGuestMode, getGuestMode,
} from '../utils/storage';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [initialAuthScreen, setInitialAuthScreen] = useState('Welcome');
  const [error, setError] = useState(null);

  // Check stored auth on app start
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const guestMode = await getGuestMode();
        if (guestMode) {
          setIsGuest(true);
          setIsLoading(false);
          return;
        }

        const token = await getAccessToken();
        if (token) {
          const storedUser = await getUser();
          if (storedUser) {
            setUser(storedUser);
            // Verify token is still valid by fetching fresh profile
            try {
              const { data } = await usersAPI.getProfile();
              setUser(data.data);
              await saveUser(data.data);
            } catch (e) {
              // Token expired and refresh failed
              await clearTokens();
              await clearUser();
              setUser(null);
            }
          }
        }
      } catch (e) {
        console.log('Auth load error:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadAuthState();
  }, []);

  const register = useCallback(async (email, password, firstName, lastName, suffix = '') => {
    setError(null);
    try {
      const { data } = await authAPI.register({ email, password, firstName, lastName, suffix });
      if (data?.data?.accessToken) {
        const { user: userData, accessToken, refreshToken } = data.data;
        await saveTokens(accessToken, refreshToken);
        await saveUser(userData);
        await setGuestMode(false);
        setUser(userData);
        setIsGuest(false);
      }
      return data;
    } catch (e) {
      const msg = getErrorMessage(e);
      setError(msg);
      throw new Error(msg);
    }
  }, []);


  const verifyOtp = useCallback(async (email, code) => {
    setError(null);
    try {
      const { data } = await authAPI.verifyOtp({ email, code });
      const { user: userData, accessToken, refreshToken } = data.data;
      await saveTokens(accessToken, refreshToken);
      await saveUser(userData);
      await setGuestMode(false);
      setUser(userData);
      setIsGuest(false);
      return data;
    } catch (e) {
      const msg = getErrorMessage(e);
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const resendOtp = useCallback(async (email, type = 'registration') => {
    setError(null);
    try {
      const { data } = await authAPI.resendOtp({ email, type });
      return data;
    } catch (e) {
      const msg = getErrorMessage(e);
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const { data } = await authAPI.login({ email, password });
      const { user: userData, accessToken, refreshToken } = data.data;
      await saveTokens(accessToken, refreshToken);
      await saveUser(userData);
      await setGuestMode(false);
      setUser(userData);
      setIsGuest(false);
      return data;
    } catch (e) {
      const msg = getErrorMessage(e);
      setError(msg);
      const err = new Error(msg);
      err.response = e.response;
      throw err;
    }
  }, []);

  const forgotPassword = useCallback(async (email) => {
    setError(null);
    try {
      const { data } = await authAPI.forgotPassword({ email });
      return data;
    } catch (e) {
      const msg = getErrorMessage(e);
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const resetPassword = useCallback(async (email, code, newPassword) => {
    setError(null);
    try {
      const { data } = await authAPI.resetPassword({ email, code, newPassword });
      return data;
    } catch (e) {
      const msg = getErrorMessage(e);
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (e) {
      // Ignore logout API errors
    }
    await clearTokens();
    await clearUser();
    await setGuestMode(false);
    setInitialAuthScreen('Welcome');
    setUser(null);
    setIsGuest(false);
  }, []);

  const enterGuestMode = useCallback(async () => {
    await setGuestMode(true);
    setIsGuest(true);
  }, []);

  const exitGuestMode = useCallback(async (targetScreen = 'Welcome') => {
    await setGuestMode(false);
    setInitialAuthScreen(targetScreen);
    setIsGuest(false);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const { data } = await usersAPI.getProfile();
      setUser(data.data);
      await saveUser(data.data);
    } catch (e) {
      console.log('Profile refresh error:', e);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isGuest,
        initialAuthScreen,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        error,
        setError,
        register,
        verifyOtp,
        resendOtp,
        login,
        forgotPassword,
        resetPassword,
        logout,
        enterGuestMode,
        exitGuestMode,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
