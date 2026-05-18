/**
 * BodyConsequences — consequence-based intelligence display.
 *
 * Shows WHAT THIS DOES TO YOUR BODY, not just numbers.
 * "Will spike blood sugar and crash energy in 90 min" > "14g sugar"
 *
 * This is the #1 retention feature — emotional reaction to consequences.
 */
import React from 'react';
import { Zap, Shield } from 'lucide-react';
import GlassCard from '../layout/GlassCard.jsx';

export default function BodyConsequences({ consequences = [], scoreReason = '' }) {
  if (!consequences?.length && !scoreReason) return null;

  return (
    <div>
      <h2 className="text-label-md" style={{
        color: 'var(--on-surface-muted)', marginBottom: 'var(--sp-3)',
        display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
      }}>
        <Zap size={13} color="var(--secondary)" />
        What This Does To Your Body
      </h2>

      <GlassCard style={{ borderColor: 'rgba(0,219,233,0.2)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)', padding: 'var(--sp-5)' }}>

          {/* Score reason — why this score */}
          {scoreReason && (
            <div style={{
              padding: 'var(--sp-4)',
              background: 'var(--surface-highest)',
              borderRadius: 'var(--r-md)',
              borderLeft: '4px solid var(--primary)',
              boxShadow: 'var(--glow-xs-green)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 6 }}>
                <span className="chip" style={{ background: 'var(--primary)', color: '#000', fontSize: 9, fontWeight: 800, padding: '2px 6px' }}>EVIDENCE</span>
                <p className="text-label" style={{ color: 'var(--primary)', fontSize: 10, letterSpacing: '0.05em' }}>
                  WHY THIS SCORE
                </p>
              </div>
              <p className="text-body-sm" style={{ color: 'var(--on-surface)', lineHeight: 1.6, fontWeight: 500 }}>
                {scoreReason}
              </p>
            </div>
          )}

          {/* Consequence list */}
          {consequences.map((c, i) => {
            // Color-code by consequence type
            const isNegative = /spike|crash|risk|increase|damage|reduce|deplete|block|harm|toxic|inflam/i.test(c);
            const isPositive = /support|boost|help|improve|protect|provide|sustain|maintain|fuel/i.test(c);
            const color = isNegative ? 'var(--error)' : isPositive ? 'var(--primary)' : 'var(--warning)';
            const dot   = isNegative ? '⚡' : isPositive ? '✓' : '→';

            return (
              <div key={i} className={`anim-fade-up stagger-${Math.min(i + 1, 6)}`}
                style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'flex-start' }}>
                <span style={{ color, fontSize: 13, flexShrink: 0, marginTop: 1 }}>{dot}</span>
                <p className="text-body-sm" style={{ color: 'var(--on-surface)', lineHeight: 1.6 }}>
                  {c}
                </p>
              </div>
            );
          })}
        </div>
        <div style={{ padding: 'var(--sp-3)', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'var(--surface-high)', borderBottomLeftRadius: 'var(--r-md)', borderBottomRightRadius: 'var(--r-md)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
          <Shield size={12} color="var(--on-surface-dim)" />
          <span className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 9, letterSpacing: '0.05em' }}>
            REVIEWED AGAINST CLINICAL NUTRITION PROTOCOLS
          </span>
        </div>
      </GlassCard>
    </div>
  );
}
