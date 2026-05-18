import React, { useState } from 'react';
import { ShoppingBag, Star, ExternalLink, Filter, Search } from 'lucide-react';
import Navbar from '../components/layout/Navbar.jsx';
import BottomNav from '../components/layout/BottomNav.jsx';
import GlassCard from '../components/layout/GlassCard.jsx';
import Button from '../components/ui/Button.jsx';
import { getMarketplaceProducts } from '../services/api.js';

const CATEGORIES = ['All', 'Protein', 'Supplement', 'Greens', 'Omega-3', 'Mineral'];

export default function MarketplacePage() {
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('All');
  const [products, setProducts] = useState([]);

  React.useEffect(() => {
    getMarketplaceProducts()
      .then(res => setProducts(res.products || []))
      .catch(console.error);
  }, []);

  const filtered = products.filter(p => {
    const matchCat = category === 'All' || p.category === category;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="page">
      <Navbar showBack title="Marketplace" showSettings={false} />
      <div className="container" style={{ paddingTop: 'var(--sp-6)', paddingBottom: 'var(--sp-12)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>

        <div className="anim-fade-up">
          <h1 className="text-headline">AI-Curated Products</h1>
          <p className="text-body-sm" style={{ color: 'var(--on-surface-muted)', marginTop: 'var(--sp-2)' }}>
            Every product scored and verified by our AI. No fake claims, no hidden ingredients.
          </p>
        </div>

        {/* Search */}
        <div className="anim-fade-up stagger-2" style={{ position: 'relative' }}>
          <Search size={14} color="var(--on-surface-dim)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--r-lg)', color: 'var(--on-surface)', fontFamily: 'var(--font-body)', fontSize: 14, padding: '10px 12px 10px 36px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Category filter */}
        <div className="scroll-x anim-fade-up stagger-2">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`chip ${category === c ? 'chip-healthy' : 'chip-default'}`}
              style={{ cursor: 'pointer', border: 'none', flexShrink: 0 }}>
              {c}
            </button>
          ))}
        </div>

        {/* Products */}
        <div className="anim-fade-up stagger-3" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          {filtered.map((p, i) => (
            <GlassCard key={p.id} className={`anim-fade-up stagger-${Math.min(i + 1, 6)}`} padding="p-4">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--sp-3)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 4 }}>
                    <span className="chip" style={{ background: `${p.color}15`, color: p.color, border: `1px solid ${p.color}30`, fontFamily: 'var(--font-mono)', fontSize: 9, padding: '2px 8px', borderRadius: 'var(--r-full)' }}>
                      {p.badge}
                    </span>
                    <span className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 9 }}>{p.category}</span>
                  </div>
                  <p className="text-body-sm truncate" style={{ color: 'var(--on-surface)', fontWeight: 600 }}>{p.name}</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 'var(--sp-3)' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: p.color }}>{p.score}</p>
                  <p className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 9 }}>AI SCORE</p>
                </div>
              </div>

              <p className="text-body-sm" style={{ color: 'var(--on-surface-muted)', marginBottom: 'var(--sp-3)', fontSize: 12 }}>
                ✓ {p.why}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                  <Star size={11} color="var(--warning)" fill="var(--warning)" />
                  <span className="text-label" style={{ color: 'var(--on-surface-muted)', fontSize: 10 }}>{p.rating} ({p.reviews.toLocaleString()})</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{p.price}</span>
                </div>
                <a href={p.link} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--secondary)', textDecoration: 'none', letterSpacing: '0.08em' }}>
                  BUY <ExternalLink size={11} />
                </a>
              </div>
            </GlassCard>
          ))}
        </div>

        <p className="text-label" style={{ color: 'var(--on-surface-dim)', textAlign: 'center', fontSize: 9 }}>
          Links may be affiliate links. AI scores are based on ingredient analysis, not sponsored.
        </p>
      </div>
      <BottomNav />
    </div>
  );
}
