import React from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLORS = {
  success: {
    accent: '#16a34a',
    bg: '#dcfce7',
    border: '#86efac',
  },
  error: {
    accent: '#b91c1c',
    bg: '#fee2e2',
    border: '#fca5a5',
  },
  warning: {
    accent: '#b45309',
    bg: '#fef3c7',
    border: '#fde68a',
  },
  info: {
    accent: '#1d4ed8',
    bg: '#dbeafe',
    border: '#93c5fd',
  },
};

const AdminToast = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '380px',
        width: 'calc(100vw - 48px)',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type] || Info;
        const color = COLORS[toast.type] || COLORS.info;

        return (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '14px 16px',
              backgroundColor: '#ffffff',
              border: `1px solid ${color.border}`,
              borderLeft: `4px solid ${color.accent}`,
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.10)',
              animation: 'toastSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              transition: 'all 0.2s ease',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: color.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: color.accent,
                marginTop: '1px',
              }}
            >
              <Icon size={18} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#111827',
                  lineHeight: '1.4',
                  marginBottom: toast.message ? '2px' : 0,
                }}
              >
                {toast.title}
              </div>
              {toast.message && (
                <div
                  style={{
                    fontSize: '12.5px',
                    color: 'var(--text-muted, #94A3B8)',
                    lineHeight: '1.45',
                  }}
                >
                  {toast.message}
                </div>
              )}
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: '4px',
                flexShrink: 0,
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#111827')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
              aria-label="Close notification"
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default AdminToast;
