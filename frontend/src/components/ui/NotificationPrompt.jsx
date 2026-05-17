/**
 * Non-intrusive notification permission prompt.
 * Shows after first scan — the right moment to ask.
 */
import React, { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { requestPermission, scheduleDailyReminder } from '../../services/notifications.js';

export default function NotificationPrompt({ onDismiss }) {
  const [loading, setLoading] = useState(false);

  const handleEnable = async () => {
    setLoading(true);
    const result = await requestPermission();
    if (result === 'granted') {
      scheduleDailyReminder(12); // noon reminder
    }
    setLoading(false);
    onDismiss?.();
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-3)',
      padding: 'var(--sp-4)',
      background: 'var(--secondary-bg)',
      border: '1px solid rgba(0,219,233,0.3)',
      borderRadius: 'var(--r-lg)',
    }}>
      <Bell size={18} color="var(--secondary)" style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <p className="text-body-sm" style={{ color: 'var(--on-surface)', fontWeight: 600, marginBottom: 4 }}>
          Get daily health reminders
        </p>
        <p className="text-label" style={{ color: 'var(--on-surface-muted)', fontSize: 10, marginBottom: 'var(--sp-3)' }}>
          We'll remind you to scan before eating — the best habit for healthy decisions.
        </p>
        <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          <button
            onClick={handleEnable}
            disabled={loading}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
              letterSpacing: '0.08em', padding: '6px 14px',
              background: 'var(--secondary)', color: 'var(--on-secondary)',
              border: 'none', borderRadius: 'var(--r-full)', cursor: 'pointer',
            }}
          >
            {loading ? '...' : 'ENABLE'}
          </button>
          <button
            onClick={onDismiss}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
              letterSpacing: '0.08em', padding: '6px 14px',
              background: 'transparent', color: 'var(--on-surface-dim)',
              border: '1px solid var(--glass-border)', borderRadius: 'var(--r-full)', cursor: 'pointer',
            }}
          >
            NOT NOW
          </button>
        </div>
      </div>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-dim)', padding: 2 }}>
        <X size={14} />
      </button>
    </div>
  );
}
