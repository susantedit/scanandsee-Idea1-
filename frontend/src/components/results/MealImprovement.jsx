import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function MealImprovement({ improvements = [] }) {
  if (!improvements.length) return null;

  return (
    <div>
      <h2 className="text-label-md" style={{
        color: 'var(--on-surface-muted)',
        marginBottom: 'var(--sp-3)',
      }}>
        How to Improve
      </h2>
      <div className="glass-card" style={{ padding: 'var(--sp-5)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          {improvements.map((tip, i) => (
            <div
              key={i}
              className={`anim-fade-up stagger-${Math.min(i + 1, 8)}`}
              style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'flex-start' }}
            >
              <CheckCircle2 size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
              <span className="text-body-sm" style={{ color: 'var(--on-surface)' }}>
                {tip}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
