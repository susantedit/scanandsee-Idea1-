import React, { useState } from 'react';
import { Dumbbell, ShieldCheck, ShieldAlert, ShieldX, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/layout/Navbar.jsx';
import BottomNav from '../components/layout/BottomNav.jsx';
import GlassCard from '../components/layout/GlassCard.jsx';
import UploadZone from '../components/scan/UploadZone.jsx';
import Button from '../components/ui/Button.jsx';
import { analyzeSupplement } from '../services/api.js';

const VERDICT_CONFIG = {
  LEGIT:        { color: 'var(--primary)',   icon: ShieldCheck,  bg: 'var(--primary-bg)' },
  QUESTIONABLE: { color: 'var(--warning)',   icon: ShieldAlert,  bg: 'var(--warning-bg)' },
  AVOID:        { color: 'var(--error)',     icon: ShieldX,      bg: 'var(--error-bg)' },
};

function ScoreBar({ label, value, max = 10, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span className="text-label" style={{ color: 'var(--on-surface-muted)', fontSize: 10 }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color }}>{value}/{max}</span>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{
          width: `${(value / max) * 100}%`,
          background: color,
          boxShadow: `0 0 6px ${color}`,
          transition: 'width 1s ease-out',
        }} />
      </div>
    </div>
  );
}

