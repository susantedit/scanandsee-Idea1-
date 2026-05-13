import React from 'react';

/**
 * Nutrient / status chip.
 * variant: 'healthy' | 'moderate' | 'danger' | 'protein' | 'cyan' | 'default'
 */
export default function Chip({ children, variant = 'default', icon, onClick, className = '' }) {
  return (
    <span
      className={`chip chip-${variant} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </span>
  );
}
