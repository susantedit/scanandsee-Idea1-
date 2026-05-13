import React, { useState } from 'react';
import { ShoppingCart, Plus, Loader2, Trash2, Trophy, AlertTriangle } from 'lucide-react';
import Navbar from '../components/layout/Navbar.jsx';
import BottomNav from '../components/layout/BottomNav.jsx';
import GlassCard from '../components/layout/GlassCard.jsx';
import Button from '../components/ui/Button.jsx';
import { analyzeGroceryCart } from '../services/api.js';
import { scoreToColor } from '../utils/scoreColor.js';

export default function GroceryPage() {
  const [files,   setFiles]   = useState([]);
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const addFile = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...newFiles].slice(0, 5));
    setResult(null);
  };

  const removeFile = (i) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const handleAnalyze = async () => {
    if (!files.length) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const data = await analyzeGroceryCart(files);
      setResult(data);
    } catch (e) {
      setError(e.message || 'Cart analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cartColor = result ? scoreToColor(result.cart?.cart_score || 5).color : 'var(--primary)';

  return (
    <div className="page">
      <Navbar showBack title="Cart Analysis" showSettings={false} />

      <div className="container" style={{ paddingTop: 'var(--sp-6)', paddingBottom: 'var(--sp-12)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>

        <div className="anim-fade-up">
          <h1 className="text-headline">AI Grocery Cart Analysis</h1>
          <p className="text-body-sm" style={{ color: 'var(--on-surface-muted)', marginTop: 'var(--sp-2)' }}>
            Scan up to 5 products — AI analyzes your entire cart at once
          </p>
        </div>

        {/* File list */}
        <div className="anim-fade-up stagger-2">
          {files.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', marginBottom: 'var(--sp-4)' }}>
              {files.map((f, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'var(--surface)', borderRadius: 'var(--r-md)', padding: 'var(--sp-3)',
                  border: '1px solid var(--glass-border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                    <img src={URL.createObjectURL(f)} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 'var(--r-sm)' }} />
                    <span className="text-body-sm truncate" style={{ color: 'var(--on-surface)', maxWidth: 180 }}>{f.name}</span>
                  </div>
                  <button onClick={() => removeFile(i)} className="btn btn-ghost btn-icon" style={{ color: 'var(--error)', padding: 6 }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {files.length < 5 && (
            <label style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-3)',
              border: '2px dashed var(--outline-variant)', borderRadius: 'var(--r-lg)',
              padding: 'var(--sp-5)', cursor: 'pointer',
              background: 'transparent', color: 'var(--secondary)',
              transition: 'border-color var(--t-base)',
            }}>
              <Plus size={20} />
              <span className="text-label" style={{ letterSpacing: '0.1em' }}>
                ADD PRODUCT ({files.length}/5)
              </span>
              <input type="file" accept="image/*" multiple onChange={addFile} style={{ display: 'none' }} />
            </label>
          )}
        </div>

        {files.length > 0 && !loading && (
          <Button variant="primary" size="lg" fullWidth onClick={handleAnalyze} className="anim-scale-in">
            ANALYZE CART ({files.length} {files.length === 1 ? 'ITEM' : 'ITEMS'})
          </Button>
        )}

        {loading && (
          <div className="flex-center" style={{ padding: 'var(--sp-8)', gap: 'var(--sp-3)' }}>
            <Loader2 size={28} color="var(--primary)" className="anim-spin" />
            <p className="text-label anim-blink" style={{ color: 'var(--secondary)', letterSpacing: '0.12em' }}>
              SCANNING CART...
            </p>
          </div>
        )}

        {error && <p className="text-body-sm" style={{ color: 'var(--error)' }}>{error}</p>}

        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>

            {/* Cart score */}
            <GlassCard className="anim-scale-in" style={{ textAlign: 'center', padding: 'var(--sp-6)', borderColor: `${cartColor}40` }}>
              <ShoppingCart size={28} color={cartColor} style={{ margin: '0 auto var(--sp-3)' }} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 56, fontWeight: 800, color: cartColor }}>
                {result.cart?.cart_score}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: 'var(--on-surface-dim)' }}>/10</span>
              <p className="text-label-md" style={{ color: cartColor, marginTop: 'var(--sp-2)' }}>{result.cart?.cart_verdict}</p>
              {result.cart?.goal_alignment && (
                <p className="text-body-sm" style={{ color: 'var(--on-surface-muted)', marginTop: 'var(--sp-2)' }}>{result.cart.goal_alignment}</p>
              )}
            </GlassCard>

            {/* Individual items */}
            {result.items?.length > 0 && (
              <div>
                <p className="text-label-md" style={{ color: 'var(--on-surface-muted)', marginBottom: 'var(--sp-3)' }}>ITEMS SCANNED</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                  {result.items.map((item, i) => {
                    const { color } = scoreToColor(item.health_score || 5);
                    return (
                      <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: 'var(--surface)', borderRadius: 'var(--r-md)', padding: 'var(--sp-3)',
                        border: '1px solid var(--glass-border)',
                      }}>
                        <p className="text-body-sm" style={{ color: 'var(--on-surface)', fontWeight: 600 }}>{item.food_name || item.name}</p>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color }}>{item.health_score}/10</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Best items */}
            {result.cart?.best_items?.length > 0 && (
              <GlassCard className="anim-fade-up stagger-2" style={{ borderColor: 'rgba(0,230,57,0.2)' }}>
                <p className="text-label-md" style={{ color: 'var(--primary)', marginBottom: 'var(--sp-3)' }}>
                  <Trophy size={13} style={{ display: 'inline', marginRight: 6 }} />BEST ITEMS
                </p>
                {result.cart.best_items.map((item, i) => (
                  <div key={i} style={{ marginBottom: 'var(--sp-2)' }}>
                    <p className="text-body-sm" style={{ color: 'var(--primary)', fontWeight: 600 }}>✓ {item.name}</p>
                    <p className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 9 }}>{item.reason}</p>
                  </div>
                ))}
              </GlassCard>
            )}

            {/* Worst items + swaps */}
            {result.cart?.worst_items?.length > 0 && (
              <GlassCard className="anim-fade-up stagger-3" style={{ borderColor: 'rgba(255,180,171,0.3)' }}>
                <p className="text-label-md" style={{ color: 'var(--error)', marginBottom: 'var(--sp-3)' }}>
                  <AlertTriangle size={13} style={{ display: 'inline', marginRight: 6 }} />SWAP THESE
                </p>
                {result.cart.worst_items.map((item, i) => (
                  <div key={i} style={{ marginBottom: 'var(--sp-3)', borderBottom: '1px solid var(--glass-border)', paddingBottom: 'var(--sp-2)' }}>
                    <p className="text-body-sm" style={{ color: 'var(--error)', fontWeight: 600 }}>✗ {item.name}</p>
                    <p className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 9 }}>{item.issue}</p>
                    <p className="text-label" style={{ color: 'var(--primary)', fontSize: 9 }}>→ Try: {item.alternative}</p>
                  </div>
                ))}
              </GlassCard>
            )}

            {/* Add to cart */}
            {result.cart?.add_to_cart?.length > 0 && (
              <GlassCard className="anim-fade-up stagger-4">
                <p className="text-label-md" style={{ color: 'var(--on-surface-muted)', marginBottom: 'var(--sp-3)' }}>ADD TO YOUR CART</p>
                {result.cart.add_to_cart.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)', alignItems: 'flex-start' }}>
                    <Plus size={13} color="var(--secondary)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <p className="text-body-sm" style={{ color: 'var(--secondary)', fontWeight: 600 }}>{item.item}</p>
                      <p className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 9 }}>
                        {item.reason} {item.budget_friendly ? '· Budget friendly' : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </GlassCard>
            )}

            {result.cart?.summary && (
              <p className="text-body-sm anim-fade-up stagger-5" style={{ color: 'var(--on-surface-muted)', fontStyle: 'italic', textAlign: 'center' }}>
                {result.cart.summary}
              </p>
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
