import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import AdminToast from '../components/common/AdminToast';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const removeToast = useCallback((id) => {
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = 'info', title, message, duration = 4000 }) => {
      const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newToast = { id, type, title, message };

      setToasts((prev) => [...prev.slice(-4), newToast]); // keep maximum 5 active toasts

      if (duration > 0) {
        timersRef.current[id] = setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const showSuccess = useCallback(
    (title, message, duration = 4000) => {
      return showToast({ type: 'success', title, message, duration });
    },
    [showToast]
  );

  const showError = useCallback(
    (title, message, duration = 5000) => {
      return showToast({ type: 'error', title, message, duration });
    },
    [showToast]
  );

  const showInfo = useCallback(
    (title, message, duration = 4000) => {
      return showToast({ type: 'info', title, message, duration });
    },
    [showToast]
  );

  const showWarning = useCallback(
    (title, message, duration = 4500) => {
      return showToast({ type: 'warning', title, message, duration });
    },
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showInfo,
        showWarning,
        removeToast,
      }}
    >
      {children}
      <AdminToast toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

export default ToastContext;
