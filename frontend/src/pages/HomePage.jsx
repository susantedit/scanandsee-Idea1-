import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ScanLine, Zap, Brain, DollarSign, ChefHat,
  Dumbbell, ShoppingCart, UtensilsCrossed, ShieldAlert, Users, TrendingUp,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar.jsx';
import BottomNav from '../components/layout/BottomNav.jsx';
import GlassCard from '../components/layout/GlassCard.jsx';
import MacroCard from '../components/ui/MacroCard.jsx';
import Chip from '../components/ui/Chip.jsx';
import ProactiveInsights from '../components/ui/ProactiveInsights.jsx';
import HabitPrompt from '../components/ui/HabitPrompt.jsx';
import NotificationPrompt from '../components/ui/NotificationPrompt.jsx';
import { getScanHistory, getDailyNutrition } from '../services/api.js';
import useAppStore from '../store/useAppStore.js';
import { scoreToColor } from '../utils/scoreColor.js';
import { timeAgo } from '../utils/formatNutrition.js';
import { shouldAskPermission } from '../services/notifications.js';

function getReputationTitle(score) {
  if (score >= 8) return { title: 'High-Performance Eater', color: 'var(--primary)' };
  if (score >= 5) return { title: 'Balanced Eater', color: 'var(--warning)' };
  return { title: 'Needs Optimization', color: 'var(--error)' };
}

function PulseScanButton({ onClick }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          position: 'absolute',
          width: 80 + i * 30, height: 80 + i * 30,
          borderRadius: '50%',
          border: '1.5px solid rgba(0,230,57,0.3)',
          animation: `pulseRing ${1.5 + i * 0.4}s ease-out ${i * 0.3}s infinite`,
          pointerEvents: 'none',
        }} />
      ))}
      <button
        onClick={onClick}
        aria-label="Start scanning"
        style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), var(--primary-bright))',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--glow-lg-green)',
          transition: 'transform var(--t-spring)',
          position: 'relative', zIndex: 1,
        }}
        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.93)'}
        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <ScanLine size={32} color="var(--on-primary)" strokeWidth={2.5} />
      </button>
    </div>
  );
}

