import React, { useState, useEffect } from 'react';
import { ShieldAlert, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import Navbar from '../components/layout/Navbar.jsx';
import BottomNav from '../components/layout/BottomNav.jsx';
import GlassCard from '../components/layout/GlassCard.jsx';
import Button from '../components/ui/Button.jsx';
import { predictHealthRisk } from '../services/api.js';

const RISK_COLOR = { LOW: 'var(--primary)', MODERATE: 'var(--warning)', HIGH: 'var(--error)' };
const RISK_BG    = { LOW: 'var(--primary-bg)', MODERATE: 'var(--warning-bg)', HIGH: 'var(--error-bg)' };

function RiskCard({ risk, index }) {
  const [expanded, setExpanded] = useState(false);
  const color = RISK_COLOR[risk.risk_level] || 'var(--on-surface-muted)';
  const bg    = RISK_BG[risk.risk_level]    || 'var(--surface)';

  return (
    <div
      className={`anim-fade-up stagger-${Math.min(index + 1, 6)}`}
      style={{
        background: bg,
        border: `1px solid ${color}40`,
        borderRadius: 'var(--r-lg)',
        padding: 'var(--sp-4)',
        cursor: 'pointer',
      }}
      onClick={() => setExpanded(e => !e)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p className="text-title" style={{ color: 'var(--on-surface)' }}>{risk.condition}</p>
          <span className="chip" style={{
            background: bg, color, border: `1px solid ${color}40`,
            fontFamily: 'var(--font-mono)', fontSize: 10, padding: '2px 8px',
            borderRadius: 'var(--r-full)', marginTop: 4, display: 'inline-block',
          }}>
            {risk.risk_level} RISK
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, color }}>
            {risk.risk_score}%
          </span>
          <p className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 9 }}>likelihood</p>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 'var(--sp-4)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          {risk.contributing_factors?.length > 0 && (
            <div>
              <p className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 10, marginBottom: 6 }}>CONTRIBUTING FACTORS</p>
              {risk.contributing_factors.map((f, i) => (
                <p key={i} className="text-body-sm" style={{ color: 'var(--error)', marginBottom: 2 }}>• {f}</p>
              ))}
            </div>
          )}
          {risk.prevention?.length > 0 && (
            <div>
              <p className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 10, marginBottom: 6 }}>HOW TO REDUCE RISK</p>
              {risk.prevention.map((p, i) => (
                <p key={i} className="text-body-sm" style={{ color: 'var(--primary)', marginBottom: 2 }}>✓ {p}</p>
              ))}
            </div>
          )}
          {risk.timeline && (
            <p className="text-body-sm" style={{ color: 'var(--on-surface-dim)', fontStyle: 'italic' }}>
              ⏱ {risk.timeline}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function TrendBadge({ label, value }) {
  const isGood = ['Adequate', 'Consistent', 'Controlled', 'Normal'].includes(value);
  const isBad  = ['High', 'Very High', 'Increasing', 'Elevated'].includes(value);
  const color  = isGood ? 'var(--primary)' : isBad ? 'var(--error)' : 'var(--warning)';
  const Icon   = isGood ? TrendingUp : isBad ? TrendingDown : Minus;

  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${color}30`,
      borderRadius: 'var(--r-md)',
      padding: 'var(--sp-3)',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      flex: 1,
    }}>
      <p className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 9 }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Icon size={12} color={color} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color }}>{value}</span>
      </div>
    </div>
  );
}

export default function RiskPage() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    predictHealthRisk()
      .then(setData)
      .catch(e => setError(e.message || 'Could not load risk prediction.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <Navbar showBack title="Health Risk" showSettings={false} />

      <div className="container" style={{ paddingTop: 'var(--sp-6)', paddingBottom: 'var(--sp-12)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>

        <div className="anim-fade-up">
          <h1 className="text-headline">AI Health Risk Prediction</h1>
          <p className="text-body-sm" style={{ color: 'var(--on-surface-muted)', marginTop: 'var(--sp-2)' }}>
            Based on your last 7 days of eating patterns
          </p>
        </div>

        {loading && (
          <div className="flex-center" style={{ padding: 'var(--sp-12)' }}>
            <Loader2 size={32} color="var(--primary)" className="anim-spin" />
          </div>
        )}

        {error && (
          <GlassCard>
            <p className="text-body" style={{ color: 'var(--error)' }}>{error}</p>
            <p className="text-body-sm" style={{ color: 'var(--on-surface-muted)', marginTop: 'var(--sp-2)' }}>
              Scan more food to get predictions. You need at least a few days of data.
            </p>
          </GlassCard>
        )}

        {data && (
          <>
            {/* Overall score */}
            <GlassCard className="anim-fade-up" style={{ textAlign: 'center', padding: 'var(--sp-6)' }}>
              <p className="text-label" style={{ color: 'var(--on-surface-muted)', marginBottom: 'var(--sp-2)' }}>OVERALL DIET SCORE</p>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 64,
                fontWeight: 800,
                color: data.overall_diet_score >= 7 ? 'var(--primary)' : data.overall_diet_score >= 4 ? 'var(--warning)' : 'var(--error)',
              }}>
                {data.overall_diet_score}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: 'var(--on-surface-dim)' }}>/10</span>
              <p className="text-body-sm" style={{ color: 'var(--on-surface-muted)', marginTop: 'var(--sp-2)' }}>
                {data.diet_pattern}
              </p>
            </GlassCard>

            {/* Weekly trends */}
            {data.weekly_trends && (
              <div className="anim-fade-up stagger-2">
                <p className="text-label-md" style={{ color: 'var(--on-surface-muted)', marginBottom: 'var(--sp-3)' }}>WEEKLY TRENDS</p>
                <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
                  <TrendBadge label="Calories" value={data.weekly_trends.calories} />
                  <TrendBadge label="Protein"  value={data.weekly_trends.protein} />
                  <TrendBadge label="Sugar"    value={data.weekly_trends.sugar} />
                  <TrendBadge label="Sodium"   value={data.weekly_trends.sodium} />
                </div>
              </div>
            )}

            {/* Risk cards */}
            {data.risks?.length > 0 && (
              <div className="anim-fade-up stagger-3">
                <p className="text-label-md" style={{ color: 'var(--on-surface-muted)', marginBottom: 'var(--sp-3)' }}>
                  PREDICTED RISKS (tap to expand)
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                  {data.risks.map((r, i) => <RiskCard key={i} risk={r} index={i} />)}
                </div>
              </div>
            )}

            {/* Positive patterns */}
            {data.positive_patterns?.length > 0 && (
              <GlassCard className="anim-fade-up stagger-4" style={{ borderColor: 'rgba(0,230,57,0.2)' }}>
                <p className="text-label-md" style={{ color: 'var(--primary)', marginBottom: 'var(--sp-3)' }}>GOOD HABITS ✓</p>
                {data.positive_patterns.map((p, i) => (
                  <p key={i} className="text-body-sm" style={{ color: 'var(--on-surface)', marginBottom: 4 }}>✓ {p}</p>
                ))}
              </GlassCard>
            )}

            {/* Top recommendations */}
            {data.top_recommendations?.length > 0 && (
              <GlassCard className="anim-fade-up stagger-5">
                <p className="text-label-md" style={{ color: 'var(--on-surface-muted)', marginBottom: 'var(--sp-3)' }}>TOP RECOMMENDATIONS</p>
                {data.top_recommendations.map((r, i) => (
                  <p key={i} className="text-body-sm" style={{ color: 'var(--secondary)', marginBottom: 6 }}>→ {r}</p>
                ))}
              </GlassCard>
            )}

            {data.summary && (
              <p className="text-body-sm anim-fade-up stagger-6" style={{ color: 'var(--on-surface-muted)', fontStyle: 'italic', textAlign: 'center' }}>
                {data.summary}
              </p>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
