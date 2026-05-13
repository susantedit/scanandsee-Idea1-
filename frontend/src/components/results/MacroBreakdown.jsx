import React from 'react';
import MacroCard from '../ui/MacroCard.jsx';

export default function MacroBreakdown({ scan }) {
  return (
    <div>
      <h2 className="text-label-md" style={{
        color: 'var(--on-surface-muted)',
        marginBottom: 'var(--sp-3)',
      }}>
        Nutrition Facts
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 'var(--sp-3)',
      }}>
        <MacroCard type="calories" value={scan.calories}  delay={0} />
        <MacroCard type="protein"  value={scan.protein_g} delay={80} />
        <MacroCard type="carbs"    value={scan.carbs_g}   delay={160} />
        <MacroCard type="fats"     value={scan.fats_g}    delay={240} />
        <MacroCard type="sugar"    value={scan.sugar_g}   delay={320} />
        <MacroCard type="sodium"   value={scan.sodium_mg} delay={400} />
      </div>
    </div>
  );
}
