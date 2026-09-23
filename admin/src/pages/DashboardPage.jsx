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
  AlertCircle 
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
            });
          });

          complaints.forEach((c) => {
            const reporter = c.userId ? `${c.userId.firstName || ''} ${c.userId.lastName || ''}`.trim() : 'Anonymous';
            formattedActivity.push({
              action: `Grievance: ${c.category ? c.category.toUpperCase() : 'General'}`,
              details: `${c.subject || 'Complaint filed'} [${c.status || 'pending'}] by ${reporter || 'Commuter'}`,
              timestamp: c.createdAt || new Date(),
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Loading Command Center analytics...</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '26px', color: '#ffffff', marginBottom: '4px' }}>Executive Overview</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Real-time public transit telemetry and commuter feedback for Dagupan City.
          </p>
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
        <div className="stat-card" style={{ '--stat-color': 'var(--primary)' }}>
          <div>
            <div className="stat-label">Registered Commuters</div>
            <div className="stat-value">{stats?.users?.total || 0}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
              {stats?.users?.verified || 0} verified accounts
            </div>
          </div>
          <div className="stat-icon">
            <Users size={24} />
          </div>
        </div>

        <div className="stat-card" style={{ '--stat-color': 'var(--info)' }}>
          <div>
            <div className="stat-label">Jeepney Routes</div>
            <div className="stat-value">{stats?.routes?.total || 0}</div>
            <div style={{ fontSize: '12px', color: 'var(--accent-light)', marginTop: '4px' }}>
              {stats?.routes?.active || 0} active routes
            </div>
          </div>
          <div className="stat-icon">
            <MapPin size={24} />
          </div>
        </div>

        <div className="stat-card" style={{ '--stat-color': 'var(--warning)' }}>
          <div>
            <div className="stat-label">Pending Complaints</div>
            <div className="stat-value">{stats?.complaints?.pending || 0}</div>
            <div style={{ fontSize: '12px', color: 'var(--warning-light)', marginTop: '4px' }}>
              {stats?.complaints?.under_review || 0} under review
            </div>
          </div>
          <div className="stat-icon">
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="stat-card" style={{ '--stat-color': 'var(--accent)' }}>
          <div>
            <div className="stat-label">Resolved Reports</div>
            <div className="stat-value">{stats?.complaints?.resolved || 0}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
              Total {stats?.complaints?.total || 0} submitted
            </div>
          </div>
          <div className="stat-icon">
            <CheckCircle2 size={24} />
          </div>
        </div>
      </div>

      {/* Main Sections: Recent Activity & Quick Navigation */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Recent Activity */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Activity size={20} color="var(--primary-light)" />
              <h3 style={{ fontSize: '17px', color: '#ffffff' }}>Live Activity Log</h3>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Auto-refreshed</span>
          </div>

          {(!Array.isArray(activity) || activity.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              No recent administrative actions recorded.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Array.isArray(activity) && activity.map((act, i) => (
                <div 
                  key={i} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '14px', 
                    padding: '12px', 
                    borderRadius: 'var(--radius-md)', 
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div style={{ marginTop: '2px', color: 'var(--primary-light)' }}>
                    <Clock size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>{act.action}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{act.details}</div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                    {new Date(act.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Management Shortcuts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <h3 style={{ fontSize: '16px', color: '#ffffff', marginBottom: '14px' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link 
                to="/fares" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '12px', 
                  borderRadius: 'var(--radius-md)', 
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)',
                  color: 'white'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Calculator size={16} color="var(--primary-light)" />
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>Manage LTFRB Fares</span>
                </div>
                <ArrowUpRight size={16} color="var(--text-dim)" />
              </Link>

              <Link 
                to="/complaints" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '12px', 
                  borderRadius: 'var(--radius-md)', 
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)',
                  color: 'white'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertTriangle size={16} color="var(--warning-light)" />
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>Triage Complaints</span>
                </div>
                <ArrowUpRight size={16} color="var(--text-dim)" />
              </Link>

              <Link 
                to="/routes" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '12px', 
                  borderRadius: 'var(--radius-md)', 
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)',
                  color: 'white'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <MapPin size={16} color="var(--accent-light)" />
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>Jeepney Route Matrix</span>
                </div>
                <ArrowUpRight size={16} color="var(--text-dim)" />
              </Link>

              <Link 
                to="/notifications" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '12px', 
                  borderRadius: 'var(--radius-md)', 
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)',
                  color: 'white'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Bell size={16} color="var(--info)" />
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>Broadcast Advisory</span>
                </div>
                <ArrowUpRight size={16} color="var(--text-dim)" />
              </Link>
            </div>
          </div>

          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(16, 185, 129, 0.05))' }}>
            <h4 style={{ fontSize: '14px', color: '#ffffff', marginBottom: '8px' }}>LTFRB Regulation Notice</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Under LTFRB Memorandum Circulars, PUV operators must honor the 20% discount for Students, PWDs, and Seniors across all Dagupan City transit lines.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
