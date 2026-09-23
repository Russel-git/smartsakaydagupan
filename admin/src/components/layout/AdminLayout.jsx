import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calculator, 
  MapPin, 
  AlertTriangle, 
  Bell, 
  Users, 
  LogOut, 
  Bus,
  ShieldCheck,
  Navigation,
  Activity
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const PAGE_TITLES = {
  '/':              'Executive Overview',
  '/fares':         'Fare Management',
  '/routes':        'Route Directory',
  '/terminals':     'Terminal Hubs',
  '/complaints':    'Commuter Complaints',
  '/notifications': 'Broadcaster',
  '/users':         'User Directory',
  '/audit-logs':    'Security Audit Logs',
};

const NAV_GROUPS = [
  {
    label: 'Operations',
    items: [
      { to: '/',       label: 'Dashboard',     icon: LayoutDashboard, exact: true },
      { to: '/fares',  label: 'Fare Management',icon: Calculator },
      { to: '/routes', label: 'Route Directory', icon: MapPin },
      { to: '/terminals', label: 'Terminal Hubs', icon: Navigation },
    ],
  },
  {
    label: 'Community',
    items: [
      { to: '/complaints',     label: 'Commuter Complaints', icon: AlertTriangle },
      { to: '/notifications',  label: 'Broadcaster',          icon: Bell },
      { to: '/users',          label: 'User Directory',        icon: Users },
    ],
  },
  {
    label: 'Security',
    items: [
      { to: '/audit-logs', label: 'Audit Logs', icon: ShieldCheck },
    ],
  },
];

const AdminLayout = () => {
  const { admin, logout } = useAuth();
  const { showInfo } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    showInfo('Signed Out', 'You have been safely signed out of the Administrator Console.');
    navigate('/login');
  };

  const pageTitle = PAGE_TITLES[location.pathname] || 'SmartSakay Admin';

  return (
    <div className="app-container">
      {/* ── Sidebar ─────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-icon">
            <Bus size={22} />
          </div>
          <div>
            <div className="brand-title">SmartSakay</div>
            <span className="brand-subtitle">Dagupan Command</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="nav-section-label">{group.label}</div>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.exact}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  >
                    <div className="nav-icon">
                      <Icon size={17} />
                    </div>
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {admin?.firstName ? admin.firstName[0].toUpperCase() : 'A'}
            </div>
            <div className="user-meta">
              <div className="name">{admin?.firstName || 'System'} {admin?.lastName || 'Admin'}</div>
              <div className="role">Administrator</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="btn btn-ghost btn-icon"
            style={{ color: 'var(--text-400)' }}
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      {/* ── Main Content ────────────────────── */}
      <div className="main-wrapper">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={18} color="var(--primary-light)" />
            <span className="topbar-title">{pageTitle}</span>
          </div>
          <div className="topbar-right">
            <span className="topbar-badge">System Operational</span>
            <span style={{ fontSize: '12px', color: 'var(--text-600)' }}>
              Dagupan City PTA
            </span>
          </div>
        </header>

        <main className="content-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
