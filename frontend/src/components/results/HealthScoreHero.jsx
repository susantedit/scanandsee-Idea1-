import React from 'react';
import ProgressRing from '../ui/ProgressRing.jsx';
import Chip from '../ui/Chip.jsx';
import { scoreToColor } from '../../utils/scoreColor.js';

function verdictToChip(verdict) {
  const map = {
    HEALTHY: 'healthy', SAFE: 'healthy',
    MODERATE: 'moderate', CAUTION: 'moderate',
    UNHEALTHY: 'danger', DANGEROUS: 'danger',
    IDENTIFIED: 'cyan', UNKNOWN: 'default',
  };
  return map[verdict] || 'default';
}

function objectTypeLabel(type) {
  const map = {
    food: 'Food', packaged_food: 'Packaged Food', supplement: 'Supplement',
    medicine: 'Medicine', plant: 'Plant', animal: 'Animal',
    document: 'Document', product: 'Product', scene: 'Scene',
    person: 'Person', other: 'Object',
  };
  return map[type] || 'Object';
}

export default function HealthScoreHero({ scan }) {
  const { color }    = scoreToColor(scan.health_score);
  const verdict      = scan.verdict || 'MODERATE';
  const chipVar      = verdictToChip(verdict);
  const confidence   = scan.confidence ?? 80;
  const objectType   = scan.object_type || 'food';
  const isFood       = ['food', 'packaged_food', 'supplement'].includes(objectType);

  const confColor = confidence >= 80 ? 'var(--primary)' : confidence >= 60 ? 'var(--warning)' : 'var(--error)';
  const confBg    = confidence >= 80 ? 'var(--primary-bg)' : confidence >= 60 ? 'var(--warning-bg)' : 'var(--error-bg)';
  const confBorder= confidence >= 80 ? 'rgba(0,230,57,0.25)' : confidence >= 60 ? 'rgba(255,209,102,0.25)' : 'rgba(255,180,171,0.25)';

  return (
    <div className="anim-scale-in" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 'var(--sp-4)', padding: 'var(--sp-8) var(--sp-4)',
    }}>

      {/* Object type badge — shown for non-food */}
      {objectType !== 'food' && (
        <span className="chip chip-cyan">{objectTypeLabel(objectType)}</span>
      )}

      {/* Score ring */}
      <div style={{ position: 'relative' }}>
        <ProgressRing score={scan.health_score} size={180} strokeWidth={12} />
        <div style={{
          position: 'absolute', inset: -8, borderRadius: '50%',
          boxShadow: `0 0 30px ${color}40`, pointerEvents: 'none',
        }} />
      </div>

      {/* Name */}
      <h1 className="text-headline" style={{ textAlign: 'center', color: 'var(--on-surface)', maxWidth: 300 }}>
        {scan.food_name}
      </h1>

      {/* Verdict + confidence */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Chip variant={chipVar}>{verdict}</Chip>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
          letterSpacing: '0.08em', color: confColor, background: confBg,
          border: `1px solid ${confBorder}`, borderRadius: 'var(--r-full)', padding: '3px 10px',
        }}>
          {confidence}% CONFIDENT
        </span>
      </div>

      {/* Description */}
      {scan.description && (
        <p className="text-body-sm" style={{
          color: 'var(--on-surface-muted)', textAlign: 'center',
          maxWidth: 320, fontStyle: 'italic', lineHeight: 1.6,
        }}>
          {scan.description}
        </p>
      )}

      {/* Serving size */}
      {isFood && scan.serving_size && scan.serving_size !== 'N/A' && (
        <span className="text-label" style={{ color: 'var(--on-surface-dim)' }}>
          Per {scan.serving_size}
        </span>
      )}
    </div>
  );
}
