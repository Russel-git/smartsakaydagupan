import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
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
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div className="brand-icon" style={{ margin: '0 auto 16px', width: '56px', height: '56px' }}>
            <Bus size={32} />
          </div>
          <h1 style={{ fontSize: '24px', color: '#ffffff', marginBottom: '6px' }}>SmartSakay Admin</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Sign in to manage Dagupan City transport networks
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#fca5a5',
            fontSize: '13px',
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Admin Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-dim)' }} />
              <input
                type="email"
                required
                className="form-input"
                style={{ paddingLeft: '40px' }}
                placeholder="admin@smartsakay.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-dim)' }} />
              <input
                type="password"
                required
                className="form-input"
                style={{ paddingLeft: '40px' }}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '10px' }}
          >
            {loading ? 'Authenticating...' : (
              <>
                <span>Access Command Dashboard</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <button
            type="button"
            onClick={handleFillDemo}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '12px', width: '100%' }}
          >
            ⚡ Autofill Default Admin Credentials
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
