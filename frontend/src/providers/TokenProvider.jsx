import React, { useEffect } from 'react';
import { tokens } from '../lib/tokens';

// Apply design tokens as CSS variables
export function TokenProvider({ children }) {
  useEffect(() => {
    const root = document.documentElement;
    const vars = tokens.generateCSSVariables?.() || {};

    // Set color tokens
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Set typography tokens
    root.style.setProperty('--font-sora', tokens.typography.fontFamily.sora);
    root.style.setProperty('--font-grotesk', tokens.typography.fontFamily.grotesk);
    root.style.setProperty('--font-mono', tokens.typography.fontFamily.mono);

    // Set spacing scale
    Object.entries(tokens.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--space-${key}`, value);
    });

    // Set shadows
    Object.entries(tokens.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value);
    });
  }, []);

  return <>{children}</>;
}
