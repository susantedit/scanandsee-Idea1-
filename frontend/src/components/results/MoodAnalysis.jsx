import React, { useEffect, useState } from 'react';
import { Brain, Zap, Moon, Smile, Target } from 'lucide-react';
import GlassCard from '../layout/GlassCard.jsx';
import { analyzeMood } from '../../services/api.js';

function MoodBar({ label, score, color, icon: Icon, description }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon size={13} color={color} />
          <span className="text-label" style={{ color: 'var(--on-surface-muted)', fontSize: 10 }}>{label}</span>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color }}>{score}/10</span>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{
          width: `${(score / 10) * 100}%`,
          background: color,
          boxShadow: `0 0 6px ${color}`,
          transition: 'width 1s ease-out',
        }} />
      </div>
      {description && (
        <span className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 9 }}>{description}</span>
      )}
    </div>
  );
}

export default function MoodAnalysis({ scan }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [open,    setOpen]    = useState(false);

  const load = async () => {
    if (data || loading) return;
    setLoading(true);
    try {
      const result = await analyzeMood({
        food_name:  scan.food_name,
        calories:   scan.calories,
        protein_g:  scan.protein_g,
        carbs_g:    scan.carbs_g,
        fats_g:     scan.fats_g,
        sugar_g:    scan.sugar_g,
        sodium_mg:  scan.sodium_mg,
      });
      setData(result);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleToggle = () => {
    setOpen(o => !o);
    if (!open) load();
  };

  return (
    <div>
      <button
        onClick={handleToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--secondary-bg)',
          border: '1px solid rgba(0,219,233,0.25)',
          borderRadius: 'var(--r-lg)',
          padding: 'var(--sp-4)',
          cursor: 'pointer',
          color: 'var(--secondary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          <Brain size={16} color="var(--secondary)" />
          <span className="text-label-md" style={{ color: 'var(--secondary)', fontSize: 11 }}>
            Mood & Brain Analysis
          </span>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--on-surface-dim)' }}>
          {open ? 'HIDE' : 'ANALYZE'}
        </span>
      </button>

      {open && (
        <GlassCard className="anim-fade-up" style={{ marginTop: 'var(--sp-3)', borderColor: 'rgba(0,219,233,0.2)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--sp-6)' }}>
              <p className="text-label anim-blink" style={{ color: 'var(--secondary)', letterSpacing: '0.12em' }}>
                ANALYZING BRAIN IMPACT...
              </p>
            </div>
          ) : data ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)', padding: 'var(--sp-5)' }}>
              <MoodBar label="Energy Level"    score={data.energy_level?.score}    color="var(--primary)"   icon={Zap}    description={data.energy_level?.description} />
              <MoodBar label="Focus Impact"    score={data.focus_impact?.score}    color="var(--secondary)" icon={Target} description={data.focus_impact?.description} />
              <MoodBar label="Mood Effect"     score={data.mood_effect?.score}     color="var(--tertiary)"  icon={Smile}  description={data.mood_effect?.description} />
              <MoodBar label="Sleep Friendly"  score={data.sleep_impact?.score}    color="var(--warning)"   icon={Moon}   description={data.sleep_impact?.description} />

              {data.energy_crash_risk?.score > 5 && (
                <div style={{
                  background: 'var(--error-bg)',
                  border: '1px solid rgba(255,180,171,0.3)',
                  borderRadius: 'var(--r-md)',
                  padding: 'var(--sp-3)',
                }}>
                  <p className="text-label" style={{ color: 'var(--error)', fontSize: 10 }}>
                    ⚡ ENERGY CRASH RISK — {data.energy_crash_risk.time_to_crash}
                  </p>
                  <p className="text-body-sm" style={{ color: 'var(--on-surface-muted)', marginTop: 4 }}>
                    {data.energy_crash_risk.description}
                  </p>
                </div>
              )}

              {data.best_time_to_eat && (
                <p className="text-body-sm" style={{ color: 'var(--on-surface-muted)' }}>
                  🕐 Best time: <strong style={{ color: 'var(--on-surface)' }}>{data.best_time_to_eat}</strong>
                </p>
              )}

              {data.brain_nutrients?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
                  {data.brain_nutrients.map((n, i) => (
                    <span key={i} className="chip chip-cyan">{n}</span>
                  ))}
                </div>
              )}

              {data.summary && (
                <p className="text-body-sm" style={{ color: 'var(--on-surface-muted)', fontStyle: 'italic' }}>
                  {data.summary}
                </p>
              )}
            </div>
          ) : null}
        </GlassCard>
      )}
    </div>
  );
}
