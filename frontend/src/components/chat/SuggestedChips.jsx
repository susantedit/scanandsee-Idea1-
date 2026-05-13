11111111111111111111import React from 'react';

const DEFAULT_QUESTIONS = [
  'Can diabetics eat this?',
  'Good for weight loss?',
  'Can I eat this at night?',
  'Is this good pre-workout?',
  'What are the risks?',
  'Healthier alternatives?',
];

export default function SuggestedChips({ onSelect, suggestions = [] }) {
  const questions = suggestions.length ? suggestions : DEFAULT_QUESTIONS;

  return (
    <div className="scroll-x" style={{ padding: 'var(--sp-3) var(--sp-4)' }}>
      {questions.map((q, i) => (
        <button
          key={i}
          onClick={() => onSelect(q)}
          className="chip chip-cyan"
          style={{ cursor: 'pointer', border: 'none', flexShrink: 0 }}
        >
          {q}
        </button>
      ))}
    </div>
  );
}
