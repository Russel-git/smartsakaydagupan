import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  MapPin, 
  Calculator, 
  AlertTriangle, 
  Bell, 
  Activity,
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  TrendingUp
} from 'lucide-react';
import api from '../api/client';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, actRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/activity').catch(() => ({ data: { data: {} } })),
        ]);
        setStats(statsRes.data?.data || null);

        const raw = actRes.data?.data;
        let items = [];
        if (Array.isArray(raw)) {
          items = raw;
        } else if (raw && typeof raw === 'object') {
          const users = Array.isArray(raw.recentUsers) ? raw.recentUsers : [];
          const complaints = Array.isArray(raw.recentComplaints) ? raw.recentComplaints : [];
          users.forEach((u) => items.push({
            action: 'New Commuter Registered',
            details: `${u.firstName || 'User'} ${u.lastName || ''} (${u.email || 'N/A'})`,
            timestamp: u.createdAt || new Date(),
            type: 'user',
          }));
          complaints.forEach((c) => {
            const reporter = c.userId ? `${c.userId.firstName || ''} ${c.userId.lastName || ''}`.trim() : 'Anonymous';
            items.push({
              action: `Grievance: ${c.category ? c.category.replace('_', ' ').toUpperCase() : 'General'}`,
              details: `${c.subject || 'Complaint filed'} [${c.status || 'pending'}] — ${reporter || 'Commuter'}`,
              timestamp: c.createdAt || new Date(),
              type: 'complaint',
            });
          });
          items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
        setActivity(items);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
        <div style={{ color: 'var(--text-400)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={18} style={{ animation: 'pulse-dot 1.5s ease infinite' }} />
          Loading analytics...
        </div>
      </div>
    );
  }

  const STAT_CARDS = [
    {
      label: 'Registered Commuters',
      value: stats?.users?.total ?? 0,
      sub: `${stats?.users?.verified ?? 0} verified accounts`,
      icon: Users,
      color: 'var(--primary)',
    },
    {
      label: 'Jeepney Routes',
      value: stats?.routes?.total ?? 0,
      sub: `${stats?.routes?.active ?? 0} active routes`,
      icon: MapPin,
      color: 'var(--info)',
    },
    {
      label: 'Pending Complaints',
      value: stats?.complaints?.pending ?? 0,
      sub: `${stats?.complaints?.under_review ?? 0} under review`,
      icon: AlertTriangle,
      color: 'var(--warning)',
    },
    {
      label: 'Resolved Reports',
      value: stats?.complaints?.resolved ?? 0,
      sub: `${stats?.complaints?.total ?? 0} total submitted`,
      icon: CheckCircle2,
      color: 'var(--success)',
    },
  ];

  const QUICK_ACTIONS = [
    { to: '/fares',         label: 'Manage LTFRB Fares',   icon: Calculator,    color: 'var(--primary-light)' },
    { to: '/complaints',    label: 'Triage Complaints',     icon: AlertTriangle, color: 'var(--warning)' },
    { to: '/routes',        label: 'Route Matrix',          icon: MapPin,        color: 'var(--success)' },
    { to: '/notifications', label: 'Broadcast Advisory',    icon: Bell,          color: 'var(--info)' },
    { to: '/users',         label: 'User Directory',        icon: Users,         color: '#a78bfa' },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Executive Overview</h1>
          <p>Real-time public transit telemetry and commuter intelligence for Dagupan City.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/notifications" className="btn btn-primary btn-sm">
            <Bell size={14} />
            Send Alert
          </Link>
          <Link to="/fares" className="btn btn-secondary btn-sm">
            <Calculator size={14} />
            Update Fares
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stat-grid">
        {STAT_CARDS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="stat-card" style={{ '--stat-color': s.color }}>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-sub">{s.sub}</div>
              </div>
              <div className="stat-icon">
                <Icon size={22} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>

        {/* Activity Feed */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Activity size={18} color="var(--primary-light)" />
              Live Activity Log
            </div>
            <span className="card-meta">Auto-refreshed</span>
          </div>

          {activity.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-400)' }}>
              No recent activity recorded.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {activity.slice(0, 10).map((act, i) => (
                <div key={i} className="activity-item">
                  <div
                    className="activity-dot"
                    style={{ background: act.type === 'user' ? 'var(--primary)' : 'var(--warning)' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-100)' }}>
                      {act.action}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-400)', marginTop: '2px' }}>
                      {act.details}
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-600)', flexShrink: 0 }}>
                    {new Date(act.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <TrendingUp size={16} color="var(--accent)" />
                Quick Actions
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {QUICK_ACTIONS.map((qa) => {
                const Icon = qa.icon;
                return (
                  <Link key={qa.to} to={qa.to} className="quick-action-link">
                    <div className="icon">
                      <Icon size={15} color={qa.color} />
                      <span>{qa.label}</span>
                    </div>
                    <ArrowUpRight size={14} color="var(--text-600)" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* LTFRB Notice */}
          <div
            className="card"
            style={{
              background: 'linear-gradient(135deg, rgba(225, 29, 72, 0.08), rgba(245, 158, 11, 0.06))',
              borderColor: 'rgba(225, 29, 72, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{
                width: '28px', height: '28px',
                background: 'linear-gradient(135deg, var(--primary), #be123c)',
                borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CheckCircle2 size={14} color="white" />
              </div>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-100)' }}>
                LTFRB Regulation Notice
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-400)', lineHeight: '1.65' }}>
              Under LTFRB Memorandum Circulars, all PUV operators must honor the{' '}
              <strong style={{ color: 'var(--text-200)' }}>20% statutory discount</strong> for
              Students, PWDs, and Seniors across all Dagupan City transit lines upon presentation of valid ID.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
