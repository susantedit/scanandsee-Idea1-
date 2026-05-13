import React, { useState } from 'react';
import { UtensilsCrossed, Loader2 } from 'lucide-react';
import Navbar from '../components/layout/Navbar.jsx';
import BottomNav from '../components/layout/BottomNav.jsx';
import GlassCard from '../components/layout/GlassCard.jsx';
import UploadZone from '../components/scan/UploadZone.jsx';
import Button from '../components/ui/Button.jsx';
import HealthScoreHero from '../components/results/HealthScoreHero.jsx';
import MacroBreakdown from '../components/results/MacroBreakdown.jsx';
import MealImprovement from '../components/results/MealImprovement.jsx';
import DangerAlert from '../components/ui/DangerAlert.jsx';
import { analyzeScan } from '../services/api.js';
import useAppStore from '../store/useAppStore.js';

export default function RestaurantPage() {
  const { getPersona, getGoal } = useAppStore();
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
      // Reuse the main scan endpoint — Gemini handles restaurant meals naturally
      const data = await analyzeScan(file, false, getGoal(), getPersona());
      setResult(data);
    } catch (e) {
      setError(e.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <Navbar showBack title="Restaurant Scanner" showSettings={false} />

      <div className="container" style={{ paddingTop: 'var(--sp-6)', paddingBottom: 'var(--sp-12)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>

        <div className="anim-fade-up">
          <h1 className="text-headline">Restaurant Food Scanner</h1>
          <p className="text-body-sm" style={{ color: 'var(--on-surface-muted)', marginTop: 'var(--sp-2)' }}>
            Photo your restaurant meal — AI estimates calories, oil, protein and hidden ingredients
          </p>
        </div>

        {/* Tips */}
        <GlassCard className="anim-fade-up stagger-2" style={{ borderColor: 'rgba(0,219,233,0.2)' }}>
          <p className="text-label-md" style={{ color: 'var(--secondary)', marginBottom: 'var(--sp-3)' }}>TIPS FOR BEST RESULTS</p>
          {[
            'Take photo from directly above the plate',
            'Include the full plate in frame',
            'Good lighting helps AI identify ingredients',
            'Works with any cuisine — local or international',
          ].map((tip, i) => (
            <p key={i} className="text-body-sm" style={{ color: 'var(--on-surface-muted)', marginBottom: 4 }}>→ {tip}</p>
          ))}
        </GlassCard>

        <div className="anim-fade-up stagger-3">
          <UploadZone onFileSelected={handleFile} preview={preview} />
        </div>

        {file && !loading && (
          <Button variant="primary" size="lg" fullWidth onClick={handleAnalyze} className="anim-scale-in">
            ANALYZE RESTAURANT MEAL
          </Button>
        )}

        {loading && (
          <div className="flex-center" style={{ padding: 'var(--sp-8)', gap: 'var(--sp-3)' }}>
            <Loader2 size={28} color="var(--primary)" className="anim-spin" />
            <p className="text-label anim-blink" style={{ color: 'var(--secondary)', letterSpacing: '0.12em' }}>
              ESTIMATING MEAL NUTRITION...
            </p>
          </div>
        )}

        {error && <p className="text-body-sm" style={{ color: 'var(--error)' }}>{error}</p>}

        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
            <HealthScoreHero scan={result} />
            <MacroBreakdown scan={result} />
            {result.warnings?.length > 0 && (
              <div>
                <p className="text-label-md" style={{ color: 'var(--error)', marginBottom: 'var(--sp-3)' }}>
                  Health Warnings
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                  {result.warnings.map((w, i) => <DangerAlert key={i} warning={w} index={i} />)}
                </div>
              </div>
            )}
            <MealImprovement improvements={result.improvements} />

            {/* Restaurant-specific note */}
            <GlassCard style={{ borderColor: 'rgba(255,209,102,0.2)' }}>
              <p className="text-label-md" style={{ color: 'var(--warning)', marginBottom: 'var(--sp-2)' }}>NOTE</p>
              <p className="text-body-sm" style={{ color: 'var(--on-surface-muted)' }}>
                Restaurant meal estimates are approximate. Actual values vary by portion size, cooking method, and restaurant. Use as a guide, not an exact measurement.
              </p>
            </GlassCard>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
