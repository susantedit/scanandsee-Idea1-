import React, { useState, useEffect } from 'react';
import { Brain, Zap, Moon, Target, AlertTriangle, TrendingUp } from 'lucide-react';
import Navbar from '../components/layout/Navbar.jsx';
import BottomNav from '../components/layout/BottomNav.jsx';
import GlassCard from '../components/layout/GlassCard.jsx';
import Button from '../components/ui/Button.jsx';
import { analyzeMood } from '../services/api.js';
import useAppStore from '../store/useAppStore.js';

function ScoreBar({ label, score, color, icon: Icon, description }) {
  return (
    <div className="anim-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          <Icon size={14} color={color} />
          <span className="text-label" style={{ color: 'var(--on-surface-muted)', fontSize: 10 }}>{label}</span>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color }}>{score}/10</span>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{
          width: `${(score / 10) * 100}%`,
          background: color,
          boxShadow: `0 0 6px ${color}`,
        }} />
      </div>
      {description && (
        <p className="text-body-sm" style={{ color: 'var(--on-surface-dim)', fontSize: 12 }}>{description}</p>
      )}
    </div>
  );
}

function CrashBadge({ level }) {
  const config = {
    low:    { color: 'var(--primary)',   bg: 'var(--primary-bg)',   label: 'Low Crash Risk' },
    medium: { color: 'var(--warning)',   bg: 'var(--warning-bg)',   label: 'Medium Crash Risk' },
    high:   { color: 'var(--error)',     bg: 'var(--error-bg)',     label: 'High Crash Risk' },
  }[level] || { color: 'var(--on-surface-muted)', bg: 'var(--surface-high)', label: level };

  return (
    <span style={{
      padding: '4px 12px',
      borderRadius: 'var(--r-full)',
      background: config.bg,
      color: config.color,
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      border: `1px solid ${config.color}40`,
    }}>
      {config.label}
    </span>
  );
}

