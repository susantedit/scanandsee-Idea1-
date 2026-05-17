import React from 'react';
import { Sparkles } from 'lucide-react';
import GlassCard from '../layout/GlassCard.jsx';

export default function FunFacts({ facts = [] }) {
  if (!facts?.length) return null;

  return (
    <div>
      <h2 className="text-label-md" style={{
        color: 'var(--on-surface-muted)', marginBottom: 'var(--sp-3)',
        display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
      }}>
        <Sparkles size={13} color="var(--warning)" />
        Fun Facts
      </h2>
      <GlassCard style={{ borderColor: 'rgba(255,209,102,0.2)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', padding: 'var(--sp-4)' }}>
          {facts.map((fact, i) => (
            <div key={i} className={`anim-fade-up stagger-${Math.min(i + 1, 6)}`}
              style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--warning)', fontSize: 14, flexShrink: 0, marginTop: 1 }}>✦</span>
              <p className="text-body-sm" style={{ color: 'var(--on-surface)', lineHeight: 1.6 }}>{fact}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
