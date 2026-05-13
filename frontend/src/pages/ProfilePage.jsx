import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, Dumbbell, TrendingDown, TrendingUp, Scissors,
  Salad, Activity, GraduationCap, Stethoscope, Trophy,
  Flame, User, Zap, Award, Target, Calendar,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar.jsx';
import BottomNav from '../components/layout/BottomNav.jsx';
import GlassCard from '../components/layout/GlassCard.jsx';
import Button from '../components/ui/Button.jsx';
import Chip from '../components/ui/Chip.jsx';
import ScanInput from '../components/ui/ScanInput.jsx';
import { signOut } from '../services/firebase.js';
import { getUserStats, saveProfile } from '../services/api.js';
import useAppStore from '../store/useAppStore.js';
import { GOAL_LABELS, PERSONA_LABELS } from '../utils/formatNutrition.js';

const GOAL_ICONS = {
  weight_loss:    TrendingDown,
  muscle_gain:    Dumbbell,
  bulking:        TrendingUp,
  cutting:        Scissors,
  healthy_eating: Salad,
  diabetic:       Activity,
  student_budget: GraduationCap,
};

const PERSONA_ICONS = {
  doctor:       Stethoscope,
  gym_bro:      Dumbbell,
  coach:        Trophy,
  savage_roast: Flame,
};

