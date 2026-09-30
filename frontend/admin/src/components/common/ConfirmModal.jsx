import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X, Info } from 'lucide-react';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger', // 'danger' | 'warning' | 'info'
  loading = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      accentColor: '#EF4444',
      bgGlow: 'rgba(239, 68, 68, 0.15)',
      borderColor: 'rgba(239, 68, 68, 0.3)',
      icon: <Trash2 size={24} color="#EF4444" />,
    },
    warning: {
      accentColor: '#F59E0B',
      bgGlow: 'rgba(245, 158, 11, 0.15)',
      borderColor: 'rgba(245, 158, 11, 0.3)',
      icon: <AlertTriangle size={24} color="#F59E0B" />,
    },
    info: {
      accentColor: '#3B82F6',
      bgGlow: 'rgba(59, 130, 246, 0.15)',
      borderColor: 'rgba(59, 130, 246, 0.3)',
      icon: <Info size={24} color="#3B82F6" />,
    },
  };

  const current = typeConfig[type] || typeConfig.danger;

  return (
    <div
      className="modal-overlay"
      style={{
        zIndex: 999999,
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: '440px',
          width: '100%',
          backgroundColor: '#111827',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9)',
          overflow: 'hidden',
          animation: 'modalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
          zIndex: 1000000,
        }}
      >
        <div style={{ padding: '24px 24px 16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: current.bgGlow,
                border: `1px solid ${current.borderColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {current.icon}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#FFFFFF', marginBottom: '8px', lineHeight: '1.3' }}>
                {title}
              </h3>
              <div style={{ fontSize: '13.5px', color: '#94A3B8', lineHeight: '1.5' }}>
                {message}
              </div>
            </div>

            <button
              onClick={onClose}
              type="button"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748B',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div
          style={{
            padding: '16px 24px 20px 24px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn btn-secondary"
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '600',
              borderRadius: '8px',
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: '700',
              borderRadius: '8px',
              backgroundColor: current.accentColor,
              color: '#FFFFFF',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: `0 4px 14px ${current.bgGlow}`,
              transition: 'opacity 0.2s ease',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
