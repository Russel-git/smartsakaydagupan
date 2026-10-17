import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    try {
      const savedToken = localStorage.getItem('smartsakay_admin_token');
      const savedUser = localStorage.getItem('smartsakay_admin_user');
      if (savedToken && savedUser) {
        return JSON.parse(savedUser);
      }
    } catch (e) {
      console.warn('Storage access failed or cleared:', e);
    }
    return null;
  });
  const [loading, setLoading] = useState(false);

  // Periodic heartbeat check: immediately logs out if LGU suspends the account
  useEffect(() => {
    if (!admin) return;
    const interval = setInterval(async () => {
      try {
        const { data } = await api.get('/auth/me');
        if (data?.data && data.data.isActive === false) {
          logout();
          window.location.href = '/login?suspended=true';
        }
      } catch (err) {
        if (
          err.response?.status === 401 ||
          (err.response?.status === 403 &&
            (err.response?.data?.message?.toLowerCase().includes('deactivated') ||
             err.response?.data?.message?.toLowerCase().includes('suspended')))
        ) {
          logout();
          window.location.href = '/login?suspended=true';
        }
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [admin]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const user = data.data.user;

    const allowedRoles = ['admin', 'lgu', 'poso'];
    if (!allowedRoles.includes(user.role)) {
      throw new Error('Access denied. Console access is restricted to authorized administrative personnel.');
    }

    localStorage.setItem('smartsakay_admin_token', data.data.accessToken);
    localStorage.setItem('smartsakay_admin_user', JSON.stringify(user));
    setAdmin(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('smartsakay_admin_token');
    localStorage.removeItem('smartsakay_admin_user');
    setAdmin(null);
  };

  const updateUser = (updatedUser) => {
    setAdmin(updatedUser);
    try {
      localStorage.setItem('smartsakay_admin_user', JSON.stringify(updatedUser));
    } catch (e) {
      console.warn('Could not persist updated user:', e);
    }
  };

  const isAdmin = admin?.role === 'admin';
  const isLgu = admin?.role === 'lgu';
  const isPoso = admin?.role === 'poso';
  const isSuperAdmin = isAdmin; // backward compatibility
  const isOperator = isAdmin;   // backward compatibility

  return (
    <AuthContext.Provider
      value={{
        admin,
        user: admin,
        loading,
        login,
        logout,
        updateUser,
        isAdmin,
        isLgu,
        isPoso,
        isSuperAdmin,
        isOperator,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
