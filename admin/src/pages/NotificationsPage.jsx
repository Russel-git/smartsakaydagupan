import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Send, 
  Check, 
  AlertCircle, 
  Radio, 
  CloudRain, 
  Calculator, 
  Info, 
  Clock 
} from 'lucide-react';
import api from '../api/client';
import { useToast } from '../contexts/ToastContext';

const NotificationsPage = () => {
  const { showSuccess, showError } = useToast();
  const [title, setTitle] = useState('');
  const [messageText, setMessageText] = useState('');
  const [type, setType] = useState('broadcast');
  const [targetUserId, setTargetUserId] = useState('');
  const [sendMode, setSendMode] = useState('all'); // 'all' or 'user'
  const [sending, setSending] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [recentNotifications, setRecentNotifications] = useState([]);

  const fetchRecent = async () => {
    try {
      const res = await api.get('/notifications').catch(() => ({ data: { data: [] } }));
      setRecentNotifications(res.data.data || []);
    } catch (e) {
      // Ignore
    }
  };

  useEffect(() => {
    fetchRecent();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    setAlertMessage(null);

    try {
      if (sendMode === 'all') {
        await api.post('/notifications/broadcast', {
          title,
          message: messageText,
          type,
        });
        showSuccess('Advisory Broadcasted', 'Transit alert dispatched to all active commuter devices.');
        setAlertMessage({ type: 'success', text: 'Broadcast sent to all active commuters!' });
      } else {
        await api.post('/notifications/send', {
          userId: targetUserId,
          title,
          message: messageText,
          type,
        });
        showSuccess('Notification Delivered', 'Direct message sent to target commuter.');
        setAlertMessage({ type: 'success', text: 'Direct notification sent successfully!' });
      }

      setTitle('');
      setMessageText('');
      setTargetUserId('');
      fetchRecent();
    } catch (err) {
      const errText = err.response?.data?.message || 'Failed to dispatch notification.';
      showError('Dispatch Failed', errText);
      setAlertMessage({ 
        type: 'error', 
        text: errText 
      });
    } finally {
      setSending(false);
    }
  };

  const handleTemplateSelect = (tmpl) => {
    setTitle(tmpl.title);
    setMessageText(tmpl.message);
    setType(tmpl.type);
  };

  const templates = [
    {
      label: 'LTFRB Jeepney Fare Advisory',
      title: 'Official LTFRB Fare Adjustment Notice',
      message: 'Please be advised that updated jeepney fare tariffs are now in effect for all Dagupan City and Pangasinan routes.',
      type: 'fare_update',
    },
    {
      label: 'Tricycle Tariff Notice',
      title: 'Official Dagupan City Tricycle Fare Notice',
      message: 'Official Dagupan City TFRB and LTFRB tricycle tariff rates are ₱15.00 base (first 1.0 km) + ₱3.00/km, with mandatory 20% discount for Students, PWDs, and Senior Citizens.',
      type: 'fare_update',
    },
    {
      label: 'Tropical Weather Alert',
      title: 'Severe Weather / Heavy Rain Travel Advisory',
      message: 'Heavy localized rainfall expected across Dagupan City today. Commuters are advised to exercise caution and expect minor delays.',
      type: 'weather_alert',
    },
    {
      label: 'System Maintenance',
      title: 'SmartSakay System Update Notice',
      message: 'Scheduled optimization of route tracking will occur tonight between 12:00 AM and 02:00 AM.',
      type: 'system',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', color: '#ffffff', marginBottom: '4px' }}>In-App Broadcaster & Advisories</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Dispatch urgent transit updates, tariff announcements, and weather bulletins to all Dagupan commuters.
        </p>
      </div>

      {alertMessage && (
        <div style={{
          background: alertMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${alertMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '12px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: alertMessage.type === 'success' ? '#34d399' : '#f87171',
          fontSize: '13px',
        }}>
          {alertMessage.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          <span>{alertMessage.text}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px' }}>
        {/* Broadcast Composer */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Radio size={20} color="var(--primary-light)" />
            <h3 style={{ fontSize: '17px', color: '#ffffff' }}>Compose Announcement</h3>
          </div>

          <form onSubmit={handleSend}>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'white' }}>
                <input
                  type="radio"
                  name="sendMode"
                  checked={sendMode === 'all'}
                  onChange={() => setSendMode('all')}
                />
                <span>Broadcast to All Commuters</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'white' }}>
                <input
                  type="radio"
                  name="sendMode"
                  checked={sendMode === 'user'}
                  onChange={() => setSendMode('user')}
                />
                <span>Target Specific Commuter ID</span>
              </label>
            </div>

            {sendMode === 'user' && (
              <div className="form-group">
                <label className="form-label">Recipient User ID</label>
                <input
                  type="text"
                  required
                  placeholder="Paste MongoDB User ID e.g. 660f..."
                  className="form-input"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Alert Category</label>
                <select
                  className="form-select"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="broadcast">General Broadcast</option>
                  <option value="fare_update">Fare Tariff Update</option>
                  <option value="weather_alert">Weather Advisory</option>
                  <option value="system">System Notice</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Notification Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weather Alert: Heavy Rain in Dagupan"
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notification Body</label>
              <textarea
                rows={5}
                required
                placeholder="Type your official announcement here..."
                className="form-textarea"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px' }}
            >
              <Send size={16} />
              <span>{sending ? 'Transmitting Broadcast...' : 'Transmit Notification Now'}</span>
            </button>
          </form>
        </div>

        {/* Quick Templates & Dispatch Guidelines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <h3 style={{ fontSize: '16px', color: '#ffffff', marginBottom: '14px' }}>Pre-approved Templates</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {templates.map((tmpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleTemplateSelect(tmpl)}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary-light)' }}>
                    {tmpl.label}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
                    {tmpl.title}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="card" style={{ background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--info)', marginBottom: '8px' }}>
              <Info size={18} />
              <span style={{ fontWeight: '600', fontSize: '14px' }}>Commuter Alert Policy</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Broadcast messages are immediately delivered to all active mobile commuters upon opening the SmartSakay application.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
