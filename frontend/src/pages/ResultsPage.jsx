import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Play, Pause, Bookmark, GitCompare, MessageCircle, Loader2, Users } from 'lucide-react';
import Navbar from '../components/layout/Navbar.jsx';
import BottomNav from '../components/layout/BottomNav.jsx';
import GlassCard from '../components/layout/GlassCard.jsx';
import HealthScoreHero from '../components/results/HealthScoreHero.jsx';
import MacroBreakdown from '../components/results/MacroBreakdown.jsx';
import IngredientList from '../components/results/IngredientList.jsx';
import MealImprovement from '../components/results/MealImprovement.jsx';
import FitnessAssessment from '../components/results/FitnessAssessment.jsx';
import ShareCard from '../components/results/ShareCard.jsx';
import MoodAnalysis from '../components/results/MoodAnalysis.jsx';
import FunFacts from '../components/results/FunFacts.jsx';
import BodyConsequences from '../components/results/BodyConsequences.jsx';
import DangerAlert from '../components/ui/DangerAlert.jsx';
import VoiceWaveform from '../components/ui/VoiceWaveform.jsx';
import Chip from '../components/ui/Chip.jsx';
import Button from '../components/ui/Button.jsx';
import { useVoice } from '../hooks/useVoice.js';
import { getScan } from '../services/api.js';
import { shareScan } from '../services/community.js';
import useAppStore from '../store/useAppStore.js';
import { PERSONA_LABELS } from '../utils/formatNutrition.js';

function isFoodType(scan) {
  const t = scan?.object_type;
  if (!t) return true;
  return ['food', 'packaged_food', 'supplement'].includes(t);
}

