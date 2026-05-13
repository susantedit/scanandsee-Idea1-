import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingDown, Dumbbell, TrendingUp, Scissors,
  Salad, Activity, GraduationCap, Stethoscope,
  Zap, Trophy, Flame, User,
} from 'lucide-react';
import GlassCard from '../components/layout/GlassCard.jsx';
import Button from '../components/ui/Button.jsx';
import ScanInput from '../components/ui/ScanInput.jsx';
import { signInWithGoogle } from '../services/firebase.js';
import { saveProfile } from '../services/api.js';
import useAppStore from '../store/useAppStore.js';

const GOALS = [
  { id: 'weight_loss',    label: 'Weight Loss',       icon: TrendingDown },
  { id: 'muscle_gain',    label: 'Muscle Gain',        icon: Dumbbell },
  { id: 'bulking',        label: 'Bulking',            icon: TrendingUp },
  { id: 'cutting',        label: 'Cutting',            icon: Scissors },
  { id: 'healthy_eating', label: 'Healthy Eating',     icon: Salad },
  { id: 'diabetic',       label: 'Diabetic-Friendly',  icon: Activity },
  { id: 'student_budget', label: 'Student Budget',     icon: GraduationCap },
];

const PERSONAS = [
  { id: 'doctor',       label: 'Dr. Nutrition', icon: Stethoscope, color: 'var(--secondary)' },
  { id: 'gym_bro',      label: 'Gym Bro',       icon: Dumbbell,    color: 'var(--tertiary)' },
  { id: 'coach',        label: 'Coach',         icon: Trophy,      color: 'var(--primary)' },
  { id: 'savage_roast', label: 'Savage Roast',  icon: Flame,       color: 'var(--error)' },
];

export default function SetupPage() {
  const navigate = useNavigate();
  const { setUser, setProfile } = useAppStore();

  const [goal,     setGoal]     = useState('healthy_eating');
  const [persona,  setPersona]  = useState('coach');
  const [age,      setAge]      = useState('');
  const [weight,   setWeight]   = useState('');
  const [activity, setActivity] = useState('moderate');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleContinue = async () => {
    setLoading(true);
    setError('');
    try {
      // Sign in with Google
      const firebaseUser = await signInWithGoogle();
      setUser({
        uid:         firebaseUser.uid,
        email:       firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL:    firebaseUser.photoURL,
      });

      // Save profile to backend
      const profileData = {
        name:          firebaseUser.displayName || '',
        goal,
        aiPersona:     persona,
        activityLevel: activity,
        age:           age ? parseInt(age) : null,
        weight:        weight ? parseFloat(weight) : null,
        weightUnit:    'kg',
      };

      await saveProfile(profileData);
      setProfile(profileData);
      navigate('/home', { replace: true });
    } catch (err) {
      setError(err.message || 'Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg)',
      padding: 'var(--sp-8) var(--margin-mobile)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--sp-8)',
      maxWidth: 480,
      margin: '0 auto',
    }}>
      <div>
        <h1 className="text-headline anim-fade-up">Configure Your AI</h1>
        <p className="text-body anim-fade-up stagger-2" style={{ color: 'var(--on-surface-muted)', marginTop: 'var(--sp-2)' }}>
          Personalize your nutrition intelligence
        </p>
      </div>

      {/* Goal selector */}
      <div className="anim-fade-up stagger-2">
        <p className="text-label-md" style={{ color: 'var(--on-surface-muted)', marginBottom: 'var(--sp-3)' }}>
          Your Goal
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--sp-3)' }}>
          {GOALS.map(({ id, label, icon: Icon }) => (
            <GlassCard
              key={id}
              padding="p-4"
              onClick={() => setGoal(id)}
              style={{
                cursor: 'pointer',
                borderColor: goal === id ? 'rgba(0,230,57,0.5)' : 'var(--glass-border)',
                boxShadow: goal === id ? 'var(--glow-sm-green)' : 'none',
                transition: 'all var(--t-base)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--sp-2)',
              }}
            >
              <Icon size={16} color={goal === id ? 'var(--primary)' : 'var(--on-surface-dim)'} />
              <span className="text-body-sm" style={{
                color: goal === id ? 'var(--primary)' : 'var(--on-surface)',
                fontWeight: goal === id ? 600 : 400,
              }}>
                {label}
              </span>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* AI Persona */}
      <div className="anim-fade-up stagger-3">
        <p className="text-label-md" style={{ color: 'var(--on-surface-muted)', marginBottom: 'var(--sp-3)' }}>
          AI Voice Personality
        </p>
        <div className="scroll-x">
          {PERSONAS.map(({ id, label, icon: Icon, color }) => (
            <button
              key={id}
              onClick={() => setPersona(id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--sp-2)',
                padding: 'var(--sp-3) var(--sp-4)',
                background: persona === id ? `${color}15` : 'var(--surface)',
                border: `1.5px solid ${persona === id ? color : 'var(--glass-border)'}`,
                borderRadius: 'var(--r-lg)',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all var(--t-base)',
                boxShadow: persona === id ? `0 0 12px ${color}40` : 'none',
              }}
            >
              <Icon size={20} color={persona === id ? color : 'var(--on-surface-dim)'} />
              <span className="text-label" style={{
                color: persona === id ? color : 'var(--on-surface-muted)',
                fontSize: 10,
              }}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Profile inputs */}
      <div className="anim-fade-up stagger-4" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
        <p className="text-label-md" style={{ color: 'var(--on-surface-muted)' }}>
          Profile (Optional)
        </p>
        <ScanInput
          label="Age"
          type="number"
          name="age"
          value={age}
          onChange={e => setAge(e.target.value)}
          placeholder="e.g. 25"
          min="10"
          max="120"
        />
        <ScanInput
          label="Weight (kg)"
          type="number"
          name="weight"
          value={weight}
          onChange={e => setWeight(e.target.value)}
          placeholder="e.g. 70"
          min="20"
          max="500"
        />
      </div>

      {error && (
        <p className="text-body-sm" style={{ color: 'var(--error)' }}>{error}</p>
      )}

      {/* CTA */}
      <Button
        variant="primary"
        size="lg"
        fullWidth
        loading={loading}
        onClick={handleContinue}
        className="anim-fade-up stagger-5"
      >
        SIGN IN WITH GOOGLE & START
      </Button>

      <p className="text-label" style={{
        textAlign: 'center',
        color: 'var(--on-surface-dim)',
        fontSize: 10,
      }}>
        Free forever · No credit card · All APIs free tier
      </p>
    </div>
  );
}
