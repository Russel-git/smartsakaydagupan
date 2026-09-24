import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  MapPin,
  Calculator,
  AlertTriangle,
  Bell,
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileText
} from 'lucide-react';
import api from '../api/client';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, actRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/activity').catch(() => ({ data: { data: {} } })),
        ]);
        setStats(statsRes.data?.data || null);

        const rawActivity = actRes.data?.data;
        let formattedActivity = [];
        if (Array.isArray(rawActivity)) {
          formattedActivity = rawActivity;
        } else if (rawActivity && typeof rawActivity === 'object') {
          const users = Array.isArray(rawActivity.recentUsers) ? rawActivity.recentUsers : [];
          const complaints = Array.isArray(rawActivity.recentComplaints) ? rawActivity.recentComplaints : [];

          users.forEach((u) => {
            formattedActivity.push({
              action: 'New Commuter Registered',
              details: `${u.firstName || 'User'} ${u.lastName || ''} (${u.email || 'N/A'})`,
              timestamp: u.createdAt || new Date(),
              type: 'user',
            });
          });

          complaints.forEach((c) => {
            const reporter = c.userId ? `${c.userId.firstName || ''} ${c.userId.lastName || ''}`.trim() : 'Anonymous';
            formattedActivity.push({
              action: `Grievance: ${c.category ? c.category.toUpperCase() : 'General'}`,
              details: `${c.subject || 'Complaint filed'} [${c.status || 'pending'}] by ${reporter || 'Commuter'}`,
              timestamp: c.createdAt || new Date(),
              type: 'complaint',
            });
          });

          formattedActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }

        setActivity(formattedActivity);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setActivity([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div className="page-header-left">
            <div className="skeleton" style={{ width: '200px', height: '28px', marginBottom: '8px' }} />
            <div className="skeleton" style={{ width: '300px', height: '16px' }} />
          </div>
        </div>
        <div className="stat-grid">
          {[1,2,3,4].map(i => (
            <div key={i} className="card" style={{ height: '100px' }}>
              <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-md)' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Registered Commuters',
      value: stats?.users?.total || 0,
      trend: `${stats?.users?.verified || 0} verified`,
      icon: Users,
      color: 'var(--primary)',
      bg: 'var(--primary-light)',
      trendClass: 'positive',
    },
    {
      label: 'Jeepney Routes',
      value: stats?.routes?.total || 0,
      trend: `${stats?.routes?.active || 0} active routes`,
      icon: MapPin,
      color: 'var(--info)',
      bg: 'var(--info-light)',
      trendClass: 'positive',
    },
    {
      label: 'Pending Complaints',
      value: stats?.complaints?.pending || 0,
      trend: `${stats?.complaints?.under_review || 0} under review`,
      icon: AlertTriangle,
      color: 'var(--warning)',
      bg: 'var(--warning-light)',
      trendClass: 'warning',
    },
    {
      label: 'Resolved Reports',
      value: stats?.complaints?.resolved || 0,
      trend: `${stats?.complaints?.total || 0} total submitted`,
      icon: CheckCircle2,
      color: 'var(--accent)',
      bg: 'var(--accent-light)',
      trendClass: 'positive',
    },
  ];

  const quickActions = [
    {
      to: '/fares',
      label: 'Manage LTFRB Fares',
      desc: 'Update fare matrix & discounts',
      icon: Calculator,
      color: 'var(--primary)',
    },
    {
      to: '/complaints',
      label: 'Triage Complaints',
      desc: 'Review pending commuter reports',
      icon: AlertTriangle,
      color: 'var(--warning)',
    },
    {
      to: '/routes',
      label: 'Jeepney Route Matrix',
      desc: 'View and manage active routes',
      icon: MapPin,
      color: 'var(--info)',
    },
    {
      to: '/notifications',
      label: 'Broadcast Advisory',
      desc: 'Send alerts to commuters',
      icon: Bell,
      color: 'var(--danger)',
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Executive Overview</h1>
          <p>Real-time public transit telemetry and commuter feedback for Dagupan City.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/notifications" className="btn btn-primary btn-sm">
            <Bell size={14} />
            <span>Send Alert</span>
          </Link>
          <Link to="/fares" className="btn btn-secondary btn-sm">
            <Calculator size={14} />
            <span>Update Rates</span>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stat-grid">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="stat-card">
              <div className="stat-card-left">
                <div className="stat-label">{card.label}</div>
                <div className="stat-value">{card.value}</div>
                <div className={`stat-trend ${card.trendClass}`}>{card.trend}</div>
              </div>
              <div
                className="stat-icon"
                style={{ '--stat-color': card.color, '--stat-bg': card.bg, background: card.bg, color: card.color }}
              >
                <Icon size={22} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Grid: Activity + Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>

        {/* Live Activity */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={16} color="var(--primary)" />
                Live Activity Log
              </div>
              <div className="card-subtitle">Recent events across the platform</div>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 500 }}>Auto-refreshed</span>
          </div>

          {(!Array.isArray(activity) || activity.length === 0) ? (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <div className="empty-state-icon">
                <FileText size={28} />
              </div>
              <h3>No recent activity</h3>
              <p>Administrative actions will appear here once they occur.</p>
            </div>
          ) : (
            <div>
              {Array.isArray(activity) && activity.map((act, i) => (
                <div key={i} className="activity-item">
                  <div
                    className="activity-dot"
                    style={{ background: act.type === 'complaint' ? 'var(--warning)' : 'var(--primary)' }}
                  />
                  <div className="activity-content">
                    <div className="activity-action">{act.action}</div>
                    <div className="activity-details">{act.details}</div>
                  </div>
                  <div className="activity-time">
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
            <div className="card-header" style={{ marginBottom: '12px' }}>
              <div className="card-title">Quick Actions</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.to} to={action.to} style={{ textDecoration: 'none' }}>
                    <div className="quick-action">
                      <div className="quick-action-icon">
                        <Icon size={16} color={action.color} />
                      </div>
                      <div className="quick-action-text">
                        <strong>{action.label}</strong>
                        <span>{action.desc}</span>
                      </div>
                      <ArrowRight size={14} color="var(--text-dim)" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* LTFRB Notice */}
          <div
            className="card"
            style={{
              background: 'linear-gradient(135deg, #fff7ed, #ffedd5)',
              borderColor: '#fed7aa',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <TrendingUp size={16} color="white" />
              </div>
              <div>
                <h4 style={{ fontSize: '13px', color: 'var(--primary-dark)', fontWeight: 700, marginBottom: '5px' }}>
                  LTFRB Regulation Notice
                </h4>
                <p style={{ fontSize: '12px', color: '#7c3700', lineHeight: '1.6' }}>
                  PUV operators must honor the 20% discount for Students, PWDs, and Seniors across all Dagupan City transit lines under LTFRB Memorandum Circulars.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