export default function SupplementPage() {
  const [file,    setFile]    = useState(null);
  const [preview, setPreview] = useState(null);
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleFile = f => { setFile(f); setPreview(URL.createObjectURL(f)); setResult(null); };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const data = await analyzeSupplement(file);
      setResult(data);
    } catch (e) {
      setError(e.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verdictCfg = result ? (VERDICT_CONFIG[result.verdict] || VERDICT_CONFIG.QUESTIONABLE) : null;
  const VerdictIcon = verdictCfg?.icon;

  return (
    <div className="page">
      <Navbar showBack title="Supplement Analyzer" showSettings={false} />

      <div className="container" style={{ paddingTop: 'var(--sp-6)', paddingBottom: 'var(--sp-12)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>

        <div className="anim-fade-up">
          <h1 className="text-headline">Smart Supplement Analyzer</h1>
          <p className="text-body-sm" style={{ color: 'var(--on-surface-muted)', marginTop: 'var(--sp-2)' }}>
            Scan whey, creatine, pre-workout, vitamins — detect fake claims and hidden risks
          </p>
        </div>

        <div className="anim-fade-up stagger-2">
          <UploadZone onFileSelected={handleFile} preview={preview} />
        </div>

        {file && !loading && (
          <Button variant="primary" size="lg" fullWidth onClick={handleAnalyze} className="anim-scale-in">
            ANALYZE SUPPLEMENT
          </Button>
        )}

        {loading && (
          <div className="flex-center" style={{ padding: 'var(--sp-8)', gap: 'var(--sp-3)' }}>
            <Loader2 size={28} color="var(--primary)" className="anim-spin" />
            <p className="text-label anim-blink" style={{ color: 'var(--secondary)', letterSpacing: '0.12em' }}>
              DEEP SCANNING SUPPLEMENT...
            </p>
          </div>
        )}

        {error && <p className="text-body-sm" style={{ color: 'var(--error)' }}>{error}</p>}

        {result && verdictCfg && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>

            {/* Verdict hero */}
            <GlassCard className="anim-scale-in" style={{ textAlign: 'center', padding: 'var(--sp-6)', borderColor: `${verdictCfg.color}40`, background: verdictCfg.bg }}>
              <VerdictIcon size={40} color={verdictCfg.color} style={{ margin: '0 auto var(--sp-3)' }} />
              <h2 className="text-headline" style={{ color: 'var(--on-surface)' }}>{result.product_name}</h2>
              <p className="text-label" style={{ color: 'var(--on-surface-muted)', marginTop: 4 }}>{result.product_type}</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--sp-3)', marginTop: 'var(--sp-4)' }}>
                <span className="chip" style={{ background: verdictCfg.bg, color: verdictCfg.color, border: `1px solid ${verdictCfg.color}40`, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                  {result.verdict}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: verdictCfg.color }}>
                  {result.overall_score}/10
                </span>
              </div>
            </GlassCard>

            {/* Protein quality */}
            {result.protein_quality && (
              <GlassCard className="anim-fade-up stagger-2">
                <p className="text-label-md" style={{ color: 'var(--on-surface-muted)', marginBottom: 'var(--sp-4)' }}>PROTEIN QUALITY</p>
                <div style={{ display: 'flex', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Type',          val: result.protein_quality.type },
                    { label: 'Amino Profile', val: result.protein_quality.amino_profile },
                    { label: 'Value',         val: result.value_for_money },
                  ].map(({ label, val }) => (
                    <div key={label} style={{ background: 'var(--surface-high)', borderRadius: 'var(--r-md)', padding: '6px 12px' }}>
                      <p className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 9 }}>{label}</p>
                      <p className="text-body-sm" style={{ color: 'var(--on-surface)', fontWeight: 600 }}>{val}</p>
                    </div>
                  ))}
                </div>
                <ScoreBar label="Protein Quality Score" value={result.protein_quality.score} color="var(--tertiary)" />
                {result.protein_quality.notes && (
                  <p className="text-body-sm" style={{ color: 'var(--on-surface-muted)', marginTop: 'var(--sp-3)' }}>{result.protein_quality.notes}</p>
                )}
              </GlassCard>
            )}

            {/* Fake claims */}
            {result.fake_claims?.length > 0 && (
              <GlassCard className="anim-fade-up stagger-3 anim-glow-error" style={{ borderColor: 'rgba(255,180,171,0.3)' }}>
                <p className="text-label-md" style={{ color: 'var(--error)', marginBottom: 'var(--sp-3)' }}>
                  ⚠ FAKE / UNSUPPORTED CLAIMS
                </p>
                {result.fake_claims.map((claim, i) => (
                  <div key={i} style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-2)', alignItems: 'flex-start' }}>
                    <AlertTriangle size={13} color="var(--error)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <p className="text-body-sm" style={{ color: 'var(--on-surface)' }}>{claim}</p>
                  </div>
                ))}
              </GlassCard>
            )}

            {/* Dangerous ingredients */}
            {result.dangerous_ingredients?.length > 0 && (
              <GlassCard className="anim-fade-up stagger-3" style={{ borderColor: 'rgba(255,180,171,0.3)' }}>
                <p className="text-label-md" style={{ color: 'var(--error)', marginBottom: 'var(--sp-3)' }}>DANGEROUS INGREDIENTS</p>
                {result.dangerous_ingredients.map((ing, i) => (
                  <div key={i} style={{ marginBottom: 'var(--sp-3)', borderBottom: '1px solid var(--glass-border)', paddingBottom: 'var(--sp-2)' }}>
                    <p className="text-body-sm" style={{ color: 'var(--error)', fontWeight: 600 }}>{ing.name}</p>
                    <p className="text-label" style={{ color: 'var(--on-surface-muted)', fontSize: 9 }}>{ing.risk}</p>
                    <p className="text-label" style={{ color: 'var(--warning)', fontSize: 9 }}>Dose concern: {ing.dose_concern}</p>
                  </div>
                ))}
              </GlassCard>
            )}

            {/* Actual benefits */}
            {result.actual_benefits?.length > 0 && (
              <GlassCard className="anim-fade-up stagger-4" style={{ borderColor: 'rgba(0,230,57,0.2)' }}>
                <p className="text-label-md" style={{ color: 'var(--primary)', marginBottom: 'var(--sp-3)' }}>SCIENCE-BACKED BENEFITS</p>
                {result.actual_benefits.map((b, i) => (
                  <div key={i} style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-2)' }}>
                    <CheckCircle2 size={13} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <p className="text-body-sm" style={{ color: 'var(--on-surface)' }}>{b}</p>
                  </div>
                ))}
              </GlassCard>
            )}

            {/* Dosage + best for + avoid if */}
            <GlassCard className="anim-fade-up stagger-4">
              <p className="text-label-md" style={{ color: 'var(--on-surface-muted)', marginBottom: 'var(--sp-4)' }}>USAGE GUIDE</p>
              {result.recommended_dose && (
                <div style={{ marginBottom: 'var(--sp-3)' }}>
                  <p className="text-label" style={{ color: 'var(--secondary)', fontSize: 10 }}>RECOMMENDED DOSE</p>
                  <p className="text-body-sm" style={{ color: 'var(--on-surface)', marginTop: 2 }}>{result.recommended_dose}</p>
                </div>
              )}
              {result.best_for?.length > 0 && (
                <div style={{ marginBottom: 'var(--sp-3)' }}>
                  <p className="text-label" style={{ color: 'var(--primary)', fontSize: 10 }}>BEST FOR</p>
                  {result.best_for.map((b, i) => <p key={i} className="text-body-sm" style={{ color: 'var(--on-surface)', marginTop: 2 }}>✓ {b}</p>)}
                </div>
              )}
              {result.avoid_if?.length > 0 && (
                <div>
                  <p className="text-label" style={{ color: 'var(--error)', fontSize: 10 }}>AVOID IF</p>
                  {result.avoid_if.map((a, i) => <p key={i} className="text-body-sm" style={{ color: 'var(--on-surface)', marginTop: 2 }}>✗ {a}</p>)}
                </div>
              )}
            </GlassCard>

            {/* Alternatives */}
            {result.alternatives?.length > 0 && (
              <GlassCard className="anim-fade-up stagger-5">
                <p className="text-label-md" style={{ color: 'var(--on-surface-muted)', marginBottom: 'var(--sp-3)' }}>BETTER ALTERNATIVES</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
                  {result.alternatives.map((a, i) => <span key={i} className="chip chip-cyan">{a}</span>)}
                </div>
              </GlassCard>
            )}

            {result.voice_explanation && (
              <p className="text-body-sm anim-fade-up stagger-6" style={{ color: 'var(--on-surface-muted)', fontStyle: 'italic', textAlign: 'center' }}>
                "{result.voice_explanation}"
              </p>
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
