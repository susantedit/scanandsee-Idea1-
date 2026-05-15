import React from 'react';

/**
 * Holographic scan overlay — corner brackets + sweep beam + grid.
 */
export default function ScanOverlay({ isAnalyzing = false, liveResult = null, gymMode = false }) {
  const bracketStyle = (pos) => ({
    position: 'absolute',
    width: 28,
    height: 28,
    ...pos,
    animation: isAnalyzing ? 'bracketSnap 0.4s cubic-bezier(0.34,1.56,0.64,1) both' : 'none',
  });

  const lineColor = 'var(--primary)';
  const lw = 3;

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 10,
    }}>
      {/* Holographic grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(0,238,252,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,238,252,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }} />

      {/* Scan beam */}
      <div style={{
        position: 'absolute',
        left: 0,
        right: 0,
        height: 2,
        background: 'linear-gradient(90deg, transparent, var(--secondary), var(--secondary-bright), var(--secondary), transparent)',
        boxShadow: '0 0 12px var(--secondary)',
        animation: 'scanBeam 2.5s linear infinite',
        top: 0,
      }} />

      {/* Corner brackets */}
      {/* Top-left */}
      <svg style={bracketStyle({ top: 20, left: 20 })} viewBox="0 0 28 28">
        <path d={`M0 14 L0 0 L14 0`} fill="none" stroke={lineColor} strokeWidth={lw} strokeLinecap="round" />
      </svg>
      {/* Top-right */}
      <svg style={bracketStyle({ top: 20, right: 20 })} viewBox="0 0 28 28">
        <path d={`M14 0 L28 0 L28 14`} fill="none" stroke={lineColor} strokeWidth={lw} strokeLinecap="round" />
      </svg>
      {/* Bottom-left */}
      <svg style={bracketStyle({ bottom: 20, left: 20 })} viewBox="0 0 28 28">
        <path d={`M0 14 L0 28 L14 28`} fill="none" stroke={lineColor} strokeWidth={lw} strokeLinecap="round" />
      </svg>
      {/* Bottom-right */}
      <svg style={bracketStyle({ bottom: 20, right: 20 })} viewBox="0 0 28 28">
        <path d={`M14 28 L28 28 L28 14`} fill="none" stroke={lineColor} strokeWidth={lw} strokeLinecap="round" />
      </svg>

      {/* Analyzing text */}
      {isAnalyzing && (
        <div style={{
          position: 'absolute',
          bottom: 60,
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.15em',
          color: 'var(--secondary)',
          textShadow: '0 0 8px var(--secondary)',
          animation: 'blink 1.2s steps(2) infinite',
        }}>
          ANALYZING...
        </div>
      )}

      {/* Live result card */}
      {liveResult && (
        <div style={{
          position: 'absolute',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(10,10,12,0.75)',
          border: '1px solid rgba(255,255,255,0.04)',
          padding: '10px 14px',
          borderRadius: 12,
          zIndex: 30,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          minWidth: 220,
          maxWidth: 360,
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            background: 'linear-gradient(135deg, var(--primary), var(--primary-bright))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary-text)',
            fontWeight: 700,
          }}>
            {Math.round((liveResult.score || 0) * 10)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: 'var(--on-surface)' }}>{liveResult.food || 'Food'}</div>
            <div style={{ fontSize: 13, color: 'var(--on-surface-muted)' }}>{liveResult.verdict || ''}</div>
            {liveResult.badges && liveResult.badges.length > 0 && (
              <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                {liveResult.badges.map((b, i) => (
                  <span key={i} style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: 'rgba(255,255,255,0.1)',
                    color: b.color || 'var(--on-surface)',
                  }}>
                    {b.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
