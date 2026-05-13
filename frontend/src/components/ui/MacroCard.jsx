import React from 'react';
import { useAnimateValue } from '../../hooks/useAnimateValue.js';
import { dailyPercent } from '../../utils/formatNutrition.js';

const MACRO_CONFIG = {
  protein:  { label: 'Protein',  unit: 'g',   color: 'var(--tertiary)',   ref: 'protein' },
  carbs:    { label: 'Carbs',    unit: 'g',   color: 'var(--secondary)',  ref: 'carbs' },
  fats:     { label: 'Fats',     unit: 'g',   color: 'var(--warning)',    ref: 'fats' },
  calories: { label: 'Calories', unit: 'kcal',color: 'var(--primary)',    ref: 'calories' },
  sugar:    { label: 'Sugar',    unit: 'g',   color: 'var(--error)',      ref: 'sugar' },
  sodium:   { label: 'Sodium',   unit: 'mg',  color: 'var(--warning)',    ref: 'sodium' },
  fiber:    { label: 'Fiber',    unit: 'g',   color: 'var(--primary)',    ref: 'fiber' },
};

export default function MacroCard({ type, value, delay = 0 }) {
  const config  = MACRO_CONFIG[type] || MACRO_CONFIG.calories;
  const animated = useAnimateValue(Math.round(value || 0), 1000, delay);
  const pct     = dailyPercent(value, config.ref);

  return (
    <div className="glass-card-sm anim-fade-up" style={{
      padding: 'var(--sp-4)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--sp-2)',
      minWidth: 90,
      flex: 1,
    }}>
      {/* Value */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 22,
          fontWeight: 700,
          color: config.color,
          lineHeight: 1,
        }}>
          {animated}
        </span>
        <span className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 9 }}>
          {config.unit}
        </span>
      </div>

      {/* Label */}
      <span className="text-label" style={{ color: 'var(--on-surface-muted)', fontSize: 10 }}>
        {config.label}
      </span>

      {/* Daily % bar */}
      <div>
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{
              width: `${Math.min(pct, 100)}%`,
              background: config.color,
              boxShadow: `0 0 6px ${config.color}`,
            }}
          />
        </div>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          color: 'var(--on-surface-dim)',
          marginTop: 2,
          display: 'block',
        }}>
          {pct}% daily
        </span>
      </div>
    </div>
  );
}
