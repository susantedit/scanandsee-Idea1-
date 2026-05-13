import React from 'react';
import ProgressRing from '../ui/ProgressRing.jsx';
import Chip from '../ui/Chip.jsx';
import { scoreToColor } from '../../utils/scoreColor.js';

export default function HealthScoreHero({ scan }) {
  const { color, label } = scoreToColor(scan.health_score);
  const chipVariant = label === 'HEALTHY' ? 'healthy' : label === 'MODERATE' ? 'moderate' : 'danger';

  return (
    <div className="anim-scale-in" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 'var(--sp-4)',
      padding: 'var(--sp-8) var(--sp-4)',
    }}>
      {/* Ring */}
      <div style={{ position: 'relative' }}>
        <ProgressRing score={scan.health_score} size={180} strokeWidth={12} />
        {/* Outer glow ring */}
        <div style={{
          position: 'absolute',
          inset: -8,
          borderRadius: '50%',
          boxShadow: `0 0 30px ${color}40`,
          pointerEvents: 'none',
        }} />
      </div>

      {/* Food name */}
      <h1 className="text-headline" style={{
        textAlign: 'center',
        color: 'var(--on-surface)',
        maxWidth: 280,
      }}>
        {scan.food_name}
      </h1>

      {/* Verdict chip */}
      <Chip variant={chipVariant}>
        {label}
      </Chip>

      {/* Serving size */}
      {scan.serving_size && (
        <span className="text-label" style={{ color: 'var(--on-surface-dim)' }}>
          Per {scan.serving_size}
        </span>
      )}
    </div>
  );
}
