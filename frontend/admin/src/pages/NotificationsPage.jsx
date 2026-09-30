import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Send, 
  Check, 
  AlertCircle, 
  Radio, 
  CloudRain, 
  Scale, 
  Info, 
  Clock,
  Tag
} from 'lucide-react';
import api from '../api/client';
import { useToast } from '../contexts/ToastContext';

const NotificationsPage = () => {
  const { showSuccess, showError } = useToast();
  const [title, setTitle] = useState('');
  const [messageText, setMessageText] = useState('');
  const [category, setCategory] = useState('broadcast_by_admin');
  const [targetUserId, setTargetUserId] = useState('');
  const [sendMode, setSendMode] = useState('all'); // 'all' or 'user'
  const [sending, setSending] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [recentNotifications, setRecentNotifications] = useState([]);

  // Map category to notification type for backward compatibility
  const getCategoryType = (cat) => {
    if (cat === 'weather_updates') return 'weather_alert';
    if (cat === 'complaint_updates') return 'complaint_update';
    return 'broadcast';
  };

  const fetchRecent = async () => {
    try {
      const res = await api.get('/notifications?limit=15').catch(() => ({ data: { data: [] } }));
      setRecentNotifications(res.data?.data || []);
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

    const type = getCategoryType(category);

    try {
      if (sendMode === 'all') {
        await api.post('/notifications/broadcast', {
          title,
          message: messageText,
          type,
          category,
        });
        showSuccess('Advisory Broadcasted', `Dispatched under "${getCategoryLabel(category)}" to all active commuters.`);
        setAlertMessage({ type: 'success', text: `Broadcast sent successfully under "${getCategoryLabel(category)}" category!` });
      } else {
        await api.post('/notifications/send', {
          userId: targetUserId,
          title,
          message: messageText,
          type,
          category,
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

  const getCategoryLabel = (cat) => {
    switch (cat) {
      case 'weather_updates': return 'Weather Updates';
      case 'complaint_updates': return 'Complaint Updates';
      case 'broadcast_by_admin': return 'Broadcast by Admin';
      default: return 'Broadcast by Admin';
    }
  };

  const getCategoryBadgeStyle = (item) => {
    const cat = item.category || (item.type === 'weather_alert' ? 'weather_updates' : item.type === 'complaint_update' ? 'complaint_updates' : 'broadcast_by_admin');
    switch (cat) {
      case 'weather_updates':
        return { bg: 'rgba(2, 132, 199, 0.15)', border: 'rgba(2, 132, 199, 0.35)', color: '#38bdf8', label: 'Weather Updates' };
      case 'complaint_updates':
        return { bg: 'rgba(124, 58, 237, 0.15)', border: 'rgba(124, 58, 237, 0.35)', color: '#c084fc', label: 'Complaint Updates' };
      case 'broadcast_by_admin':
      default:
        return { bg: 'rgba(234, 88, 12, 0.15)', border: 'rgba(234, 88, 12, 0.35)', color: '#fb923c', label: 'Broadcast by Admin' };
    }
  };

  const handleTemplateSelect = (tmpl) => {
    setTitle(tmpl.title);
    setMessageText(tmpl.message);
    setCategory(tmpl.category);
  };

  const templates = [
    {
      label: 'Broadcast by Admin: General Advisory',
      title: 'SmartSakay Official Transit Advisory',
      message: 'Notice to all commuters: Expect normal PUJ and loop operations today across downtown Dagupan and intercity corridors.',
      category: 'broadcast_by_admin',
    },
    {
      label: 'Weather Updates: Heavy Rain / Flood Warning',
      title: 'Severe Weather / Heavy Rain Travel Advisory',
      message: 'Heavy localized rainfall and high tide expected across low-lying Dagupan corridors today. Commuters are advised to exercise caution and expect minor delays.',
      category: 'weather_updates',
    },
    {
      label: 'Complaint Updates: POSO Investigation Resolution',
      title: 'Dagupan POSO Grievance Resolution Notice',
      message: 'Action taken on reported transit grievance: Driver has been cited and referred to Dagupan POSO for administrative compliance.',
      category: 'complaint_updates',
    },
    {
      label: 'Broadcast by Admin: LTFRB Fare Adjustment',
      title: 'Official LTFRB Fare Adjustment Notice',
      message: 'Please be advised that updated jeepney fare tariffs are now in effect for all Dagupan City and Pangasinan routes.',
      category: 'broadcast_by_admin',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', color: '#ffffff', marginBottom: '4px' }}>In-App Broadcaster & Advisories</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Dispatch categorized notifications (Weather Updates, Complaint Updates, Broadcast by Admin) to all Dagupan commuters.
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
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Tag size={14} color="#EA580C" />
                  <span>Notification Category</span>
                </label>
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ fontWeight: '600' }}
                >
                  <option value="broadcast_by_admin">📢 Broadcast by Admin</option>
                  <option value="weather_updates">🌦️ Weather Updates</option>
                  <option value="complaint_updates">📋 Complaint Updates</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Notification Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Severe Weather / Heavy Rain Travel Advisory"
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
              style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Send size={16} />
              <span>{sending ? 'Transmitting Broadcast...' : `Transmit as ${getCategoryLabel(category)}`}</span>
            </button>
          </form>
        </div>

        {/* Quick Templates & Guidelines */}
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
                  <div style={{ fontSize: '12px', fontWeight: '700', color: tmpl.category === 'weather_updates' ? '#38bdf8' : tmpl.category === 'complaint_updates' ? '#c084fc' : '#fb923c' }}>
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
              <span style={{ fontWeight: '600', fontSize: '14px' }}>Categorized Notifications</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Commuters can filter announcements into <strong>Weather Updates</strong>, <strong>Complaint Updates</strong>, and <strong>Broadcast by Admin</strong> on their mobile app.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Dispatches Table */}
      {recentNotifications.length > 0 && (
        <div className="card" style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '16px', color: '#ffffff', marginBottom: '14px' }}>Recent Announcements</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 8px' }}>Category</th>
                  <th style={{ padding: '10px 8px' }}>Title</th>
                  <th style={{ padding: '10px 8px' }}>Message Preview</th>
                  <th style={{ padding: '10px 8px' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentNotifications.map((notif, idx) => {
                  const bStyle = getCategoryBadgeStyle(notif);
                  return (
                    <tr key={notif._id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '10px 8px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '700',
                          backgroundColor: bStyle.bg,
                          border: `1px solid ${bStyle.border}`,
                          color: bStyle.color,
                        }}>
                          {bStyle.label}
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px', fontWeight: '600', color: '#FFFFFF' }}>
                        {notif.title}
                      </td>
                      <td style={{ padding: '10px 8px', color: 'var(--text-muted)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {notif.message}
                      </td>
                      <td style={{ padding: '10px 8px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
