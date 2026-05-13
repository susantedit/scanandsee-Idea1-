import React, { useEffect, useState } from 'react';

const COLORS = ['var(--primary)', 'var(--secondary)', 'var(--primary-bright)', 'var(--secondary-bright)'];

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

/**
 * Particle burst animation — fires when `trigger` becomes true.
 */
export default function ParticleBurst({ trigger = false, count = 14 }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (!trigger) return;

    const newParticles = Array.from({ length: count }, (_, i) => ({
      id:    i,
      angle: (360 / count) * i + randomBetween(-15, 15),
      dist:  randomBetween(40, 90),
      size:  randomBetween(3, 7),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      dur:   randomBetween(0.6, 1.0),
    }));

    setParticles(newParticles);
    const timer = setTimeout(() => setParticles([]), 1100);
    return () => clearTimeout(timer);
  }, [trigger, count]);

  if (!particles.length) return null;

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 'var(--z-overlay)',
    }}>
      {particles.map(p => {
        const rad = (p.angle * Math.PI) / 180;
        const tx  = Math.cos(rad) * p.dist;
        const ty  = Math.sin(rad) * p.dist;

        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              width:  p.size,
              height: p.size,
              borderRadius: '50%',
              background: p.color,
              boxShadow: `0 0 4px ${p.color}`,
              '--tx': `${tx}px`,
              '--ty': `${ty}px`,
              animation: `particleOut ${p.dur}s ease-out forwards`,
            }}
          />
        );
      })}
    </div>
  );
}
