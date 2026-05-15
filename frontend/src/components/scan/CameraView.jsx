import React, { useEffect } from 'react';
import { Camera, Zap, ZapOff, FlipHorizontal } from 'lucide-react';
import { useCamera } from '../../hooks/useCamera.js';
import ScanOverlay from './ScanOverlay.jsx';
import ParticleBurst from '../ui/ParticleBurst.jsx';

export default function CameraView({ onCapture, isAnalyzing = false, live: liveProp, onLiveChange, liveResult = null, gymMode = false }) {
  const { videoRef, isActive, error, startCamera, stopCamera, capturePhoto, flipCamera } = useCamera();
  const [flash, setFlash] = React.useState(false);
  const [burst, setBurst] = React.useState(false);
  // Support controlled `live` prop; fall back to internal state when not provided
  const [internalLive, setInternalLive] = React.useState(false);
  const live = typeof liveProp === 'boolean' ? liveProp : internalLive;
  const setLive = (v) => {
    if (typeof onLiveChange === 'function') onLiveChange(v);
    if (typeof liveProp !== 'boolean') setInternalLive(v);
  };
  const liveRef = React.useRef(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

    // Live scanning: periodically capture frames and call onCapture when enabled.
  useEffect(() => {
    // Don't start live loop unless enabled and camera active
    if (!live || !isActive) return undefined;

    let cancelled = false;

    const intervalMs = 3000; // throttle captures to once every 3s

    const tick = async () => {
      if (cancelled) return;
      if (isAnalyzing) return; // respect parent analysis state
      try {
        const file = await capturePhoto();
        if (file && !cancelled) onCapture(file, { live: true });
      } catch (e) {
        // ignore capture errors — will show camera error elsewhere
      }
    };
    

    // Start immediate then interval
    tick();
    liveRef.current = setInterval(tick, intervalMs);

    return () => {
      cancelled = true;
      if (liveRef.current) clearInterval(liveRef.current);
      liveRef.current = null;
    };
  }, [live, isActive, isAnalyzing, capturePhoto, onCapture]);

  const handleCapture = async () => {
    setBurst(true);
    setTimeout(() => setBurst(false), 1000);
    const file = await capturePhoto();
    if (file) onCapture(file, { live: false });
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
      {isActive && <ScanOverlay isAnalyzing={isAnalyzing} liveResult={liveResult} gymMode={gymMode} />}

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
        <button
          onClick={() => setLive(l => !l)}
          className="btn btn-ghost btn-icon glass"
          style={{ color: live ? 'var(--secondary)' : 'var(--on-surface-muted)', display: 'flex', alignItems: 'center', gap: 6 }}
          aria-pressed={live}
          aria-label="Toggle live scanning"
        >
          {live ? <Zap size={18} /> : <ZapOff size={18} />}
        </button>

        {/* Live indicator */}
        <div aria-hidden style={{ display: 'flex', alignItems: 'center', paddingLeft: 6 }}>
          <div style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: live ? 'var(--secondary)' : 'rgba(255,255,255,0.08)',
            boxShadow: live ? '0 0 8px rgba(0,219,233,0.6)' : 'none',
            transition: 'all 200ms ease',
          }} />
        </div>
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