const PERSONA_COLORS = {
  doctor:       'var(--secondary)',
  gym_bro:      'var(--tertiary)',
  coach:        'var(--primary)',
  savage_roast: 'var(--error)',
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, setProfile, logout } = useAppStore();

  const [stats,   setStats]   = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [form,    setForm]    = useState({
    name:          profile?.name || '',
    age:           profile?.age  || '',
    weight:        profile?.weight || '',
    goal:          profile?.goal || 'healthy_eating',
    aiPersona:     profile?.aiPersona || 'coach',
    activityLevel: profile?.activityLevel || 'moderate',
  });

  useEffect(() => {
    getUserStats()
      .then(setStats)
      .catch(console.error);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveProfile({
        ...form,
        age:    form.age    ? parseInt(form.age)    : null,
        weight: form.weight ? parseFloat(form.weight) : null,
      });
      setProfile({ ...profile, ...form });
      setEditing(false);
    } catch (err) {
      console.error('Save profile error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    logout();
    navigate('/onboarding', { replace: true });
  };

  const GoalIcon    = GOAL_ICONS[profile?.goal]    || Target;
  const PersonaIcon = PERSONA_ICONS[profile?.aiPersona] || User;
  const personaColor = PERSONA_COLORS[profile?.aiPersona] || 'var(--primary)';

  return (
    <div className="page">
      <Navbar title="Profile" showSettings={false} />

      <div className="container" style={{ paddingTop: 'var(--sp-6)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)', paddingBottom: 'var(--sp-12)' }}>

        {/* Profile card */}
        <GlassCard className="anim-fade-up" padding="p-6">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
            {/* Avatar */}
            <div style={{
              width: 64,
              height: 64,
              borderRadius: 'var(--r-full)',
              background: 'var(--primary-bg)',
              border: '2px solid var(--primary)',
              overflow: 'hidden',
              flexShrink: 0,
              boxShadow: 'var(--glow-sm-green)',
            }}>
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={28} color="var(--primary)" />
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="text-title truncate" style={{ color: 'var(--on-surface)' }}>
                {profile?.name || user?.displayName || 'User'}
              </p>
              <p className="text-body-sm truncate" style={{ color: 'var(--on-surface-dim)', marginTop: 2 }}>
                {user?.email}
              </p>
              <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-2)', flexWrap: 'wrap' }}>
                {profile?.goal && (
                  <Chip variant="healthy" icon={<GoalIcon size={10} />}>
                    {GOAL_LABELS[profile.goal]}
                  </Chip>
                )}
                {profile?.aiPersona && (
                  <Chip variant="cyan" icon={<PersonaIcon size={10} />}>
                    {PERSONA_LABELS[profile.aiPersona]}
                  </Chip>
                )}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Stats */}
        {stats && (
          <div className="anim-fade-up stagger-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--sp-3)' }}>
            {[
              { icon: Zap,      label: 'Total Scans',  val: stats.totalScans },
              { icon: Award,    label: 'Avg Score',    val: stats.avgScore },
              { icon: Calendar, label: 'Day Streak',   val: stats.streak },
            ].map(({ icon: Icon, label, val }) => (
              <GlassCard key={label} padding="p-4" style={{ textAlign: 'center' }}>
                <Icon size={16} color="var(--primary)" style={{ margin: '0 auto var(--sp-2)' }} />
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: 'var(--primary)' }}>
                  {val}
                </p>
                <p className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 9, marginTop: 2 }}>
                  {label}
                </p>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Settings */}
        <GlassCard className="anim-fade-up stagger-3" padding="p-5">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-5)' }}>
            <p className="text-label-md" style={{ color: 'var(--on-surface-muted)' }}>Settings</p>
            <button
              onClick={() => editing ? handleSave() : setEditing(true)}
              className="btn btn-outline btn-sm"
              disabled={saving}
            >
              {saving ? 'SAVING...' : editing ? 'SAVE' : 'EDIT'}
            </button>
          </div>

          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
              <ScanInput
                label="Display Name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Your name"
              />
              <ScanInput
                label="Age"
                type="number"
                value={form.age}
                onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                placeholder="e.g. 25"
              />
              <ScanInput
                label="Weight (kg)"
                type="number"
                value={form.weight}
                onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
                placeholder="e.g. 70"
              />

              {/* Goal selector */}
              <div>
                <p className="text-label" style={{ color: 'var(--on-surface-dim)', marginBottom: 'var(--sp-2)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Goal
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
                  {Object.entries(GOAL_LABELS).map(([id, label]) => (
                    <button
                      key={id}
                      onClick={() => setForm(f => ({ ...f, goal: id }))}
                      className={`chip ${form.goal === id ? 'chip-healthy' : 'chip-default'}`}
                      style={{ cursor: 'pointer', border: 'none' }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Persona selector */}
              <div>
                <p className="text-label" style={{ color: 'var(--on-surface-dim)', marginBottom: 'var(--sp-2)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  AI Voice
                </p>
                <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
                  {Object.entries(PERSONA_LABELS).map(([id, label]) => (
                    <button
                      key={id}
                      onClick={() => setForm(f => ({ ...f, aiPersona: id }))}
                      className={`chip ${form.aiPersona === id ? 'chip-cyan' : 'chip-default'}`}
                      style={{ cursor: 'pointer', border: 'none' }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setEditing(false)}
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--on-surface-dim)' }}
              >
                CANCEL
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              {[
                { label: 'Goal',          val: GOAL_LABELS[profile?.goal] || '—' },
                { label: 'AI Voice',      val: PERSONA_LABELS[profile?.aiPersona] || '—' },
                { label: 'Activity',      val: profile?.activityLevel || '—' },
                { label: 'Weight Unit',   val: profile?.weightUnit || 'kg' },
              ].map(({ label, val }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 10 }}>{label}</span>
                  <span className="text-body-sm" style={{ color: 'var(--on-surface)' }}>{val}</span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* About */}
        <GlassCard className="anim-fade-up stagger-4" padding="p-5">
          <p className="text-label-md" style={{ color: 'var(--on-surface-muted)', marginBottom: 'var(--sp-4)' }}>About</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            {[
              { label: 'Version',  val: '1.0.0' },
              { label: 'AI Model', val: 'Gemini 2.0 Flash' },
              { label: 'Tier',     val: profile?.tier === 'premium' ? 'Premium' : 'Free' },
            ].map(({ label, val }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 10 }}>{label}</span>
                <span className="text-body-sm" style={{ color: 'var(--on-surface)' }}>{val}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Sign out */}
        <Button
          variant="danger"
          fullWidth
          icon={<LogOut size={14} />}
          onClick={handleLogout}
          className="anim-fade-up stagger-5"
        >
          SIGN OUT
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}
