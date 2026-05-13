import React, { useEffect, useRef } from 'react';
import { scoreToColor } from '../../utils/scoreColor.js';

/**
 * Animated SVG health score ring.
 * Fills from 0 to score on mount.
 */
export default function ProgressRing({
  score = 0,
  size = 160,
  strokeWidth = 10,
  showLabel = true,
  animate = true,
}) {
  const circleRef = useRef(null);
  const { color, glow } = scoreToColor(score);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const targetDash = (score / 10) * circumference;

  useEffect(() => {
    if (!circleRef.current || !animate) return;

    // Start at 0
    circleRef.current.style.strokeDashoffset = circumference;

    // Animate to target
    const timer = setTimeout(() => {
      if (circleRef.current) {
        circleRef.current.style.transition = 'stroke-dashoffset 1.5s ease-out';
        circleRef.current.style.strokeDashoffset = circumference - targetDash;
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [score, circumference, targetDash, animate]);

  const gradientId = `ring-gradient-${Math.round(score * 10)}`;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg
        width={size}
        height={size}
        style={{ transform: 'rotate(-90deg)' }}
        aria-label={`Health score: ${score} out of 10`}
        role="img"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#00eefc" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>

        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-highest)"
          strokeWidth={strokeWidth}
        />

        {/* Progress */}
        <circle
          ref={circleRef}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animate ? circumference : circumference - targetDash}
          style={{
            filter: `drop-shadow(0 0 6px ${color})`,
          }}
        />
      </svg>

      {/* Center content */}
      {showLabel && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: size * 0.22,
            fontWeight: 800,
            color,
            textShadow: glow.replace('box-shadow', 'text-shadow'),
            lineHeight: 1,
          }}>
            {score.toFixed(1)}
          </span>
          <span className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 9 }}>
            / 10
          </span>
        </div>
      )}
    </div>
  );
}
