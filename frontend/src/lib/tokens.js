// Premium cinematic design tokens
export const tokens = {
  colors: {
    // Primary brand
    accent: '#00e639', // neon green
    accentDim: '#00b82b',

    // Dark theme (deep space)
    bg: {
      primary: '#0a0a0d',
      secondary: '#1a1a1f',
      tertiary: '#242429',
    },

    // Accents
    cyan: '#00eefc',
    magenta: '#ff0080',
    neon: '#ffff00',

    // Text
    text: {
      primary: '#e5e1e4',
      secondary: '#b9b9b9',
      tertiary: '#6e6e70',
    },

    // Status
    success: '#00d974',
    warning: '#ffb81c',
    danger: '#ff3b30',
    info: '#00eefc',
  },

  typography: {
    fontFamily: {
      sora: "'Sora', 'Inter', sans-serif",
      grotesk: "'Space Grotesk', sans-serif",
      mono: "'Space Mono', monospace",
    },

    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
    },

    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },

    lineHeight: {
      tight: 1.1,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    6: '1.5rem',
    8: '2rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    32: '8rem',
  },

  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
    md: '0 4px 6px rgba(0, 0, 0, 0.6)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.7)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.8)',
    glow: '0 0 20px rgba(0, 238, 252, 0.3)',
    glowAccent: '0 0 30px rgba(0, 230, 57, 0.3)',
  },

  animations: {
    transition: {
      fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
      base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
      slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
};

// CSS variables generator
export const generateCSSVariables = () => {
  const vars = {};
  for (const [key, value] of Object.entries(tokens.colors)) {
    if (typeof value === 'object') {
      for (const [subKey, subValue] of Object.entries(value)) {
        vars[`--color-${key}-${subKey}`] = subValue;
      }
    } else {
      vars[`--color-${key}`] = value;
    }
  }
  return vars;
};
