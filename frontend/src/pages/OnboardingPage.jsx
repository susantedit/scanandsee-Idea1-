import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanLine, Brain, Mic } from 'lucide-react';
import GlassCard from '../components/layout/GlassCard.jsx';
import Button from '../components/ui/Button.jsx';
import ProgressRing from '../components/ui/ProgressRing.jsx';
import VoiceWaveform from '../components/ui/VoiceWaveform.jsx';

const SLIDES = [
  {
    icon: ScanLine,
    iconColor: 'var(--primary)',
    title: 'Scan Any Food',
    desc: 'Point your camera at any food, meal, supplement, or packaged product. Our AI reads it instantly.',
    accent: 'var(--primary)',
  },
  {
    icon: Brain,
    iconColor: 'var(--secondary)',
    title: 'Instant AI Analysis',
    desc: 'Get a full nutritional breakdown, ingredient safety check, and health score in seconds.',
    accent: 'var(--secondary)',
    showRing: true,
  },
  {
    icon: Mic,
    iconColor: 'var(--tertiary)',
    title: 'Your AI Nutrition Coach',
    desc: 'Choose your AI personality — Doctor, Gym Bro, Coach, or Savage Roast — and get voice-powered guidance.',
    accent: 'var(--tertiary)',
    showWave: true,
  },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);

  const handleNext = () => {
    if (slide < SLIDES.length - 1) {
      setSlide(s => s + 1);
    } else {
      handleGetStarted();
    }
  };

  const handleGetStarted = () => {
    localStorage.setItem('scanandsee_onboarded', 'true');
    navigate('/setup');
  };

  const current = SLIDES[slide];
  const Icon = current.icon;

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      padding: 'var(--sp-8) var(--margin-mobile)',
    }}>
      {/* Skip */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleGetStarted}
          className="btn btn-ghost btn-sm"
          style={{ color: 'var(--on-surface-dim)' }}
        >
          SKIP
        </button>
      </div>

      {/* Slide content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--sp-8)',
      }}>
        <GlassCard className="anim-scale-in" style={{
          width: '100%',
          maxWidth: 360,
          textAlign: 'center',
          borderColor: `${current.accent}30`,
        }}>
          {/* Icon / visual */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 'var(--sp-6)',
          }}>
            {current.showRing ? (
              <ProgressRing score={8.5} size={120} animate />
            ) : current.showWave ? (
              <div style={{ padding: 'var(--sp-4)' }}>
                <VoiceWaveform isPlaying color={current.iconColor} height={48} />
              </div>
            ) : (
              <div style={{
                width: 80,
                height: 80,
                borderRadius: 'var(--r-xl)',
                background: `${current.accent}15`,
                border: `1.5px solid ${current.accent}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 20px ${current.accent}30`,
              }}>
                <Icon size={36} color={current.iconColor} />
              </div>
            )}
          </div>

          <h2 className="text-headline" style={{ color: 'var(--on-surface)', marginBottom: 'var(--sp-3)' }}>
            {current.title}
          </h2>
          <p className="text-body" style={{ color: 'var(--on-surface-muted)' }}>
            {current.desc}
          </p>
        </GlassCard>

        {/* Pagination dots */}
        <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              style={{
                width: i === slide ? 24 : 8,
                height: 8,
                borderRadius: 'var(--r-full)',
                background: i === slide ? 'var(--primary)' : 'var(--surface-highest)',
                border: 'none',
                cursor: 'pointer',
                transition: 'width var(--t-spring), background var(--t-base)',
                boxShadow: i === slide ? 'var(--glow-sm-green)' : 'none',
              }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ paddingBottom: 'var(--sp-8)' }}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleNext}
        >
          {slide < SLIDES.length - 1 ? 'NEXT' : 'GET STARTED'}
        </Button>
      </div>
    </div>
  );
}
