import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { safetyToColor } from '../../utils/scoreColor.js';

function IngredientRow({ ingredient, index }) {
  const [expanded, setExpanded] = useState(false);
  const color = safetyToColor(ingredient.safety);
  const hasDetail = ingredient.side_effect || ingredient.alternative;

  return (
    <div
      className={`anim-fade-up stagger-${Math.min(index + 1, 8)}`}
      style={{
        borderLeft: `3px solid ${color}`,
        paddingLeft: 'var(--sp-3)',
        paddingTop: 'var(--sp-2)',
        paddingBottom: 'var(--sp-2)',
        cursor: hasDetail ? 'pointer' : 'default',
      }}
      onClick={() => hasDetail && setExpanded(e => !e)}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          <span className="text-body-sm" style={{ color: 'var(--on-surface)' }}>
            {ingredient.name}
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color,
          }}>
            {ingredient.safety}
          </span>
        </div>
        {hasDetail && (
          expanded
            ? <ChevronUp size={14} color="var(--on-surface-dim)" />
            : <ChevronDown size={14} color="var(--on-surface-dim)" />
        )}
      </div>

      {expanded && hasDetail && (
        <div style={{
          marginTop: 'var(--sp-2)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--sp-1)',
        }}>
          {ingredient.side_effect && (
            <p className="text-body-sm" style={{ color: 'var(--error)' }}>
              ⚠ {ingredient.side_effect}
            </p>
          )}
          {ingredient.alternative && (
            <p className="text-body-sm" style={{ color: 'var(--primary)' }}>
              ✓ Better: {ingredient.alternative}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function IngredientList({ ingredients = [] }) {
  if (!ingredients.length) return null;

  return (
    <div>
      <h2 className="text-label-md" style={{
        color: 'var(--on-surface-muted)',
        marginBottom: 'var(--sp-3)',
      }}>
        Ingredients ({ingredients.length})
      </h2>
      <div className="glass-card" style={{
        padding: 'var(--sp-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--sp-3)',
      }}>
        {ingredients.map((ing, i) => (
          <IngredientRow key={i} ingredient={ing} index={i} />
        ))}
      </div>
    </div>
  );
}
