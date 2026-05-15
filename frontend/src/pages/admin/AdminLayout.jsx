import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Users,
  Shield,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAdminStore } from '../../store/useAdminStore';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const location = useLocation();
  const { adminUser, logout } = useAdminStore();

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: BarChart3 },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/moderation', label: 'Moderation', icon: Shield },
    { path: '/admin/content', label: 'Content', icon: Settings },
    { path: '/admin/billing', label: 'Billing', icon: Settings },
    { path: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h1 className="sidebar-title">ScanAndSee Admin</h1>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="admin-info">
            <div className="admin-avatar">
              {adminUser?.email?.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="admin-details">
                <p className="admin-name">{adminUser?.email}</p>
                <p className="admin-role">Admin</p>
              </div>
            )}
          </div>
          <button className="logout-btn" onClick={logout}>
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
