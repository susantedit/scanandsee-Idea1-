import React from 'react';
import { Trophy } from 'lucide-react';

function MetricRow({ detail }) {
  const { metric, a_value, b_value, winner, note } = detail;
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      gap: 'var(--sp-2)',
      alignItems: 'center',
      padding: 'var(--sp-3) 0',
      borderBottom: '1px solid var(--glass-border)',
    }}>
      <span style={{
        textAlign: 'right',
        fontFamily: 'var(--font-mono)',
        fontSize: 13,
        color: winner === 'A' ? 'var(--primary)' : 'var(--on-surface-dim)',
        fontWeight: winner === 'A' ? 700 : 400,
      }}>
        {a_value}
      </span>
      <span className="text-label" style={{
        color: 'var(--on-surface-muted)',
        textAlign: 'center',
        fontSize: 9,
        minWidth: 70,
      }}>
        {metric}
      </span>
      <span style={{
        textAlign: 'left',
        fontFamily: 'var(--font-mono)',
        fontSize: 13,
        color: winner === 'B' ? 'var(--primary)' : 'var(--on-surface-dim)',
        fontWeight: winner === 'B' ? 700 : 400,
      }}>
        {b_value}
      </span>
    </div>
  );
}

export default function ComparisonTable({ result }) {
  if (!result) return null;
  const { product_a, product_b, winner, reason, comparison_details } = result;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
      {/* Winner banner */}
      <div className="glass-card" style={{
        padding: 'var(--sp-4)',
        borderColor: 'rgba(0,230,57,0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--sp-3)',
      }}>
        <Trophy size={20} color="var(--warning)" />
        <div>
          <p className="text-label-md" style={{ color: 'var(--primary)' }}>
            Winner: {winner === 'TIE' ? 'TIE' : `Product ${winner} — ${winner === 'A' ? product_a.name : product_b.name}`}
          </p>
          <p className="text-body-sm" style={{ color: 'var(--on-surface-muted)', marginTop: 4 }}>
            {reason}
          </p>
        </div>
      </div>

      {/* Metric rows */}
      <div className="glass-card" style={{ padding: 'var(--sp-4)' }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: 'var(--sp-2)',
          marginBottom: 'var(--sp-3)',
        }}>
          <span className="text-label" style={{ textAlign: 'right', color: 'var(--secondary)', fontSize: 10 }}>
            {product_a.name}
          </span>
          <span style={{ minWidth: 70 }} />
          <span className="text-label" style={{ textAlign: 'left', color: 'var(--tertiary)', fontSize: 10 }}>
            {product_b.name}
          </span>
        </div>

        {comparison_details?.map((d, i) => (
          <MetricRow key={i} detail={d} />
        ))}
      </div>
    </div>
  );
}
