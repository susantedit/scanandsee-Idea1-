import React, { useState, useEffect } from 'react';
import { Watch, Heart, Activity, Zap, CheckCircle2, ExternalLink, RefreshCw } from 'lucide-react';
import Navbar from '../components/layout/Navbar.jsx';
import BottomNav from '../components/layout/BottomNav.jsx';
import GlassCard from '../components/layout/GlassCard.jsx';
import Button from '../components/ui/Button.jsx';

import { getWearableData, saveWearableData } from '../services/api.js';

// ── Google Fit via Web Bluetooth / Health Connect API ─────────────────────────
async function fetchGoogleFitSteps() {
  // Google Fit REST API — requires OAuth2 token
  // For now returns mock data — replace with real OAuth flow
  return { steps: 8432, calories_burned: 312, active_minutes: 47, heart_rate_avg: 72 };
}

// ── Apple Health via Web Share Target / HealthKit bridge ──────────────────────
async function fetchAppleHealthData() {
  // Apple Health requires native app bridge — not available in PWA
  // Returns mock data for UI demonstration
  return { steps: 9210, calories_burned: 380, active_minutes: 55, heart_rate_avg: 68 };
}

// ── Manual entry fallback ─────────────────────────────────────────────────────
function ManualEntry({ onSave }) {
  const [steps,    setSteps]    = useState('');
  const [calories, setCalories] = useState('');
  const [hr,       setHr]       = useState('');

  const handleSave = () => {
    if (!steps && !calories) return;
    onSave({ steps: parseInt(steps) || 0, calories_burned: parseInt(calories) || 0, heart_rate_avg: parseInt(hr) || 0, source: 'manual' });
  };

  return (
    <GlassCard style={{ borderColor: 'rgba(0,219,233,0.2)' }}>
      <p className="text-label-md" style={{ color: 'var(--secondary)', marginBottom: 'var(--sp-4)' }}>MANUAL ENTRY</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
        {[
          { label: 'Steps today', value: steps, set: setSteps, placeholder: 'e.g. 8000' },
          { label: 'Calories burned', value: calories, set: setCalories, placeholder: 'e.g. 300' },
          { label: 'Avg heart rate (bpm)', value: hr, set: setHr, placeholder: 'e.g. 72' },
        ].map(({ label, value, set, placeholder }) => (
          <div key={label}>
            <p className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 10, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
            <input
              type="number" value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
              style={{ background: 'transparent', border: 'none', borderBottom: '2px solid var(--outline-variant)', color: 'var(--on-surface)', fontFamily: 'var(--font-body)', fontSize: 16, padding: '8px 0', width: '100%', outline: 'none' }}
            />
          </div>
        ))}
        <Button variant="primary" onClick={handleSave}>SAVE TODAY'S DATA</Button>
      </div>
    </GlassCard>
  );
}

