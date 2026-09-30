import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import FeedbackToast from '../components/common/FeedbackToast';

const FeedbackContext = createContext(null);

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};

export const FeedbackProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const hideToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback(
    ({ type = 'info', title, message, duration = 3500 }) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      setToast({
        id: Date.now(),
        type,
        title,
        message,
        duration,
      });

      if (duration > 0) {
        timerRef.current = setTimeout(() => {
          hideToast();
        }, duration);
      }
    },
    [hideToast]
  );

  const showSuccess = useCallback(
    (title, message, duration = 3500) => {
      showToast({ type: 'success', title, message, duration });
    },
    [showToast]
  );

  const showError = useCallback(
    (title, message, duration = 4000) => {
      showToast({ type: 'error', title, message, duration });
    },
    [showToast]
  );

  const showInfo = useCallback(
    (title, message, duration = 3500) => {
      showToast({ type: 'info', title, message, duration });
    },
    [showToast]
  );

  const showWarning = useCallback(
    (title, message, duration = 3500) => {
      showToast({ type: 'warning', title, message, duration });
    },
    [showToast]
  );

  return (
    <FeedbackContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showInfo,
        showWarning,
        hideToast,
      }}
    >
      {children}
      <FeedbackToast toast={toast} onDismiss={hideToast} />
    </FeedbackContext.Provider>
  );
};

export default FeedbackContext;
