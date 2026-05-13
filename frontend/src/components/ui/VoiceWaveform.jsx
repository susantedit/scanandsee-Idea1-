import React from 'react';

const WAVE_ANIMS = ['wave1','wave2','wave3','wave4','wave5','wave6','wave7','wave8'];

/**
 * Animated voice waveform visualizer.
 * Shows animated bars when playing, flat bars when paused.
 */
export default function VoiceWaveform({ isPlaying = false, color = 'var(--secondary)', height = 32 }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        height,
      }}
      aria-hidden="true"
    >
      {WAVE_ANIMS.map((anim, i) => (
        <div
          key={i}
          style={{
            width: 3,
            height: isPlaying ? undefined : 4,
            borderRadius: 2,
            background: color,
            boxShadow: isPlaying ? `0 0 4px ${color}` : 'none',
            animation: isPlaying ? `${anim} ${0.6 + i * 0.08}s ease-in-out infinite` : 'none',
            transition: 'height 0.2s ease',
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}
