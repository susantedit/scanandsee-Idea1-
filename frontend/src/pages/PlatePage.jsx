import React, { useState } from 'react';
import { Plus, Loader2, ChefHat } from 'lucide-react';
import Navbar from '../components/layout/Navbar.jsx';
import BottomNav from '../components/layout/BottomNav.jsx';
import GlassCard from '../components/layout/GlassCard.jsx';
import UploadZone from '../components/scan/UploadZone.jsx';
import Button from '../components/ui/Button.jsx';
import { buildPlate } from '../services/api.js';
import { scoreToColor } from '../utils/scoreColor.js';

export default function PlatePage() {
  const [fileA,    setFileA]    = useState(null);
  const [fileB,    setFileB]    = useState(null);
  const [previewA, setPreviewA] = useState(null);
  const [previewB, setPreviewB] = useState(null);
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleFileA = f => { setFileA(f); setPreviewA(URL.createObjectURL(f)); setResult(null); };
  const handleFileB = f => { setFileB(f); setPreviewB(URL.createObjectURL(f)); setResult(null); };

  const handleBuild = async () => {
    if (!fileA) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const data = await buildPlate(fileA, fileB);
      setResult(data);
    } catch (e) {
      setError(e.message || 'Failed to build plate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const { color } = result ? scoreToColor(result.overall_score) : { color: 'var(--primary)' };

  return (
    <div className="page">
      <Navbar showBack title="Build My Plate" showSettings={false} />

      <div className="container" style={{ paddingTop: 'var(--sp-6)', paddingBottom: 'var(--sp-12)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>

        <div className="anim-fade-up">
          <h1 className="text-headline">Build My Plate AI</h1>
          <p className="text-body-sm" style={{ color: 'var(--on-surface-muted)', marginTop: 'var(--sp-2)' }}>
            Scan 1-2 foods and AI will create the optimal meal combination
          </p>
        </div>

        {/* Upload zones */}
        <div className="anim-fade-up stagger-2" style={{ display: 'flex', gap: 'var(--sp-4)' }}>
          <div style={{ flex: 1 }}>
            <p className="text-label" style={{ color: 'var(--secondary)', fontSize: 10, marginBottom: 'var(--sp-2)' }}>FOOD 1 *</p>
            <UploadZone onFileSelected={handleFileA} preview={previewA} />
          </div>
          <div style={{ flex: 1 }}>
            <p className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 10, marginBottom: 'var(--sp-2)' }}>FOOD 2 (optional)</p>
            <UploadZone onFileSelected={handleFileB} preview={previewB} />
          </div>
        </div>

        {fileA && !loading && (
          <Button variant="primary" size="lg" fullWidth onClick={handleBuild} className="anim-scale-in">
            BUILD OPTIMAL PLATE
          </Button>
        )}

        {loading && (
          <div className="flex-center" style={{ padding: 'var(--sp-8)' }}>
            <Loader2 size={28} color="var(--primary)" className="anim-spin" />
            <p className="text-label anim-blink" style={{ color: 'var(--secondary)', marginLeft: 'var(--sp-3)', letterSpacing: '0.12em' }}>
              AI BUILDING YOUR PLATE...
            </p>
          </div>
        )}

        {error && <p className="text-body-sm" style={{ color: 'var(--error)' }}>{error}</p>}

        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
            {/* Meal name + score */}
            <GlassCard className="anim-scale-in" style={{ textAlign: 'center', padding: 'var(--sp-6)', borderColor: `${color}40` }}>
              <ChefHat size={28} color={color} style={{ margin: '0 auto var(--sp-3)' }} />
              <h2 className="text-headline" style={{ color: 'var(--on-surface)' }}>{result.meal_name}</h2>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--sp-2)', marginTop: 'var(--sp-3)' }}>
                <span className="chip" style={{ background: `${color}20`, color, border: `1px solid ${color}40`, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                  {result.combination_verdict}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color }}>{result.overall_score}/10</span>
              </div>
            </GlassCard>

            {/* Total nutrition */}
            {result.total_nutrition && (
              <GlassCard className="anim-fade-up stagger-2">
                <p className="text-label-md" style={{ color: 'var(--on-surface-muted)', marginBottom: 'var(--sp-4)' }}>COMBINED NUTRITION</p>
                <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Calories', val: result.total_nutrition.calories, color: 'var(--primary)' },
                    { label: 'Protein',  val: `${result.total_nutrition.protein_g}g`, color: 'var(--tertiary)' },
                    { label: 'Carbs',    val: `${result.total_nutrition.carbs_g}g`,   color: 'var(--secondary)' },
                    { label: 'Fats',     val: `${result.total_nutrition.fats_g}g`,    color: 'var(--warning)' },
                  ].map(({ label, val, color: c }) => (
                    <div key={label} style={{ background: 'var(--surface-high)', borderRadius: 'var(--r-md)', padding: '6px 12px', textAlign: 'center', flex: 1 }}>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: c }}>{val}</p>
                      <p className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 9 }}>{label}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* How to combine */}
            {result.how_to_combine && (
              <GlassCard className="anim-fade-up stagger-3" style={{ borderColor: 'rgba(0,230,57,0.2)' }}>
                <p className="text-label-md" style={{ color: 'var(--primary)', marginBottom: 'var(--sp-3)' }}>HOW TO COMBINE</p>
                <p className="text-body" style={{ color: 'var(--on-surface)' }}>{result.how_to_combine}</p>
              </GlassCard>
            )}

            {/* Portion guide */}
            {result.portion_guide?.length > 0 && (
              <GlassCard className="anim-fade-up stagger-3">
                <p className="text-label-md" style={{ color: 'var(--on-surface-muted)', marginBottom: 'var(--sp-4)' }}>PORTION GUIDE</p>
                {result.portion_guide.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--sp-3)', borderBottom: '1px solid var(--glass-border)', paddingBottom: 'var(--sp-2)' }}>
                    <div>
                      <p className="text-body-sm" style={{ color: 'var(--on-surface)', fontWeight: 600 }}>{p.food}</p>
                      <p className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 9 }}>{p.reason}</p>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--secondary)' }}>{p.recommended_portion}</span>
                  </div>
                ))}
              </GlassCard>
            )}

            {/* Add these */}
            {result.add_these?.length > 0 && (
              <GlassCard className="anim-fade-up stagger-4">
                <p className="text-label-md" style={{ color: 'var(--on-surface-muted)', marginBottom: 'var(--sp-3)' }}>BOOST YOUR PLATE</p>
                {result.add_these.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)', alignItems: 'flex-start' }}>
                    <Plus size={14} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <p className="text-body-sm" style={{ color: 'var(--primary)', fontWeight: 600 }}>{item.item}</p>
                      <p className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 9 }}>{item.benefit} · {item.cost}</p>
                    </div>
                  </div>
                ))}
              </GlassCard>
            )}

            {result.voice_explanation && (
              <p className="text-body-sm anim-fade-up stagger-5" style={{ color: 'var(--on-surface-muted)', fontStyle: 'italic', textAlign: 'center' }}>
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
