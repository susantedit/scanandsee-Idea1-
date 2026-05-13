import React, { useEffect } from 'react';
import { Camera, Zap, ZapOff, FlipHorizontal } from 'lucide-react';
import { useCamera } from '../../hooks/useCamera.js';
import ScanOverlay from './ScanOverlay.jsx';
import ParticleBurst from '../ui/ParticleBurst.jsx';

export default function CameraView({ onCapture, isAnalyzing = false }) {
  const { videoRef, isActive, error, startCamera, stopCamera, capturePhoto, flipCamera } = useCamera();
  const [flash, setFlash] = React.useState(false);
  const [burst, setBurst] = React.useState(false);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const handleCapture = async () => {
    setBurst(true);
    setTimeout(() => setBurst(false), 1000);
    const file = await capturePhoto();
    if (file) onCapture(file);
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      background: 'var(--void)',
      overflow: 'hidden',
    }}>
      {/* Video feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: isActive ? 'block' : 'none',
        }}
      />

      {/* Error state */}
      {error && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--sp-4)',
          padding: 'var(--sp-8)',
          textAlign: 'center',
        }}>
          <Camera size={48} color="var(--on-surface-dim)" />
          <p className="text-body" style={{ color: 'var(--on-surface-muted)' }}>{error}</p>
        </div>
      )}

      {/* HUD Overlay */}
      {isActive && <ScanOverlay isAnalyzing={isAnalyzing} />}

      {/* Particle burst */}
      <ParticleBurst trigger={burst} />

      {/* Top controls */}
      <div style={{
        position: 'absolute',
        top: 'var(--sp-4)',
        right: 'var(--sp-4)',
        display: 'flex',
        gap: 'var(--sp-2)',
        zIndex: 20,
      }}>
        <button
          onClick={() => setFlash(f => !f)}
          className="btn btn-ghost btn-icon glass"
          style={{ color: flash ? 'var(--warning)' : 'var(--on-surface-muted)' }}
          aria-label="Toggle flash"
        >
          {flash ? <Zap size={18} /> : <ZapOff size={18} />}
        </button>
        <button
          onClick={flipCamera}
          className="btn btn-ghost btn-icon glass"
          style={{ color: 'var(--on-surface-muted)' }}
          aria-label="Flip camera"
        >
          <FlipHorizontal size={18} />
        </button>
      </div>

      {/* Capture button */}
      {isActive && !isAnalyzing && (
        <div style={{
          position: 'absolute',
          bottom: 'var(--sp-8)',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
        }}>
          <button
            onClick={handleCapture}
            aria-label="Capture photo"
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              border: '3px solid var(--primary)',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--glow-green)',
              transition: 'transform var(--t-fast)',
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.93)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{
              width: 54,
              height: 54,
              borderRadius: '50%',
              background: 'white',
            }} />
          </button>
        </div>
      )}
    </div>
  );
}
