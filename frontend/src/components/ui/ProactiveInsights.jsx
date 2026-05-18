/**
 * Proactive AI Insights Banner
 *
 * Shows on HomePage when memory detects patterns:
 * - "You've eaten high-sugar foods 3 days in a row"
 * - "Your protein intake has been low this week"
 * - "5-day streak! Keep it up"
 *
 * This is the "behavior change engine" — the #1 retention driver.
 */
import React, { useState, useEffect } from 'react';
import { X, Brain, TrendingDown, AlertTriangle, Flame, Trophy } from 'lucide-react';
import { getInsights, getMemorySummary } from '../../services/aiMemory.js';
import { getUserWarnings } from '../../services/api.js';

function getIcon(insight) {
  const lower = insight.toLowerCase();
  if (lower.includes('sugar'))   return <AlertTriangle size={14} color="var(--warning)" />;
  if (lower.includes('protein')) return <TrendingDown  size={14} color="var(--error)" />;
  if (lower.includes('streak'))  return <Flame         size={14} color="var(--primary)" />;
  if (lower.includes('great') || lower.includes('average')) return <Trophy size={14} color="var(--warning)" />;
  return <Brain size={14} color="var(--secondary)" />;
}

function getColor(insight) {
  const lower = insight.toLowerCase();
  if (lower.includes('sugar') || lower.includes('unhealthy')) return { border: 'rgba(255,180,171,0.3)', bg: 'var(--error-bg)', text: 'var(--error)' };
  if (lower.includes('protein') || lower.includes('low'))     return { border: 'rgba(255,209,102,0.3)', bg: 'var(--warning-bg)', text: 'var(--warning)' };
  if (lower.includes('streak') || lower.includes('great'))    return { border: 'rgba(0,230,57,0.3)',    bg: 'var(--primary-bg)', text: 'var(--primary)' };
  return { border: 'rgba(0,219,233,0.3)', bg: 'var(--secondary-bg)', text: 'var(--secondary)' };
}

export default function ProactiveInsights() {
  const [insights,   setInsights]   = useState([]);
  const [dismissed,  setDismissed]  = useState([]);
  const [streak,     setStreak]     = useState(0);

  useEffect(() => {
    const fetchAllInsights = async () => {
      // Get local memory insights
      const localInsights = getInsights();
      const mem = getMemorySummary();
      setStreak(mem.streakData?.current || 0);

      // Get server warnings
      try {
        const { warnings } = await getUserWarnings();
        // Merge without duplicates
        const combined = [...new Set([...localInsights, ...(warnings || [])])];
        setInsights(combined);
      } catch (err) {
        setInsights(localInsights);
      }
    };
    fetchAllInsights();
  }, []);

  const visible = insights.filter((_, i) => !dismissed.includes(i));
  if (!visible.length && streak < 2) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>

      {/* Streak banner */}
      {streak >= 2 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
          padding: 'var(--sp-3) var(--sp-4)',
          background: 'var(--primary-bg)',
          border: '1px solid rgba(0,230,57,0.3)',
          borderRadius: 'var(--r-lg)',
        }}>
          <Flame size={16} color="var(--primary)" />
          <span className="text-body-sm" style={{ color: 'var(--primary)', fontWeight: 600, flex: 1 }}>
            {streak}-day scan streak! You're building a habit.
          </span>
        </div>
      )}

      {/* Insight cards */}
      {visible.map((insight, i) => {
        const { border, bg, text } = getColor(insight);
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-3)',
            padding: 'var(--sp-3) var(--sp-4)',
            background: bg, border: `1px solid ${border}`,
            borderRadius: 'var(--r-lg)',
          }}>
            <div style={{ flexShrink: 0, marginTop: 1 }}>{getIcon(insight)}</div>
            <p className="text-body-sm" style={{ color: 'var(--on-surface)', flex: 1, lineHeight: 1.5 }}>
              {insight}
            </p>
            <button
              onClick={() => setDismissed(d => [...d, insights.indexOf(insight)])}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-dim)', flexShrink: 0, padding: 2 }}
              aria-label="Dismiss"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
