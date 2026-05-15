import React from 'react';
import { motion } from 'framer-motion';

export function Section({
  children,
  className = '',
  id = '',
  fullScreen = false,
  dark = true,
  heroGradient = false,
  skewBg = false,
}) {
  const bgClasses = dark
    ? 'bg-bg-primary'
    : 'bg-gradient-to-b from-bg-secondary to-bg-primary';

  return (
    <section
      id={id}
      className={`
        ${fullScreen ? 'min-h-screen' : 'py-16 md:py-24'}
        ${bgClasses}
        relative overflow-hidden
        ${className}
      `}
    >
      {/* Gradient accent (optional) */}
      {heroGradient && (
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
        </div>
      )}

      {/* Skew background (optional) */}
      {skewBg && (
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-45deg from-cyan to-accent skew-y-12" />
        </div>
      )}

      {/* Grid overlay (subtle) */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 grid-glow" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </section>
  );
}

export default Section;
