/**
 * Body Score — daily aggregate health identity.
 * "Your body score today: 82" — identity retention.
 * Shows on HomePage. Updates after every scan.
 */
import React from 'react';
import { getMemorySummary } from '../../services/aiMemory.js';

function getScoreLabel(score) {
  if (score >= 80) return { label: 'High Performance', color: 'var(--primary)', msg: "You're eating like an athlete." };
  if (score >= 65) return { label: 'On Track',         color: 'var(--secondary)', msg: 'Solid choices. Keep building.' };
  if (score >= 50) return { label: 'Room to Improve',  color: 'var(--warning)', msg: 'Small swaps make a big difference.' };
  return              { label: 'Needs Attention',      color: 'var(--error)', msg: 'Your body deserves better fuel.' };
}

export default function BodyScore() {
  const mem   = getMemorySummary();
  const scans = mem.stats?.totalScans || 0;
  if (scans < 2) return null; // only show after enough data

  // Body score = avg health score * 10 (0-100 scale feels more impactful)
  const raw   = mem.stats?.avgHealthScore || 5;
  const score = Math.round(raw * 10);
  const { label, color, msg } = getScoreLabel(score);
  const streak = mem.streakData?.current || 0;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 'var(--sp-4)',
      padding: 'var(--sp-4) var(--sp-5)',
      background: `${color}10`,
      border: `1px solid ${color}30`,
      borderRadius: 'var(--r-lg)',
    }}>
      {/* Score circle */}
      <div style={{
        width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
        background: `${color}20`, border: `2px solid ${color}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 12px ${color}40`,
      }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color, lineHeight: 1 }}>
          {score}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color, opacity: 0.7 }}>SCORE</span>
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 2 }}>
          <span className="text-label-md" style={{ color, fontSize: 11 }}>{label}</span>
          {streak >= 2 && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--primary)', background: 'var(--primary-bg)', padding: '1px 6px', borderRadius: 'var(--r-full)' }}>
              🔥 {streak}d
            </span>
          )}
        </div>
        <p className="text-body-sm" style={{ color: 'var(--on-surface-muted)', fontSize: 12 }}>{msg}</p>
        <p className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 9, marginTop: 2 }}>
          Based on {scans} scan{scans !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
