import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import useAppStore from '../store/useAppStore.js';

export default function SplashPage() {
  const navigate = useNavigate();
  const { isAuthenticated, authLoading } = useAppStore();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress bar
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + 4, 100));
    }, 80);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (authLoading) return;

    const timer = setTimeout(() => {
      const onboarded = localStorage.getItem('scanandsee_onboarded');
      if (!onboarded) {
        navigate('/onboarding', { replace: true });
      } else if (!isAuthenticated) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    }, 2400);

    return () => clearTimeout(timer);
  }, [authLoading, isAuthenticated, navigate]);

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--void)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'var(--sp-8)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute',
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,255,65,0.08) 0%, transparent 70%)',
        animation: 'glowPulseGreen 3s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      {/* Logo */}
      <div className="anim-scale-in" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--sp-4)',
      }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: 'var(--r-xl)',
          background: 'var(--primary-bg)',
          border: '1.5px solid rgba(0,230,57,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--glow-green)',
        }}>
          <Zap size={40} color="var(--primary)" fill="var(--primary)" />
        </div>

        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(36px, 8vw, 52px)',
            fontWeight: 800,
            color: 'var(--primary)',
            letterSpacing: '0.04em',
            textShadow: '0 0 30px rgba(0,255,65,0.4)',
            lineHeight: 1,
          }}>
            ScanAndSee
          </h1>
          <p className="text-label" style={{
            color: 'var(--secondary)',
            marginTop: 'var(--sp-2)',
            letterSpacing: '0.2em',
          }}>
            AI NUTRITION INTELLIGENCE
          </p>
        </div>
      </div>

      {/* Loading bar */}
      <div className="anim-fade-in" style={{
        width: 200,
        height: 2,
        background: 'var(--surface-highest)',
        borderRadius: 'var(--r-full)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, var(--secondary), var(--primary))',
          borderRadius: 'var(--r-full)',
          transition: 'width 0.08s linear',
          boxShadow: '0 0 8px var(--primary)',
        }} />
      </div>

      <p className="text-label anim-blink" style={{
        color: 'var(--secondary)',
        letterSpacing: '0.15em',
        fontSize: 10,
      }}>
        INITIALIZING AI...
      </p>
    </div>
  );
}