function ScanHistoryCard({ scan }) {
  const navigate = useNavigate();
  const { color } = scoreToColor(scan.healthScore);
  return (
    <GlassCard padding="p-4" onClick={() => navigate(`/results?scanId=${scan.id}`)} style={{ cursor: 'pointer', minWidth: 140, flexShrink: 0 }}>
      <div style={{ width: '100%', height: 80, borderRadius: 'var(--r-md)', background: 'var(--surface-high)', marginBottom: 'var(--sp-3)', overflow: 'hidden' }}>
        {scan.imageUrl && <img src={scan.imageUrl} alt={scan.foodName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-1)' }}>
        <span className="text-body-sm" style={{ color: 'var(--on-surface)', fontWeight: 600 }}>{scan.foodName}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color }}>{scan.healthScore}</span>
      </div>
      <span className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 9 }}>{timeAgo(scan.createdAt)}</span>
    </GlassCard>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { gymMode, toggleGymMode, setDailyStats, dailyStats, setScanHistory, scanHistory } = useAppStore();
  const [loading,         setLoading]         = useState(true);
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [daily, history] = await Promise.all([getDailyNutrition(), getScanHistory(6)]);
        setDailyStats(daily);
        setScanHistory(history.scans || []);
        if ((history.scans || []).length >= 1 && shouldAskPermission()) {
          setShowNotifPrompt(true);
        }
      } catch (err) {
        console.error('Home load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="page">
      <Navbar />
      <div className="container" style={{ paddingTop: 'var(--sp-6)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>

        {/* GAP 2: Proactive AI warnings — behavior change engine */}
        <ProactiveInsights />

        {/* GAP 4: Habit Loop Notifications */}
        <HabitPrompt />

        {/* GAP 1: Notification prompt after first scan */}
        {showNotifPrompt && <NotificationPrompt onDismiss={() => setShowNotifPrompt(false)} />}

        {/* Tier 1: Body Score & Reputation */}
        {dailyStats && (
          <GlassCard className="anim-fade-up" style={{ padding: 'var(--sp-5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderColor: 'rgba(0, 230, 57, 0.2)' }}>
            <div>
              <p className="text-label-md" style={{ color: 'var(--on-surface-muted)', marginBottom: 2 }}>YOUR BODY SCORE TODAY</p>
              <p className="text-body-sm" style={{ color: getReputationTitle(dailyStats.nutritionScore || 5).color, fontWeight: 600 }}>
                {getReputationTitle(dailyStats.nutritionScore || 5).title}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 'var(--sp-2)' }}>
                <Zap size={12} color="var(--primary)" fill="var(--primary)" />
                <span className="text-label" style={{ color: 'var(--primary)', fontSize: 10 }}>12 HEALTHY DECISIONS IN A ROW</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 36, fontWeight: 700, color: scoreToColor(dailyStats.nutritionScore || 5).color, lineHeight: 1 }}>
                {(dailyStats.nutritionScore || 5).toFixed(1)}
              </span>
              <span className="text-label" style={{ color: 'var(--on-surface-muted)', fontSize: 12, marginBottom: 6 }}>/10</span>
            </div>
          </GlassCard>
        )}

        {/* Hero — GAP 3: "Scan Before You Eat" positioning */}
        <GlassCard className="anim-fade-up" style={{ textAlign: 'center', padding: 'var(--sp-10) var(--sp-6)' }}>
          <p className="text-label" style={{ color: 'var(--on-surface-muted)', marginBottom: 'var(--sp-6)', letterSpacing: '0.15em' }}>
            SCAN BEFORE YOU EAT
          </p>
          <PulseScanButton onClick={() => navigate('/scan')} />
          <p className="text-body-sm" style={{ color: 'var(--on-surface-dim)', marginTop: 'var(--sp-6)' }}>
            Scan any food, product, or object instantly
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-3)', marginTop: 'var(--sp-5)' }}>
            <Zap size={14} color={gymMode ? 'var(--primary)' : 'var(--on-surface-dim)'} />
            <span className="text-label" style={{ color: gymMode ? 'var(--primary)' : 'var(--on-surface-dim)', fontSize: 10 }}>GYM MODE</span>
            <button onClick={toggleGymMode} role="switch" aria-checked={gymMode} style={{
              width: 40, height: 22, borderRadius: 'var(--r-full)',
              background: gymMode ? 'var(--primary)' : 'var(--surface-highest)',
              border: 'none', cursor: 'pointer', position: 'relative',
              transition: 'background var(--t-base)',
              boxShadow: gymMode ? 'var(--glow-sm-green)' : 'none',
            }}>
              <div style={{ position: 'absolute', top: 3, left: gymMode ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left var(--t-spring)' }} />
            </button>
          </div>
        </GlassCard>

        {/* Daily stats */}
        {dailyStats && (
          <div className="anim-fade-up stagger-2">
            <p className="text-label-md" style={{ color: 'var(--on-surface-muted)', marginBottom: 'var(--sp-3)' }}>Today's Nutrition</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--sp-3)' }}>
              <MacroCard type="calories" value={dailyStats.totalCalories} />
              <MacroCard type="protein"  value={dailyStats.totalProtein} />
              <MacroCard type="carbs"    value={dailyStats.totalCarbs} />
            </div>
          </div>
        )}

        {/* Recent scans */}
        {scanHistory.length > 0 && (
          <div className="anim-fade-up stagger-3">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-3)' }}>
              <p className="text-label-md" style={{ color: 'var(--on-surface-muted)' }}>Recent Scans</p>
              <button onClick={() => navigate('/history')} className="text-label" style={{ color: 'var(--secondary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 10 }}>VIEW ALL</button>
            </div>
            <div className="scroll-x">
              {scanHistory.map(scan => <ScanHistoryCard key={scan.id} scan={scan} />)}
            </div>
          </div>
        )}

        {/* More Tools */}
        <div className="anim-fade-up stagger-4">
          <p className="text-label-md" style={{ color: 'var(--on-surface-muted)', marginBottom: 'var(--sp-3)' }}>More Tools</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--sp-3)' }}>
            {[
              { icon: Brain,           label: 'Mood Analysis',  route: '/results',    color: 'var(--secondary)', desc: 'Brain & energy impact' },
              { icon: TrendingUp,      label: 'Health Risk',    route: '/risk',       color: 'var(--error)',     desc: 'AI risk prediction' },
              { icon: DollarSign,      label: 'Budget Meals',   route: '/budget',     color: 'var(--primary)',   desc: 'Optimize your budget' },
              { icon: ChefHat,         label: 'Build My Plate', route: '/plate',      color: 'var(--tertiary)',  desc: 'AI meal combiner' },
              { icon: Dumbbell,        label: 'Supplements',    route: '/supplement', color: 'var(--warning)',   desc: 'Detect fake claims' },
              { icon: ShoppingCart,    label: 'Cart Analysis',  route: '/grocery',    color: 'var(--secondary)', desc: 'Scan your cart' },
              { icon: UtensilsCrossed, label: 'Restaurant',     route: '/restaurant', color: 'var(--primary)',   desc: 'Estimate meal calories' },
              { icon: ShieldAlert,     label: 'Fake Detection', route: '/fake',       color: 'var(--error)',     desc: 'Spot counterfeit products' },
              { icon: Users,           label: 'Community',      route: '/community',  color: 'var(--tertiary)',  desc: 'Leaderboard & feed' },
            ].map(({ icon: Icon, label, route, color, desc }) => (
              <GlassCard key={route} padding="p-4" onClick={() => navigate(route)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--r-md)', background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} color={color} />
                  </div>
                  <div>
                    <p className="text-body-sm" style={{ color: 'var(--on-surface)', fontWeight: 600 }}>{label}</p>
                    <p className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 9 }}>{desc}</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {!loading && scanHistory.length === 0 && (
          <GlassCard className="anim-fade-up stagger-3" style={{ textAlign: 'center', padding: 'var(--sp-8)' }}>
            <p className="text-body" style={{ color: 'var(--on-surface-muted)' }}>
              No scans yet. Tap the button above to analyze your first food!
            </p>
          </GlassCard>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
