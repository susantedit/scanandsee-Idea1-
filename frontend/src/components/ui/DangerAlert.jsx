import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Chip from './Chip.jsx';
import { riskToChip } from '../../utils/scoreColor.js';

/**
 * Red-bordered danger alert card for health warnings.
 */
export default function DangerAlert({ warning, index = 0 }) {
  const { text, risk_type } = warning;

  return (
    <div
      className={`glass-card anim-fade-up stagger-${Math.min(index + 1, 8)} anim-glow-error`}
      style={{
        padding: 'var(--sp-4)',
        borderColor: 'rgba(255,180,171,0.35)',
        display: 'flex',
        gap: 'var(--sp-3)',
        alignItems: 'flex-start',
      }}
    >
      <AlertTriangle
        size={18}
        color="var(--error)"
        style={{ flexShrink: 0, marginTop: 2 }}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
        <span className="text-body-sm" style={{ color: 'var(--on-surface)' }}>
          {text}
        </span>
        {risk_type && (
          <Chip variant={riskToChip(risk_type).replace('chip-', '')}>
            {risk_type.replace('_', ' ')}
          </Chip>
        )}
      </div>
    </div>
  );
}
