import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Reusable button component.
 * variant: 'primary' | 'outline' | 'ghost' | 'danger'
 * size: 'sm' | 'md' | 'lg'
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  onClick,
  type = 'button',
  className = '',
  style,
}) {
  const classes = [
    'btn',
    `btn-${variant}`,
    size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '',
    fullWidth ? 'btn-full' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      style={style}
    >
      {loading ? (
        <Loader2 size={14} className="anim-spin" />
      ) : icon ? (
        icon
      ) : null}
      {children}
    </button>
  );
}
