import React, { useState, useEffect } from 'react';
import { Camera, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../../store/useAppStore.js';

export default function HabitPrompt() {
  const [show, setShow] = useState(false);
  const { scanHistory } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Determine if it's meal time (e.g. 8-10am, 12-2pm, 6-8pm)
    const hour = new Date().getHours();
    const isMealTime = (hour >= 8 && hour <= 10) || (hour >= 12 && hour <= 14) || (hour >= 18 && hour <= 20);

    // Has user scanned anything in the last 4 hours?
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
    const recentScans = scanHistory?.filter(s => new Date(s.createdAt) > fourHoursAgo) || [];

    // Only show if it's meal time and they haven't scanned anything recently
    // And if they haven't dismissed it this session
    const dismissed = sessionStorage.getItem('habitPromptDismissed');
    
    if (isMealTime && recentScans.length === 0 && !dismissed) {
      // Delay showing it slightly to not clash with initial render
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [scanHistory]);

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem('habitPromptDismissed', 'true');
  };

  if (!show) return null;

  return (
    <div className="anim-fade-up stagger-1" style={{
      display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
      padding: 'var(--sp-3) var(--sp-4)',
      background: 'linear-gradient(90deg, var(--primary-dark), var(--primary-bg))',
      border: '1px solid rgba(0,230,57,0.3)',
      borderRadius: 'var(--r-lg)',
      boxShadow: 'var(--glow-sm-green)',
    }}>
      <div style={{ flexShrink: 0, background: 'var(--primary)', padding: 6, borderRadius: '50%' }}>
        <Camera size={16} color="var(--on-primary)" />
      </div>
      <div style={{ flex: 1 }}>
        <p className="text-body-sm" style={{ color: 'var(--on-surface)', fontWeight: 600, marginBottom: 2 }}>Time to eat?</p>
        <p className="text-label" style={{ color: 'var(--on-surface-dim)' }}>Scan your meal to keep your streak going!</p>
      </div>
      <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
        <button
          onClick={() => navigate('/scan')}
          style={{ background: 'var(--primary)', color: 'var(--on-primary)', border: 'none', borderRadius: 'var(--r-md)', padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
        >
          SCAN
        </button>
        <button
          onClick={handleDismiss}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 'var(--r-md)', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          aria-label="Dismiss"
        >
          <X size={14} color="var(--on-surface-dim)" />
        </button>
      </div>
    </div>
  );
}
