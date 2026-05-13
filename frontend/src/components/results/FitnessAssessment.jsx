import React from 'react';
import { ThumbsUp, ThumbsDown, Dumbbell } from 'lucide-react';

function FitBadge({ label, value }) {
  const color = value ? 'var(--primary)' : 'var(--on-surface-dim)';
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sp-2)',
      padding: 'var(--sp-2) var(--sp-3)',
      background: value ? 'var(--primary-bg)' : 'var(--surface-high)',
      borderRadius: 'var(--r-md)',
      border: `1px solid ${value ? 'rgba(0,230,57,0.25)' : 'var(--glass-border)'}`,
    }}>
      {value
        ? <ThumbsUp size={13} color={color} />
        : <ThumbsDown size={13} color={color} />
      }
      <span className="text-label" style={{ color, fontSize: 10 }}>{label}</span>
    </div>
  );
}

function ScoreBar({ label, value, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span className="text-label" style={{ color: 'var(--on-surface-muted)', fontSize: 10 }}>
          {label}
        </span>
        <span className="text-label" style={{ color, fontSize: 10 }}>
          {value}/10
        </span>
      </div>
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{
            width: `${(value / 10) * 100}%`,
            background: color,
            boxShadow: `0 0 6px ${color}`,
          }}
        />
      </div>
    </div>
  );
}

export default function FitnessAssessment({ gymAssessment }) {
  if (!gymAssessment) return null;

  const {
    good_for_bulking, good_for_cutting,
    pre_workout, post_workout,
    protein_quality_score, muscle_recovery_score,
    gym_notes,
  } = gymAssessment;

  return (
    <div>
      <h2 className="text-label-md" style={{
        color: 'var(--on-surface-muted)',
        marginBottom: 'var(--sp-3)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--sp-2)',
      }}>
        <Dumbbell size={14} />
        Gym Assessment
      </h2>
      <div className="glass-card" style={{ padding: 'var(--sp-5)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
        {/* Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
          <FitBadge label="Bulking"      value={good_for_bulking} />
          <FitBadge label="Cutting"      value={good_for_cutting} />
          <FitBadge label="Pre-Workout"  value={pre_workout} />
          <FitBadge label="Post-Workout" value={post_workout} />
        </div>

        {/* Score bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          <ScoreBar label="Protein Quality"   value={protein_quality_score}  color="var(--tertiary)" />
          <ScoreBar label="Muscle Recovery"   value={muscle_recovery_score}  color="var(--secondary)" />
        </div>

        {gym_notes && (
          <p className="text-body-sm" style={{ color: 'var(--on-surface-muted)', fontStyle: 'italic' }}>
            {gym_notes}
          </p>
        )}
      </div>
    </div>
  );
}