export default function ResultsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const scanId = searchParams.get('scanId');

  const { currentScan, addToHistory, gymMode, getPersona } = useAppStore();
  const { speak, stop, toggle, isPlaying, isSupported } = useVoice();

  const [scan,    setScan]    = useState(currentScan);
  const [loading, setLoading] = useState(!currentScan && !!scanId);
  const [saved,   setSaved]   = useState(!!scanId);
  const [shared,  setShared]  = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (scanId && !currentScan) {
      getScan(scanId)
        .then(data => setScan({
          ...data,
          food_name:          data.foodName,
          health_score:       data.healthScore,
          protein_g:          data.protein,
          carbs_g:            data.carbs,
          fats_g:             data.fats,
          sugar_g:            data.sugar,
          sodium_mg:          data.sodium,
          fiber_g:            data.fiber,
          voice_explanation:  data.voiceExplanation,
          gym_assessment:     data.gymAssessment,
          object_type:        data.objectType || 'food',
          confidence:         data.confidence ?? 80,
          description:        data.description || '',
          fun_facts:          data.funFacts || [],
          body_consequences:  data.bodyConsequences || [],
          score_reason:       data.scoreReason || '',
        }))
        .catch(() => setError('Could not load scan.'))
        .finally(() => setLoading(false));
    }
  }, [scanId, currentScan]);

  useEffect(() => {
    if (!scan?.voice_explanation || !isSupported) return;
    const t = setTimeout(() => speak(scan.voice_explanation, { rate: 1.0, pitch: 1.0 }), 800);
    return () => { clearTimeout(t); stop(); };
  }, [scan?.voice_explanation]);

  const handleSave = () => {
    if (!scan) return;
    addToHistory({
      id: scan.scanId || scanId, foodName: scan.food_name,
      healthScore: scan.health_score, verdict: scan.verdict,
      calories: scan.calories, imageUrl: scan.imageUrl, createdAt: new Date(),
    });
    setSaved(true);
  };

  if (loading) return (
    <div className="page flex-center">
      <Loader2 size={32} color="var(--primary)" className="anim-spin" />
    </div>
  );

  if (error || !scan) return (
    <div className="page flex-center flex-col gap-4" style={{ padding: 'var(--sp-8)' }}>
      <p className="text-body" style={{ color: 'var(--error)' }}>{error || 'No scan data found.'}</p>
      <Button variant="outline" onClick={() => navigate('/scan')}>Scan Again</Button>
    </div>
  );

  const persona = getPersona();
  const isFood  = isFoodType(scan);

  return (
    <div className="page">
      <Navbar showBack title="Analysis" showSettings={false} />

      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-8)', paddingTop: 'var(--sp-4)', paddingBottom: 'var(--sp-12)' }}>

        {scan.confidence < 60 && (
          <div className="anim-fade-up" style={{ padding: 'var(--sp-3)', background: 'rgba(255,107,107,0.1)', border: '1px solid var(--error)', borderRadius: 'var(--r-md)', display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <p className="text-body-sm" style={{ color: 'var(--error)' }}>
              <strong>Not confident in scan.</strong> Try taking a clearer photo for accurate analysis.
            </p>
          </div>
        )}

        <HealthScoreHero scan={scan} />

        {/* Voice */}
        {scan.voice_explanation && (
          <GlassCard className="anim-fade-up stagger-2" padding="p-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
              <button onClick={() => toggle(scan.voice_explanation)}
                className="btn btn-primary btn-sm btn-icon"
                style={{ padding: '8px', borderRadius: '50%', clipPath: 'none' }}
                aria-label={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>
              <VoiceWaveform isPlaying={isPlaying} color="var(--secondary)" height={28} />
              <Chip variant="cyan">{PERSONA_LABELS[persona] || 'Coach'}</Chip>
            </div>
            <p className="text-body-sm" style={{ color: 'var(--on-surface-muted)', fontStyle: 'italic', lineHeight: 1.7 }}>
              "{scan.voice_explanation}"
            </p>
          </GlassCard>
        )}

        {/* BODY CONSEQUENCES — shown first, most impactful */}
        <div className="anim-fade-up stagger-2">
          <BodyConsequences
            consequences={scan.body_consequences}
            scoreReason={scan.score_reason}
          />
        </div>

        {/* Macros — food only */}
        {isFood && (
          <div className="anim-fade-up stagger-3">
            <MacroBreakdown scan={scan} />
          </div>
        )}

        {/* Warnings */}
        {scan.warnings?.length > 0 && (
          <div className="anim-fade-up stagger-4">
            <p className="text-label-md" style={{ color: 'var(--error)', marginBottom: 'var(--sp-3)' }}>
              Warnings ({scan.warnings.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              {scan.warnings.map((w, i) => <DangerAlert key={i} warning={w} index={i} />)}
            </div>
          </div>
        )}

        <div className="anim-fade-up stagger-4">
          <IngredientList ingredients={scan.ingredients} />
        </div>

        <div className="anim-fade-up stagger-5">
          <MealImprovement improvements={scan.improvements} />
        </div>

        <div className="anim-fade-up stagger-5">
          <FunFacts facts={scan.fun_facts} />
        </div>

        {isFood && gymMode && scan.gym_assessment && (
          <div className="anim-fade-up stagger-5">
            <FitnessAssessment gymAssessment={scan.gym_assessment} />
          </div>
        )}

        {isFood && (
          <div className="anim-fade-up stagger-5">
            <MoodAnalysis scan={scan} />
          </div>
        )}

        {/* Actions */}
        <div className="anim-fade-up stagger-6" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
            <Button variant={saved ? 'ghost' : 'primary'} icon={<Bookmark size={14} />}
              onClick={handleSave} style={{ flex: 1 }} disabled={saved}>
              {saved ? 'SAVED' : 'SAVE'}
            </Button>
            <Button variant="outline" icon={<GitCompare size={14} />}
              onClick={() => navigate('/compare')} style={{ flex: 1 }}>
              COMPARE
            </Button>
          </div>
          <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
            <Button variant="outline" icon={<MessageCircle size={14} />} style={{ flex: 1 }}
              onClick={() => navigate(`/chat?scanId=${scan.scanId || scanId || ''}`)}>
              ASK AI
            </Button>
            <Button variant={shared ? 'ghost' : 'outline'} icon={<Users size={14} />}
              style={{ flex: 1 }} disabled={shared || !(scan.scanId || scanId)}
              onClick={async () => {
                try { await shareScan(scan.scanId || scanId, ''); setShared(true); } catch {}
              }}>
              {shared ? 'SHARED' : 'COMMUNITY'}
            </Button>
          </div>
          <ShareCard scan={scan} />
        </div>

        <Button variant="ghost" fullWidth onClick={() => { stop(); navigate('/scan'); }}>
          SCAN ANOTHER OBJECT
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}
