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
  ChevronRight,
  Shield,
  Building2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const AdminLayout = () => {
  const { admin, logout, isSuperAdmin, isOperator, isLgu } = useAuth();
  const { showInfo } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    showInfo('Signed Out', 'You have been safely signed out of the Administrator Console.');
    navigate('/login');
  };

  // Dynamic Navigation Items based on active role
  const getNavSections = () => {
    if (isLgu) {
      return [
        {
          title: 'Authority Overview',
          items: [
            { to: '/', label: 'Overview Dashboard', icon: LayoutDashboard, exact: true },
          ],
        },
        {
          title: 'Enforcement & Action',
          items: [
            { to: '/complaints', label: 'LGU Action Desk', icon: AlertTriangle },
          ],
        },
      ];
    }

    if (isOperator) {
      return [
        {
          title: 'Transit Operations',
          items: [
            { to: '/', label: 'Operations Dashboard', icon: LayoutDashboard, exact: true },
            { to: '/fares', label: 'Fare Matrix Management', icon: Calculator },
            { to: '/routes', label: 'Jeepney & Tricycle Routes', icon: MapPin },
            { to: '/terminals', label: 'Terminal Hubs', icon: Navigation },
          ],
        },
        {
          title: 'Citizen Grievances',
          items: [
            { to: '/complaints', label: 'Complaints Triage', icon: AlertTriangle },
            { to: '/notifications', label: 'City Broadcaster', icon: Bell },
          ],
        },
      ];
    }

    // Default: Superadmin (Developer)
    return [
      {
        title: 'System & Transit Core',
        items: [
          { to: '/', label: 'Master Dashboard', icon: LayoutDashboard, exact: true },
          { to: '/fares', label: 'Fare Management', icon: Calculator },
          { to: '/routes', label: 'Route Directory', icon: MapPin },
          { to: '/terminals', label: 'Terminal Hubs', icon: Navigation },
        ],
      },
      {
        title: 'Complaints & Advisories',
        items: [
          { to: '/complaints', label: 'Complaints Hub', icon: AlertTriangle },
          { to: '/notifications', label: 'Broadcaster', icon: Bell },
        ],
      },
      {
        title: 'Developer Control',
        items: [
          { to: '/users', label: 'Account Management', icon: Users },
          { to: '/audit-logs', label: 'Security Audit Logs', icon: ShieldCheck },
        ],
      },
    ];
  };

  const navSections = getNavSections();

  const getRoleBadge = () => {
    if (isSuperAdmin) {
      return { text: 'Superadmin (Developer)', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' };
    }
    if (isLgu) {
      return { text: 'LGU Authority (POSO)', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
    }
    return { text: 'Transit Operator (Admin)', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)' };
  };

  const roleInfo = getRoleBadge();

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
          {navSections.map((section, sIdx) => (
            <div key={sIdx}>
              <div className="sidebar-section-label">{section.title}</div>
              {section.items.map((item) => {
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
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div
              className="user-avatar"
              style={{
                backgroundColor: roleInfo.bg,
                color: roleInfo.color,
                border: `1px solid ${roleInfo.color}40`,
              }}
            >
              {admin?.firstName ? admin.firstName[0].toUpperCase() : 'U'}
            </div>
            <div className="user-meta">
              <div className="name">
                {admin?.firstName || 'System'} {admin?.lastName || ''}
              </div>
              <div
                className="role"
                style={{
                  color: roleInfo.color,
                  fontSize: '11px',
                  fontWeight: '600',
                }}
              >
                {roleInfo.text}
              </div>
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
              {isLgu ? 'LGU Transit Action Console' : isOperator ? 'Transit Operations Console' : 'Master Developer Console'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              className="badge"
              style={{
                backgroundColor: roleInfo.bg,
                color: roleInfo.color,
                border: `1px solid ${roleInfo.color}30`,
                fontSize: '12px',
                padding: '4px 10px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span style={{ fontSize: '8px' }}>●</span>
              {roleInfo.text}
            </span>
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
