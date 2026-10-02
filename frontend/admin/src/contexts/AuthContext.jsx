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

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const user = data.data.user;

    const allowedRoles = ['superadmin', 'admin', 'lgu'];
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

  const isSuperAdmin = admin?.role === 'superadmin';
  const isOperator = admin?.role === 'admin';
  const isLgu = admin?.role === 'lgu';

  return (
    <AuthContext.Provider
      value={{
        admin,
        loading,
        login,
        logout,
        isSuperAdmin,
        isOperator,
        isLgu,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
