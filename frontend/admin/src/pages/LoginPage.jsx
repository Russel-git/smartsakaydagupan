import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, Lock, Mail, AlertCircle, ArrowRight, MapPin, Users, Navigation } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      showSuccess(
        'Successfully Logged In',
        `Welcome back, ${user?.firstName || 'Administrator'}! SmartSakay command console active.`
      );
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to authenticate';
      setError(msg);
      showError('Authentication Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('admin@smartsakay.com');
    setPassword('Admin@12345');
  };

  return (
    <div className="login-screen">
      {/* Left Branding Panel */}
      <div className="login-left-panel">
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', color: 'white' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              background: 'rgba(255,255,255,0.18)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              border: '2px solid rgba(255,255,255,0.3)',
            }}
          >
            <Bus size={36} color="white" />
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px', color: 'white' }}>
            SmartSakay
          </h2>
          <p style={{ fontSize: '16px', opacity: 0.85, marginBottom: '40px', lineHeight: 1.6 }}>
            Dagupan City Public Transport<br />Management System
          </p>

          {/* Feature highlights */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
            {[
              { icon: MapPin, label: 'Live Route Management', desc: 'Monitor all jeepney routes in real-time' },
              { icon: Users, label: 'Commuter Services', desc: 'Manage registered commuter accounts' },
              { icon: Navigation, label: 'Terminal Oversight', desc: 'Control all terminal hubs citywide' },
            ].map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  background: 'rgba(255,255,255,0.1)',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} color="white" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '2px' }}>{label}</div>
                  <div style={{ fontSize: '12px', opacity: 0.7 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="login-right-panel">
        <div className="login-card">
          {/* Logo */}
          <div style={{ marginBottom: '32px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                background: 'var(--primary)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                boxShadow: 'var(--shadow-primary)',
              }}
            >
              <Bus size={24} color="white" />
            </div>
            <h1 style={{ fontSize: '24px', color: 'var(--text-main)', marginBottom: '6px' }}>
              Admin Sign In
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Access the Dagupan City transport console
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="alert alert-error">
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="form-input-wrapper">
                <Mail size={15} className="form-input-icon" />
                <input
                  type="email"
                  required
                  className="form-input"
                  placeholder="admin@smartsakay.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="form-input-wrapper">
                <Lock size={15} className="form-input-icon" />
                <input
                  type="password"
                  required
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '8px' }}
            >
              {loading ? (
                'Signing in...'
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: '20px' }}>
            <hr className="divider" />
            <button
              type="button"
              onClick={handleFillDemo}
              className="btn btn-secondary"
              style={{ width: '100%', fontSize: '13px' }}
            >
              ⚡ Autofill Default Admin Credentials
            </button>
          </div>

          <p style={{ marginTop: '20px', fontSize: '12px', color: 'var(--text-dim)', textAlign: 'center' }}>
            SmartSakay Admin Console · Dagupan City, Philippines
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
