import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Zap } from 'lucide-react';
import useAppStore from '../../store/useAppStore.js';

export default function Navbar({ title, showBack = false, showSettings = true }) {
  const navigate = useNavigate();
  const user     = useAppStore(s => s.user);

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 'var(--z-top)',
      background: 'rgba(14,14,16,0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--glass-border)',
      height: 'var(--nav-h)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 var(--margin-mobile)',
    }}>
      {/* Left */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
        {showBack ? (
          <button
            onClick={() => navigate(-1)}
            className="btn btn-ghost btn-icon"
            aria-label="Go back"
            style={{ padding: '8px', color: 'var(--on-surface-muted)' }}
          >
            <ArrowLeft size={20} />
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
            <Zap size={20} color="var(--primary)" fill="var(--primary)" />
            <span style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '18px',
              color: 'var(--primary)',
              letterSpacing: '0.02em',
            }}>
              ScanAndSee
            </span>
          </div>
        )}
        {title && (
          <span className="text-title" style={{ color: 'var(--on-surface)' }}>
            {title}
          </span>
        )}
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
        {showSettings && (
          <button
            onClick={() => navigate('/profile')}
            className="btn btn-ghost btn-icon"
            aria-label="Settings"
            style={{ padding: '8px', color: 'var(--on-surface-muted)' }}
          >
            <Settings size={20} />
          </button>
        )}
        {user?.photoURL && (
          <img
            src={user.photoURL}
            alt={user.displayName || 'Profile'}
            style={{
              width: 32, height: 32,
              borderRadius: 'var(--r-full)',
              border: '1.5px solid var(--primary)',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/profile')}
          />
        )}
      </div>
    </header>
  );
}