export default function MoodPage() {
  const { currentScan } = useAppStore();
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Auto-analyze if we have a current scan
  useEffect(() => {
    if (currentScan && !result) {
      handleAnalyze();
    }
  }, []);

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await analyzeMood({
        foodName:  currentScan?.food_name  || 'Unknown food',
        calories:  currentScan?.calories   || 0,
        sugar_g:   currentScan?.sugar_g    || 0,
        protein_g: currentScan?.protein_g  || 0,
        carbs_g:   currentScan?.carbs_g    || 0,
        fats_g:    currentScan?.fats_g     || 0,
        sodium_mg: currentScan?.sodium_mg  || 0,
      });
      setResult(data);
    } catch (err) {
      setError(err.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <Navbar showBack title="Mood & Brain" showSettings={false} />

      <div className="container" style={{ paddingTop: 'var(--sp-6)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)', paddingBottom: 'var(--sp-12)' }}>

        {/* Header */}
        <div className="anim-fade-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-2)' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 'var(--r-lg)',
              background: 'var(--secondary-bg)',
              border: '1px solid rgba(0,219,233,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Brain size={22} color="var(--secondary)" />
            </div>
            <div>
              <h1 className="text-headline" style={{ fontSize: 22 }}>Mood & Brain Analysis</h1>
              <p className="text-body-sm" style={{ color: 'var(--on-surface-muted)' }}>
                How this food affects your mind
              </p>
            </div>
          </div>

          {currentScan?.food_name && (
            <GlassCard padding="p-4" style={{ borderColor: 'rgba(0,219,233,0.2)' }}>
              <p className="text-label" style={{ color: 'var(--secondary)', fontSize: 10 }}>ANALYZING</p>
              <p className="text-title" style={{ color: 'var(--on-surface)', marginTop: 4 }}>{currentScan.food_name}</p>
            </GlassCard>
          )}
        </div>

        {!currentScan && !result && (
          <GlassCard className="anim-fade-up" style={{ textAlign: 'center', padding: 'var(--sp-8)' }}>
            <Brain size={40} color="var(--on-surface-dim)" style={{ margin: '0 auto var(--sp-4)' }} />
            <p className="text-body" style={{ color: 'var(--on-surface-muted)' }}>
              Scan a food first, then come back here to see how it affects your mood, energy, and focus.
            </p>
          </GlassCard>
        )}

        {currentScan && !result && !loading && (
          <Button variant="primary" size="lg" fullWidth onClick={handleAnalyze}>
            ANALYZE BRAIN IMPACT
          </Button>
        )}

        {loading && (
          <GlassCard style={{ textAlign: 'center', padding: 'var(--sp-8)' }}>
            <p className="text-label anim-blink" style={{ color: 'var(--secondary)', letterSpacing: '0.15em' }}>
              ANALYZING BRAIN IMPACT...
            </p>
          </GlassCard>
        )}

        {error && <p className="text-body-sm" style={{ color: 'var(--error)' }}>{error}</p>}

        {result && (
          <>
            {/* Impact scores */}
            <GlassCard className="anim-fade-up" padding="p-5">
              <p className="text-label-md" style={{ color: 'var(--on-surface-muted)', marginBottom: 'var(--sp-5)' }}>
                Impact Scores
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
                <ScoreBar label="Energy"  score={result.energy_impact?.score}  color="var(--warning)"   icon={Zap}        description={result.energy_impact?.description} />
                <ScoreBar label="Focus"   score={result.focus_impact?.score}   color="var(--secondary)" icon={Target}     description={result.focus_impact?.description} />
                <ScoreBar label="Mood"    score={result.mood_impact?.score}    color="var(--primary)"   icon={TrendingUp} description={result.mood_impact?.description} />
                <ScoreBar label="Sleep"   score={result.sleep_impact?.score}   color="var(--tertiary)"  icon={Moon}       description={result.sleep_impact?.description} />
              </div>
            </GlassCard>

            {/* Crash risk */}
            {result.crash_risk && (
              <GlassCard className="anim-fade-up stagger-2" padding="p-5">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-3)' }}>
                  <p className="text-label-md" style={{ color: 'var(--on-surface-muted)' }}>Energy Crash Risk</p>
                  <CrashBadge level={result.crash_risk.level} />
                </div>
                <p className="text-body-sm" style={{ color: 'var(--on-surface)' }}>
                  {result.crash_risk.description}
                </p>
                {result.crash_risk.time_to_crash && (
                  <p className="text-label" style={{ color: 'var(--on-surface-dim)', marginTop: 'var(--sp-2)', fontSize: 10 }}>
                    {result.crash_risk.time_to_crash}
                  </p>
                )}
              </GlassCard>
            )}

            {/* Best time to eat */}
            {result.best_time_to_eat && (
              <GlassCard className="anim-fade-up stagger-3" padding="p-4" style={{ borderColor: 'rgba(0,230,57,0.2)' }}>
                <p className="text-label" style={{ color: 'var(--primary)', fontSize: 10, marginBottom: 'var(--sp-2)' }}>
                  BEST TIME TO EAT
                </p>
                <p className="text-title" style={{ color: 'var(--on-surface)' }}>{result.best_time_to_eat}</p>
              </GlassCard>
            )}

            {/* Brain foods missing */}
            {result.brain_foods_missing?.length > 0 && (
              <GlassCard className="anim-fade-up stagger-4" padding="p-5">
                <p className="text-label-md" style={{ color: 'var(--on-surface-muted)', marginBottom: 'var(--sp-3)' }}>
                  Missing Brain Nutrients
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
                  {result.brain_foods_missing.map((n, i) => (
                    <span key={i} className="chip chip-moderate">{n}</span>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Summary */}
            {result.summary && (
              <GlassCard className="anim-fade-up stagger-5" padding="p-5">
                <p className="text-label-md" style={{ color: 'var(--on-surface-muted)', marginBottom: 'var(--sp-3)' }}>
                  Brain Assessment
                </p>
                <p className="text-body" style={{ color: 'var(--on-surface)', fontStyle: 'italic' }}>
                  "{result.summary}"
                </p>
              </GlassCard>
            )}

            <Button variant="ghost" fullWidth onClick={handleAnalyze} loading={loading}>
              RE-ANALYZE
            </Button>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
