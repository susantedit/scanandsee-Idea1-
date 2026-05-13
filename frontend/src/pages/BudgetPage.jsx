import React, { useState } from 'react';
import { DollarSign, ShoppingCart, Clock, Loader2 } from 'lucide-react';
import Navbar from '../components/layout/Navbar.jsx';
import BottomNav from '../components/layout/BottomNav.jsx';
import GlassCard from '../components/layout/GlassCard.jsx';
import Button from '../components/ui/Button.jsx';
import ScanInput from '../components/ui/ScanInput.jsx';
import { optimizeBudget } from '../services/api.js';
import useAppStore from '../store/useAppStore.js';
import { GOAL_LABELS } from '../utils/formatNutrition.js';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'NPR', 'AUD', 'CAD'];

function MealCard({ meal, index }) {
  const scoreColor = meal.health_score >= 7 ? 'var(--primary)' : meal.health_score >= 4 ? 'var(--warning)' : 'var(--error)';
  return (
    <GlassCard className={`anim-fade-up stagger-${Math.min(index + 1, 6)}`} padding="p-4">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--sp-3)' }}>
        <div>
          <span className="chip chip-cyan" style={{ marginBottom: 4, display: 'inline-block' }}>{meal.meal_type}</span>
          <p className="text-title" style={{ color: 'var(--on-surface)' }}>{meal.name}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>
            {meal.estimated_cost?.toFixed(2)}
          </p>
          <p className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 9 }}>cost</p>
        </div>
      </div>

      <p className="text-body-sm" style={{ color: 'var(--on-surface-muted)', marginBottom: 'var(--sp-3)' }}>
        {meal.description}
      </p>

      <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap', marginBottom: 'var(--sp-3)' }}>
        {[
          { label: 'Cal',     val: meal.calories },
          { label: 'Protein', val: `${meal.protein_g}g` },
          { label: 'Score',   val: `${meal.health_score}/10`, color: scoreColor },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: 'var(--surface-high)', borderRadius: 'var(--r-md)', padding: '4px 10px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: color || 'var(--on-surface)' }}>{val}</p>
            <p className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 9 }}>{label}</p>
          </div>
        ))}
        {meal.prep_time && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={11} color="var(--on-surface-dim)" />
            <span className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 9 }}>{meal.prep_time}</span>
          </div>
        )}
      </div>

      {meal.ingredients?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-1)' }}>
          {meal.ingredients.map((ing, i) => (
            <span key={i} className="chip chip-default" style={{ fontSize: 9 }}>{ing}</span>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

export default function BudgetPage() {
  const { profile } = useAppStore();
  const [budget,   setBudget]   = useState('');
  const [currency, setCurrency] = useState('USD');
  const [days,     setDays]     = useState(1);
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const goal = profile?.goal || 'healthy_eating';

  const handleOptimize = async () => {
    if (!budget || isNaN(parseFloat(budget))) { setError('Enter a valid budget amount.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const data = await optimizeBudget(parseFloat(budget), currency, goal, days);
      setResult(data);
    } catch (e) {
      setError(e.message || 'Optimization failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <Navbar showBack title="Budget Optimizer" showSettings={false} />

      <div className="container" style={{ paddingTop: 'var(--sp-6)', paddingBottom: 'var(--sp-12)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>

        <div className="anim-fade-up">
          <h1 className="text-headline">Budget Nutrition Optimizer</h1>
          <p className="text-body-sm" style={{ color: 'var(--on-surface-muted)', marginTop: 'var(--sp-2)' }}>
            Enter your budget and get an AI-optimized meal plan
          </p>
        </div>

        {/* Input form */}
        <GlassCard className="anim-fade-up stagger-2" padding="p-5">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
            <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
              <div style={{ flex: 1 }}>
                <ScanInput
                  label="Budget Amount"
                  type="number"
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                  placeholder="e.g. 10"
                  min="0.5"
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Currency</span>
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '2px solid var(--outline-variant)',
                    color: 'var(--on-surface)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 16,
                    padding: '10px 0',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  {CURRENCIES.map(c => <option key={c} value={c} style={{ background: 'var(--surface)' }}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <p className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 'var(--sp-2)' }}>
                Plan For
              </p>
              <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                {[1, 3, 7].map(d => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={`chip ${days === d ? 'chip-healthy' : 'chip-default'}`}
                    style={{ cursor: 'pointer', border: 'none' }}
                  >
                    {d === 1 ? '1 Day' : `${d} Days`}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
              <span className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 10 }}>GOAL:</span>
              <span className="chip chip-cyan">{GOAL_LABELS[goal] || goal}</span>
            </div>

            {error && <p className="text-body-sm" style={{ color: 'var(--error)' }}>{error}</p>}

            <Button variant="primary" size="lg" fullWidth loading={loading} onClick={handleOptimize}>
              {loading ? 'OPTIMIZING...' : 'OPTIMIZE MY BUDGET'}
            </Button>
          </div>
        </GlassCard>

        {/* Results */}
        {result && (
          <>
            {/* Summary */}
            <GlassCard className="anim-fade-up" style={{ borderColor: 'rgba(0,230,57,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-4)' }}>
                <div>
                  <p className="text-label-md" style={{ color: 'var(--primary)' }}>DAILY NUTRITION ESTIMATE</p>
                  <p className="text-body-sm" style={{ color: 'var(--on-surface-muted)', marginTop: 4 }}>
                    Budget: {result.currency} {result.total_budget}
                  </p>
                </div>
                <ShoppingCart size={20} color="var(--primary)" />
              </div>
              <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
                {[
                  { label: 'Calories', val: result.daily_nutrition_estimate?.calories },
                  { label: 'Protein',  val: `${result.daily_nutrition_estimate?.protein_g}g` },
                  { label: 'Carbs',    val: `${result.daily_nutrition_estimate?.carbs_g}g` },
                  { label: 'Fats',     val: `${result.daily_nutrition_estimate?.fats_g}g` },
                ].map(({ label, val }) => (
                  <div key={label} style={{ background: 'var(--surface-high)', borderRadius: 'var(--r-md)', padding: '6px 12px', textAlign: 'center' }}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>{val}</p>
                    <p className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 9 }}>{label}</p>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Meals */}
            <div>
              <p className="text-label-md" style={{ color: 'var(--on-surface-muted)', marginBottom: 'var(--sp-3)' }}>MEAL PLAN</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                {result.meals?.map((meal, i) => <MealCard key={i} meal={meal} index={i} />)}
              </div>
            </div>

            {/* Grocery list */}
            {result.grocery_list?.length > 0 && (
              <GlassCard className="anim-fade-up">
                <p className="text-label-md" style={{ color: 'var(--on-surface-muted)', marginBottom: 'var(--sp-4)' }}>GROCERY LIST</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                  {result.grocery_list.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: 'var(--sp-2)' }}>
                      <div>
                        <p className="text-body-sm" style={{ color: 'var(--on-surface)', fontWeight: 600 }}>{item.item}</p>
                        <p className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 9 }}>{item.quantity} · {item.protein_per_cost}</p>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
                        {result.currency} {item.estimated_cost?.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Tips */}
            {result.money_saving_tips?.length > 0 && (
              <GlassCard className="anim-fade-up">
                <p className="text-label-md" style={{ color: 'var(--on-surface-muted)', marginBottom: 'var(--sp-3)' }}>MONEY SAVING TIPS</p>
                {result.money_saving_tips.map((tip, i) => (
                  <p key={i} className="text-body-sm" style={{ color: 'var(--secondary)', marginBottom: 6 }}>💡 {tip}</p>
                ))}
              </GlassCard>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
