import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
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
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const AdminLayout = () => {
  const { admin, logout } = useAuth();
  const { showInfo } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    showInfo('Signed Out', 'You have been safely signed out of the Administrator Console.');
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/fares', label: 'Fare Management', icon: Calculator },
    { to: '/routes', label: 'Route Directory', icon: MapPin },
    { to: '/terminals', label: 'Terminal Hubs', icon: Navigation },
    { to: '/complaints', label: 'Complaints', icon: AlertTriangle },
    { to: '/notifications', label: 'Broadcaster', icon: Bell },
    { to: '/users', label: 'User Directory', icon: Users },
    { to: '/audit-logs', label: 'Audit Logs', icon: ShieldCheck },
  ];

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-icon">
            <Bus size={22} />
          </div>
          <div>
            <div className="brand-title">SmartSakay</div>
            <div className="brand-subtitle">Dagupan City</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Main Menu</div>
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          <div className="sidebar-section-label">Management</div>
          {navItems.slice(4).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
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
            style={{ color: 'var(--text-muted)' }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Dagupan City</span>
            <ChevronRight size={14} color="var(--text-dim)" />
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>
              Transport Management Console
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="badge badge-success">
              <span style={{ fontSize: '7px' }}>●</span>
              System Online
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
