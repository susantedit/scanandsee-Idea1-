# ScanAndSee — Design System Reference: Cyber-Vitality

> Quick-reference file for the Cyber-Vitality design system. Import this as CSS custom properties.

---

## CSS Custom Properties (copy into `variables.css`)

```css
:root {
  /* ═══════════════════════════════════════════════
     CYBER-VITALITY DESIGN SYSTEM
     ScanAndSee — AI Nutrition Assistant
     ═══════════════════════════════════════════════ */

  /* ── Foundation ────────────────────────────── */
  --color-background:         #131315;
  --color-surface:            #131315;
  --color-surface-dim:        #131315;
  --color-surface-bright:     #39393b;
  --color-surface-lowest:     #0e0e10;
  --color-surface-low:        #1c1b1d;
  --color-surface-container:  #201f21;
  --color-surface-high:       #2a2a2c;
  --color-surface-highest:    #353437;
  --color-surface-variant:    #353437;
  --color-void:               #050505;

  /* ── Text ──────────────────────────────────── */
  --color-on-surface:         #e5e1e4;
  --color-on-surface-variant: #b9ccb2;
  --color-inverse-surface:    #e5e1e4;
  --color-inverse-on-surface: #313032;

  /* ── Borders ───────────────────────────────── */
  --color-outline:            #84967e;
  --color-outline-variant:    #3b4b37;
  --color-surface-tint:       #00e639;
  --color-glass-border:       rgba(255, 255, 255, 0.15);

  /* ── Primary — Electric Green ──────────────── */
  --color-primary:              #ebffe2;
  --color-on-primary:           #003907;
  --color-primary-container:    #00ff41;
  --color-on-primary-container: #007117;
  --color-inverse-primary:      #006e16;
  --color-primary-fixed:        #72ff70;
  --color-primary-fixed-dim:    #00e639;

  /* ── Secondary — Cyber Cyan ────────────────── */
  --color-secondary:              #d3fbff;
  --color-on-secondary:           #00363a;
  --color-secondary-container:    #00eefc;
  --color-on-secondary-container: #00686f;
  --color-secondary-fixed:        #7df4ff;
  --color-secondary-fixed-dim:    #00dbe9;

  /* ── Tertiary — Neon Magenta ───────────────── */
  --color-tertiary:              #fff7f9;
  --color-on-tertiary:           #5e0053;
  --color-tertiary-container:    #ffcfee;
  --color-on-tertiary-container: #b1009f;
  --color-tertiary-fixed:        #ffd7f0;
  --color-tertiary-fixed-dim:    #fface8;

  /* ── Error ─────────────────────────────────── */
  --color-error:              #ffb4ab;
  --color-on-error:           #690005;
  --color-error-container:    #93000a;
  --color-on-error-container: #ffdad6;

  /* ── Glows ─────────────────────────────────── */
  --glow-primary:   0 0 8px rgba(0, 255, 65, 0.5);
  --glow-secondary: 0 0 8px rgba(0, 238, 252, 0.5);
  --glow-tertiary:  0 0 8px rgba(255, 172, 232, 0.5);
  --glow-error:     0 0 8px rgba(255, 180, 171, 0.5);
  --glow-primary-lg:   0 0 15px rgba(0, 255, 65, 0.6);
  --glow-secondary-lg: 0 0 15px rgba(0, 238, 252, 0.6);

  /* ── Typography ────────────────────────────── */
  --font-display:  'Sora', sans-serif;
  --font-body:     'Hanken Grotesk', sans-serif;
  --font-mono:     'Space Mono', monospace;

  /* ── Border Radius ─────────────────────────── */
  --radius-sm:   2px;
  --radius:      4px;
  --radius-md:   6px;
  --radius-lg:   8px;
  --radius-xl:   12px;
  --radius-full: 9999px;

  /* ── Spacing ───────────────────────────────── */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-12: 48px;
  --space-16: 64px;
  --gutter:         16px;
  --margin-mobile:  20px;
  --margin-desktop: 40px;
  --container-max:  1280px;

  /* ── Glass Properties ──────────────────────── */
  --glass-bg:     rgba(32, 31, 33, 0.4);
  --glass-blur:   20px;
  --glass-border: 1px solid rgba(255, 255, 255, 0.15);

  /* ── Transitions ───────────────────────────── */
  --transition-default: 300ms ease-out;
  --transition-fast:    200ms ease;
  --transition-spring:  400ms cubic-bezier(0.34, 1.56, 0.64, 1);

  /* ── Z-Index Scale ─────────────────────────── */
  --z-base:     1;
  --z-mid:      10;
  --z-top:      100;
  --z-overlay:  500;
  --z-modal:    1000;
  --z-holo:     9999;
}
```

---

## Google Fonts Import

```css
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;700;800&family=Hanken+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;500;700&display=swap');
```

---

## Utility Classes

```css
/* Glassmorphism */
.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: var(--glass-border);
  border-radius: var(--radius-xl);
}

/* Glow effects */
.glow-primary   { box-shadow: var(--glow-primary); }
.glow-secondary { box-shadow: var(--glow-secondary); }
.glow-tertiary  { box-shadow: var(--glow-tertiary); }
.glow-error     { box-shadow: var(--glow-error); }

/* Clipped-corner button */
.clip-btn {
  clip-path: polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%);
}

/* Typography */
.text-display   { font-family: var(--font-display); font-size: 48px; font-weight: 800; line-height: 1.1; letter-spacing: 0.05em; }
.text-headline  { font-family: var(--font-display); font-size: 32px; font-weight: 700; line-height: 1.2; letter-spacing: 0.02em; }
.text-body      { font-family: var(--font-body);    font-size: 16px; font-weight: 400; line-height: 1.6; letter-spacing: 0.01em; }
.text-label     { font-family: var(--font-mono);    font-size: 12px; font-weight: 500; line-height: 1.4; letter-spacing: 0.1em; text-transform: uppercase; }

/* Holographic overlay (apply to pseudo-elements) */
.holo-grid::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 238, 252, 0.03) 2px,
    rgba(0, 238, 252, 0.03) 4px
  );
  pointer-events: none;
  z-index: var(--z-holo);
}
```

---

## Icon Library

Use **Lucide React** (`lucide-react` package). Key icons needed:

| Usage | Icon Name |
|---|---|
| Home | `Home` |
| Scan | `ScanLine` or `Camera` |
| History | `Clock` |
| Compare | `GitCompare` |
| Profile | `User` |
| Settings | `Settings` |
| Back | `ArrowLeft` |
| Flash | `Zap` |
| Gallery | `Image` |
| Play/Pause | `Play`, `Pause` |
| Microphone | `Mic` |
| Warning | `AlertTriangle` |
| Safe | `ShieldCheck` |
| Protein | `Dumbbell` |
| Heart | `Heart` |
| Share | `Share2` |
| Save | `Bookmark` |
| Trophy | `Trophy` |
| Fire/Calories | `Flame` |
| Brain | `Brain` |
| Moon/Sleep | `Moon` |
