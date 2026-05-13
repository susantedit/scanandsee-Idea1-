import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Clock, GitCompare, User, ScanLine } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/home',    icon: Home,       label: 'Home' },
  { to: '/history', icon: Clock,      label: 'History' },
  { to: '/scan',    icon: ScanLine,   label: 'Scan',    isScan: true },
  { to: '/compare', icon: GitCompare, label: 'Compare' },
  { to: '/profile', icon: User,       label: 'Profile' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {NAV_ITEMS.map(({ to, icon: Icon, label, isScan }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            isScan
              ? 'bottom-nav-item bottom-nav-scan'
              : `bottom-nav-item${isActive ? ' active' : ''}`
          }
          aria-label={label}
        >
          <Icon size={isScan ? 24 : 22} strokeWidth={isScan ? 2.5 : 1.8} />
          {!isScan && <span className="bottom-nav-label">{label}</span>}
        </NavLink>
      ))}
    </nav>
  );
}
