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
    accent: '#10B981',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.3)',
  },
  error: {
    accent: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.3)',
  },
  warning: {
    accent: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.3)',
  },
  info: {
    accent: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(59, 130, 246, 0.3)',
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
        gap: '12px',
        maxWidth: '420px',
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
              backgroundColor: 'rgba(17, 24, 39, 0.94)',
              backdropFilter: 'blur(12px)',
              border: `1px solid ${color.border}`,
              borderLeft: `4px solid ${color.accent}`,
              borderRadius: '12px',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.55)',
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
                  color: '#FFFFFF',
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
                color: 'var(--text-dim, #64748B)',
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
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
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
