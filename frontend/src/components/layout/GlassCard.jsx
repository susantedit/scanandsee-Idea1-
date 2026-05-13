import React from 'react';

/**
 * Reusable frosted glass card container.
 */
export default function GlassCard({
  children,
  className = '',
  padding = 'p-6',
  onClick,
  style,
  glow,
}) {
  const glowStyle = glow ? { boxShadow: glow } : {};

  return (
    <div
      className={`glass-card ${padding} ${className}`}
      style={{ ...glowStyle, ...style }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {children}
    </div>
  );
}
