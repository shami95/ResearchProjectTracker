import React, { useState } from 'react';
import Offcanvas from 'react-bootstrap/Offcanvas';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/projects', label: 'Projects' },
  { to: '/milestones', label: 'Milestones' },
  { to: '/documents', label: 'Documents' },
];

const SunIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="5" />
    <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 1.5v3M12 19.5v3M22.5 12h-3M4.5 12h-3M19.07 4.93l-2.12 2.12M7.05 16.95l-2.12 2.12M19.07 19.07l-2.12-2.12M7.05 7.05 4.93 4.93" />
    </g>
  </svg>
);

const MoonStarIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.2 14.6A8.5 8.5 0 1 1 9.4 3.8a7 7 0 0 0 10.8 10.8z" />
    <path d="M19.5 2.5l0.7 1.6 1.6 0.7-1.6 0.7-0.7 1.6-0.7-1.6-1.6-0.7 1.6-0.7z" />
  </svg>
);

interface SidebarBodyProps {
  onNavigate?: () => void;
}

const SidebarBody: React.FC<SidebarBodyProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    onNavigate?.();
    logout();
    navigate('/login');
  };

  const initials = (user?.fullName || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <div className="sidebar-inner">
      <div className="sidebar-brand">Research Tracker</div>

      <div className="sidebar-user-card">
        <div className="sidebar-user-avatar">{initials}</div>
        <div className="sidebar-user-meta">
          <div className="sidebar-user-name">{user?.fullName}</div>
          <span className="role-badge">{user?.role}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            onClick={onNavigate}
          >
            {item.label}
          </NavLink>
        ))}
        {user?.role === 'ADMIN' && (
          <NavLink
            to="/admin"
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            onClick={onNavigate}
          >
            Admin
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer-block">
        <div className="theme-switch-row">
          <span className="theme-switch-label">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
          <button
            type="button"
            className={`theme-switch ${theme === 'dark' ? 'is-dark' : 'is-light'}`}
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            aria-pressed={theme === 'dark'}
          >
            <span className="theme-switch-icon">
              {theme === 'dark' ? <MoonStarIcon /> : <SunIcon />}
            </span>
            <span className="theme-switch-knob" />
          </button>
        </div>

        <button type="button" className="sidebar-logout-btn" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </div>
  );
};

const Sidebar: React.FC = () => {
  const [showDrawer, setShowDrawer] = useState(false);

  return (
    <>
      <aside className="sidebar d-none d-lg-flex">
        <SidebarBody />
      </aside>

      <div className="mobile-topbar d-flex d-lg-none">
        <button
          type="button"
          className="mobile-topbar-toggle"
          aria-label="Open navigation"
          onClick={() => setShowDrawer(true)}
        >
          <span />
          <span />
          <span />
        </button>
        <div className="mobile-topbar-brand">Research Tracker</div>
      </div>

      <Offcanvas show={showDrawer} onHide={() => setShowDrawer(false)} className="sidebar-offcanvas">
        <Offcanvas.Header closeButton closeVariant="white">
          <Offcanvas.Title>Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="pt-0">
          <SidebarBody onNavigate={() => setShowDrawer(false)} />
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default Sidebar;
