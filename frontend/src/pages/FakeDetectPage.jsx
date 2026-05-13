import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, ShieldX, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/layout/Navbar.jsx';
import BottomNav from '../components/layout/BottomNav.jsx';
import GlassCard from '../components/layout/GlassCard.jsx';
import UploadZone from '../components/scan/UploadZone.jsx';
import Button from '../components/ui/Button.jsx';
import { analyzeSupplement } from '../services/api.js';

// Fake detection reuses supplement analyzer — it's the best model for detecting
// fake/counterfeit products since it checks claims vs reality

export default function FakeDetectPage() {
  const [file,    setFile]    = useState(null);
  const [preview, setPreview] = useState(null);
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleFile = f => { setFile(f); setPreview(URL.createObjectURL(f)); setResult(null); };

  const handleDetect = async () => {
    if (!file) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const data = await analyzeSupplement(file);
      setResult(data);
    } catch (e) {
      setError(e.message || 'Detection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Determine fake likelihood from verdict + fake claims
  const getFakeLikelihood = () => {
    if (!result) return null;
    const fakeClaims = result.fake_claims?.length || 0;
    const dangerous  = result.dangerous_ingredients?.length || 0;
    if (result.verdict === 'AVOID' || fakeClaims >= 3) return { level: 'HIGH',     color: 'var(--error)',   icon: ShieldX };
    if (result.verdict === 'QUESTIONABLE' || fakeClaims >= 1) return { level: 'MODERATE', color: 'var(--warning)', icon: ShieldAlert };
    return { level: 'LOW', color: 'var(--primary)', icon: ShieldCheck };
  };

  const fakeLikelihood = getFakeLikelihood();
  const FakeIcon = fakeLikelihood?.icon;

  return (
    <div className="page">
      <Navbar showBack title="Fake Detection" showSettings={false} />

      <div className="container" style={{ paddingTop: 'var(--sp-6)', paddingBottom: 'var(--sp-12)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>

        <div className="anim-fade-up">
          <h1 className="text-headline">Fake Product Detection</h1>
          <p className="text-body-sm" style={{ color: 'var(--on-surface-muted)', marginTop: 'var(--sp-2)' }}>
            Detect counterfeit supplements, fake whey protein, and misleading products
          </p>
        </div>

        {/* What we check */}
        <GlassCard className="anim-fade-up stagger-2" style={{ borderColor: 'rgba(255,180,171,0.2)' }}>
          <p className="text-label-md" style={{ color: 'var(--error)', marginBottom: 'var(--sp-3)' }}>WHAT WE CHECK</p>
          {[
            'Label claims vs scientific evidence',
            'Protein content authenticity',
            'Hidden or dangerous ingredients',
            'Proprietary blend manipulation',
            'Overdose risks and safety concerns',
            'Value for money vs market standards',
          ].map((item, i) => (
            <p key={i} className="text-body-sm" style={{ color: 'var(--on-surface-muted)', marginBottom: 4 }}>
              <ShieldAlert size={11} color="var(--warning)" style={{ display: 'inline', marginRight: 6 }} />
              {item}
            </p>
          ))}
        </GlassCard>

        <div className="anim-fade-up stagger-3">
          <UploadZone onFileSelected={handleFile} preview={preview} />
        </div>

        {file && !loading && (
          <Button variant="primary" size="lg" fullWidth onClick={handleDetect} className="anim-scale-in">
            DETECT FAKE PRODUCT
          </Button>
        )}

        {loading && (
          <div className="flex-center" style={{ padding: 'var(--sp-8)', gap: 'var(--sp-3)' }}>
            <Loader2 size={28} color="var(--primary)" className="anim-spin" />
            <p className="text-label anim-blink" style={{ color: 'var(--secondary)', letterSpacing: '0.12em' }}>
              SCANNING FOR FAKE INDICATORS...
            </p>
          </div>
        )}

        {error && <p className="text-body-sm" style={{ color: 'var(--error)' }}>{error}</p>}

        {result && fakeLikelihood && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>

            {/* Fake likelihood verdict */}
            <GlassCard className="anim-scale-in" style={{
              textAlign: 'center', padding: 'var(--sp-6)',
              borderColor: `${fakeLikelihood.color}40`,
              background: `${fakeLikelihood.color}10`,
            }}>
              <FakeIcon size={44} color={fakeLikelihood.color} style={{ margin: '0 auto var(--sp-3)' }} />
              <h2 className="text-headline" style={{ color: 'var(--on-surface)' }}>{result.product_name}</h2>
              <p className="text-label" style={{ color: 'var(--on-surface-muted)', marginTop: 4 }}>{result.product_type}</p>
              <div style={{ marginTop: 'var(--sp-4)' }}>
                <p className="text-label-md" style={{ color: fakeLikelihood.color }}>
                  FAKE RISK: {fakeLikelihood.level}
                </p>
                <p className="text-body-sm" style={{ color: 'var(--on-surface-muted)', marginTop: 'var(--sp-2)' }}>
                  Overall product verdict: <strong style={{ color: fakeLikelihood.color }}>{result.verdict}</strong>
                </p>
              </div>
            </GlassCard>

            {/* Fake claims */}
            {result.fake_claims?.length > 0 && (
              <GlassCard className="anim-fade-up stagger-2" style={{ borderColor: 'rgba(255,180,171,0.3)' }}>
                <p className="text-label-md" style={{ color: 'var(--error)', marginBottom: 'var(--sp-3)' }}>
                  UNVERIFIED / FAKE CLAIMS ({result.fake_claims.length})
                </p>
                {result.fake_claims.map((claim, i) => (
                  <div key={i} style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-2)' }}>
                    <AlertTriangle size={13} color="var(--error)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <p className="text-body-sm" style={{ color: 'var(--on-surface)' }}>{claim}</p>
                  </div>
                ))}
              </GlassCard>
            )}

            {/* Hidden ingredients */}
            {result.hidden_ingredients?.length > 0 && (
              <GlassCard className="anim-fade-up stagger-3" style={{ borderColor: 'rgba(255,209,102,0.3)' }}>
                <p className="text-label-md" style={{ color: 'var(--warning)', marginBottom: 'var(--sp-3)' }}>HIDDEN INGREDIENTS</p>
                {result.hidden_ingredients.map((ing, i) => (
                  <p key={i} className="text-body-sm" style={{ color: 'var(--on-surface)', marginBottom: 4 }}>⚠ {ing}</p>
                ))}
              </GlassCard>
            )}

            {/* Actual benefits — what IS real */}
            {result.actual_benefits?.length > 0 && (
              <GlassCard className="anim-fade-up stagger-3" style={{ borderColor: 'rgba(0,230,57,0.2)' }}>
                <p className="text-label-md" style={{ color: 'var(--primary)', marginBottom: 'var(--sp-3)' }}>WHAT IS ACTUALLY REAL</p>
                {result.actual_benefits.map((b, i) => (
                  <div key={i} style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-2)' }}>
                    <CheckCircle2 size={13} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <p className="text-body-sm" style={{ color: 'var(--on-surface)' }}>{b}</p>
                  </div>
                ))}
              </GlassCard>
            )}

            {/* Overdose risks */}
            {result.overdose_risks?.length > 0 && (
              <GlassCard className="anim-fade-up stagger-4" style={{ borderColor: 'rgba(255,180,171,0.3)' }}>
                <p className="text-label-md" style={{ color: 'var(--error)', marginBottom: 'var(--sp-3)' }}>OVERDOSE RISKS</p>
                {result.overdose_risks.map((r, i) => (
                  <p key={i} className="text-body-sm" style={{ color: 'var(--on-surface)', marginBottom: 4 }}>⚡ {r}</p>
                ))}
              </GlassCard>
            )}

            {/* Alternatives */}
            {result.alternatives?.length > 0 && (
              <GlassCard className="anim-fade-up stagger-4">
                <p className="text-label-md" style={{ color: 'var(--on-surface-muted)', marginBottom: 'var(--sp-3)' }}>SAFER ALTERNATIVES</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
                  {result.alternatives.map((a, i) => <span key={i} className="chip chip-cyan">{a}</span>)}
                </div>
              </GlassCard>
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
