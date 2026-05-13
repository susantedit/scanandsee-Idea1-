import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, RotateCcw } from 'lucide-react';
import Navbar from '../components/layout/Navbar.jsx';
import BottomNav from '../components/layout/BottomNav.jsx';
import GlassCard from '../components/layout/GlassCard.jsx';
import UploadZone from '../components/scan/UploadZone.jsx';
import ComparisonTable from '../components/comparison/ComparisonTable.jsx';
import ProgressRing from '../components/ui/ProgressRing.jsx';
import Button from '../components/ui/Button.jsx';
import { compareProducts } from '../services/api.js';
import { scoreToColor } from '../utils/scoreColor.js';

function ProductPanel({ label, file, preview, onFileSelected, result, color }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
      <p className="text-label" style={{ color, fontSize: 10, letterSpacing: '0.12em' }}>
        PRODUCT {label}
      </p>

      {result ? (
        <GlassCard padding="p-4" style={{ borderColor: `${color}30` }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--sp-3)' }}>
            {preview && (
              <img
                src={preview}
                alt={result.name}
                style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 'var(--r-md)' }}
              />
            )}
            <ProgressRing score={result.health_score} size={80} strokeWidth={7} />
            <p className="text-title" style={{ color: 'var(--on-surface)', textAlign: 'center' }}>
              {result.name}
            </p>
            <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap', justifyContent: 'center' }}>
              {[
                { label: 'Cal',     val: result.calories },
                { label: 'Protein', val: `${result.protein_g}g` },
                { label: 'Sugar',   val: `${result.sugar_g}g` },
              ].map(({ label: l, val }) => (
                <div key={l} style={{
                  background: 'var(--surface-high)',
                  borderRadius: 'var(--r-md)',
                  padding: '4px 10px',
                  textAlign: 'center',
                }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--on-surface)' }}>{val}</p>
                  <p className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 9 }}>{l}</p>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      ) : (
        <UploadZone onFileSelected={onFileSelected} preview={preview} />
      )}
    </div>
  );
}

export default function ComparisonPage() {
  const navigate = useNavigate();

  const [fileA,    setFileA]    = useState(null);
  const [fileB,    setFileB]    = useState(null);
  const [previewA, setPreviewA] = useState(null);
  const [previewB, setPreviewB] = useState(null);
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleFileA = (f) => { setFileA(f); setPreviewA(URL.createObjectURL(f)); setResult(null); };
  const handleFileB = (f) => { setFileB(f); setPreviewB(URL.createObjectURL(f)); setResult(null); };

  const handleCompare = async () => {
    if (!fileA || !fileB) return;
    setLoading(true);
    setError('');
    try {
      const data = await compareProducts(fileA, fileB);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Comparison failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFileA(null); setFileB(null);
    setPreviewA(null); setPreviewB(null);
    setResult(null); setError('');
  };

  return (
    <div className="page">
      <Navbar showBack title="Compare" showSettings={false} />

      <div className="container" style={{ paddingTop: 'var(--sp-6)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)', paddingBottom: 'var(--sp-12)' }}>

        <div className="anim-fade-up">
          <h1 className="text-headline">Product Comparison</h1>
          <p className="text-body-sm" style={{ color: 'var(--on-surface-muted)', marginTop: 'var(--sp-2)' }}>
            Upload two products to find out which is healthier
          </p>
        </div>

        {/* Two panels */}
        <div className="anim-fade-up stagger-2" style={{ display: 'flex', gap: 'var(--sp-4)' }}>
          <ProductPanel
            label="A"
            file={fileA}
            preview={previewA}
            onFileSelected={handleFileA}
            result={result?.product_a}
            color="var(--secondary)"
          />
          <ProductPanel
            label="B"
            file={fileB}
            preview={previewB}
            onFileSelected={handleFileB}
            result={result?.product_b}
            color="var(--tertiary)"
          />
        </div>

        {/* Compare button */}
        {fileA && fileB && !result && (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            onClick={handleCompare}
            className="anim-scale-in"
          >
            {loading ? 'ANALYZING BOTH PRODUCTS...' : 'COMPARE NOW'}
          </Button>
        )}

        {error && (
          <p className="text-body-sm" style={{ color: 'var(--error)' }}>{error}</p>
        )}

        {/* Results */}
        {result && (
          <div className="anim-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            <ComparisonTable result={result} />
            <Button
              variant="ghost"
              icon={<RotateCcw size={14} />}
              fullWidth
              onClick={handleReset}
            >
              COMPARE DIFFERENT PRODUCTS
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!fileA && !fileB && (
          <GlassCard className="anim-fade-up stagger-3" style={{ textAlign: 'center', padding: 'var(--sp-8)' }}>
            <p className="text-body" style={{ color: 'var(--on-surface-muted)' }}>
              Upload two food products above to compare their nutritional value side by side.
            </p>
          </GlassCard>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
