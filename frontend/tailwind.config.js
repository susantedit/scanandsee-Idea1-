/** @type {import('tailwindcss').Config} */

export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand
        accent: '#00e639',
        'accent-dim': '#00b82b',

        // Backgrounds
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

      boxShadow: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
        md: '0 4px 6px rgba(0, 0, 0, 0.6)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.7)',
        xl: '0 20px 25px rgba(0, 0, 0, 0.8)',
        glow: '0 0 20px rgba(0, 238, 252, 0.3)',
        'glow-accent': '0 0 30px rgba(0, 230, 57, 0.3)',
      },

      backdropBlur: {
        xs: '2px',
        sm: '4px',
        base: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
      },

      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'scan-line': 'scan-line 8s linear infinite',
      },

      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
    },
  },
  plugins: [],
};
