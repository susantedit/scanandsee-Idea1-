import React from 'react';
import { motion } from 'framer-motion';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  icon = null,
  ...props
}) {
  const baseClasses = 'font-semibold rounded-lg transition-all duration-200 flex items-center gap-2';

  const variants = {
    primary: 'bg-gradient-to-r from-accent to-accent-dim text-bg-primary hover:shadow-glow-accent',
    secondary: 'border border-cyan text-cyan hover:bg-cyan/10 hover:shadow-glow',
    ghost: 'text-text-secondary hover:text-text-primary hover:bg-white/5',
    danger: 'bg-danger text-white hover:shadow-lg',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3 text-lg',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      disabled={disabled}
      className={`
        ${baseClasses}
        ${variants[variant]}
        ${sizes[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      {...props}
    >
      {icon}
      {children}
    </motion.button>
  );
}

export default Button;