export default function WearablesPage() {
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [showManual,setShowManual]= useState(false);

  useEffect(() => {
    getWearableData()
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleConnect = async (source) => {
    setLoading(true);
    try {
      let result;
      if (source === 'google') result = await fetchGoogleFitSteps();
      else result = await fetchAppleHealthData();
      const d = { ...result, source };
      const saved = await saveWearableData(d);
      setData(saved);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleManualSave = async (d) => {
    try {
      const saved = await saveWearableData(d);
      setData(saved);
      setShowManual(false);
    } catch {}
  };

  // Calorie balance: burned - consumed (from nutrition data)
  const calorieBalance = data ? (data.calories_burned || 0) : 0;

  return (
    <div className="page">
      <Navbar showBack title="Wearables" showSettings={false} />
      <div className="container" style={{ paddingTop: 'var(--sp-6)', paddingBottom: 'var(--sp-12)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>

        <div className="anim-fade-up">
          <h1 className="text-headline">Health Sync</h1>
          <p className="text-body-sm" style={{ color: 'var(--on-surface-muted)', marginTop: 'var(--sp-2)' }}>
            Connect your wearable to combine activity data with nutrition intelligence
          </p>
        </div>

        {/* Today's stats */}
        {data && (
          <GlassCard className="anim-fade-up stagger-2" style={{ borderColor: 'rgba(0,230,57,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-4)' }}>
              <p className="text-label-md" style={{ color: 'var(--primary)' }}>TODAY'S ACTIVITY</p>
              <span className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 9 }}>
                {data.source?.toUpperCase()} · {data.syncedAt ? new Date(data.syncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--sp-3)' }}>
              {[
                { icon: Activity, label: 'Steps',           val: (data.steps || 0).toLocaleString(),       color: 'var(--primary)' },
                { icon: Zap,      label: 'Calories Burned', val: `${data.calories_burned || 0} kcal`,       color: 'var(--warning)' },
                { icon: Heart,    label: 'Avg Heart Rate',  val: `${data.heart_rate_avg || '--'} bpm`,      color: 'var(--error)' },
                { icon: Watch,    label: 'Active Minutes',  val: `${data.active_minutes || '--'} min`,      color: 'var(--secondary)' },
              ].map(({ icon: Icon, label, val, color }) => (
                <div key={label} style={{ background: 'var(--surface-high)', borderRadius: 'var(--r-md)', padding: 'var(--sp-3)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Icon size={14} color={color} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color }}>{val}</span>
                  <span className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 9 }}>{label}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Connect options */}
        <div className="anim-fade-up stagger-3" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          <p className="text-label-md" style={{ color: 'var(--on-surface-muted)' }}>CONNECT A DEVICE</p>

          {/* Google Fit */}
          <GlassCard padding="p-4" style={{ cursor: 'pointer' }} onClick={() => handleConnect('google')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', background: 'rgba(66,133,244,0.15)', border: '1px solid rgba(66,133,244,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Activity size={20} color="#4285F4" />
              </div>
              <div style={{ flex: 1 }}>
                <p className="text-body-sm" style={{ color: 'var(--on-surface)', fontWeight: 600 }}>Google Fit</p>
                <p className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 9 }}>Steps · Calories · Heart rate</p>
              </div>
              {data?.source === 'google' ? <CheckCircle2 size={16} color="var(--primary)" /> : <ExternalLink size={14} color="var(--on-surface-dim)" />}
            </div>
          </GlassCard>

          {/* Apple Health */}
          <GlassCard padding="p-4" style={{ cursor: 'pointer' }} onClick={() => handleConnect('apple')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', background: 'rgba(255,180,171,0.15)', border: '1px solid rgba(255,180,171,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Heart size={20} color="var(--error)" />
              </div>
              <div style={{ flex: 1 }}>
                <p className="text-body-sm" style={{ color: 'var(--on-surface)', fontWeight: 600 }}>Apple Health</p>
                <p className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 9 }}>Requires iOS app · Coming soon</p>
              </div>
              <span className="chip chip-default" style={{ fontSize: 9 }}>SOON</span>
            </div>
          </GlassCard>

          {/* Manual entry */}
          <Button variant="outline" icon={<RefreshCw size={14} />} fullWidth onClick={() => setShowManual(s => !s)}>
            ENTER MANUALLY
          </Button>

          {showManual && <ManualEntry onSave={handleManualSave} />}
        </div>

        {/* Why connect */}
        <GlassCard className="anim-fade-up stagger-4" style={{ borderColor: 'rgba(0,219,233,0.15)' }}>
          <p className="text-label-md" style={{ color: 'var(--secondary)', marginBottom: 'var(--sp-3)' }}>WHY CONNECT?</p>
          {[
            'See your calorie balance: burned vs consumed',
            'AI adjusts meal recommendations based on activity',
            'Track recovery nutrition after workouts',
            'Get alerts when you need more protein or carbs',
          ].map((t, i) => (
            <p key={i} className="text-body-sm" style={{ color: 'var(--on-surface-muted)', marginBottom: 6 }}>→ {t}</p>
          ))}
        </GlassCard>
      </div>
      <BottomNav />
    </div>
  );
}
