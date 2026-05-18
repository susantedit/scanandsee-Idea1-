import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Loader2, BarChart2 } from 'lucide-react';
import Navbar from '../components/layout/Navbar.jsx';
import BottomNav from '../components/layout/BottomNav.jsx';
import GlassCard from '../components/layout/GlassCard.jsx';
import MacroCard from '../components/ui/MacroCard.jsx';
import ProgressRing from '../components/ui/ProgressRing.jsx';
import Button from '../components/ui/Button.jsx';
import { getScanHistory, getDailyNutrition, getWeeklyNutrition, deleteScan } from '../services/api.js';
import useAppStore from '../store/useAppStore.js';
import { scoreToColor } from '../utils/scoreColor.js';
import { timeAgo } from '../utils/formatNutrition.js';

// ── Behavioral Insights Logic ────────────────────────────────────────────────
function generateInsight(scans) {
  if (!scans || scans.length < 3) return "Scan more items to unlock personalized behavioral insights.";
  
  const lowScores = scans.filter(s => s.healthScore < 5).length;
  const highScores = scans.filter(s => s.healthScore >= 8).length;
  
  if (lowScores >= 3) return "Insight: You've been scanning a lot of low-scoring items recently. Try swapping to whole foods for better energy.";
  if (highScores >= 3) return "Insight: Great job! You're consistently choosing high-performance foods.";
  return "Insight: Your eating patterns are balanced. Focus on protein intake to optimize recovery.";
}

// ── Weekly bar chart (custom SVG) ─────────────────────────────────────────────
function WeeklyChart({ days }) {
  if (!days?.length) return null;
  const maxCal = Math.max(...days.map(d => d.totalCalories || 0), 1);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
      {days.map((day, i) => {
        const pct = (day.totalCalories || 0) / maxCal;
        const isToday = i === days.length - 1;
        const label = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1);
        return (
          <div key={day.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: '100%',
              height: Math.max(pct * 60, 4),
              background: isToday ? 'var(--primary)' : 'var(--surface-highest)',
              borderRadius: 'var(--r-sm)',
              boxShadow: isToday ? 'var(--glow-sm-green)' : 'none',
              transition: 'height 0.8s ease-out',
            }} />
            <span className="text-label" style={{ color: isToday ? 'var(--primary)' : 'var(--on-surface-dim)', fontSize: 9 }}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Calendar strip ────────────────────────────────────────────────────────────
function CalendarStrip({ days, selectedDate, onSelect }) {
  return (
    <div className="scroll-x">
      {days.map((day, i) => {
        const d = new Date(day.date);
        const isToday = i === days.length - 1;
        const isSelected = day.date === selectedDate;
        const hasScans = (day.scansCount || 0) > 0;

        return (
          <button
            key={day.date}
            onClick={() => onSelect(day.date)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: 'var(--sp-2) var(--sp-3)',
              borderRadius: 'var(--r-lg)',
              background: isSelected ? 'var(--primary-bg)' : 'transparent',
              border: `1.5px solid ${isSelected ? 'var(--primary)' : 'transparent'}`,
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all var(--t-base)',
              boxShadow: isSelected ? 'var(--glow-xs-green)' : 'none',
            }}
          >
            <span className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 9 }}>
              {d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 16,
              fontWeight: 700,
              color: isSelected ? 'var(--primary)' : isToday ? 'var(--on-surface)' : 'var(--on-surface-muted)',
            }}>
              {d.getDate()}
            </span>
            {/* Dot indicator */}
            <div style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: hasScans ? 'var(--primary)' : 'transparent',
            }} />
          </button>
        );
      })}
    </div>
  );
}

// ── Scan list item ────────────────────────────────────────────────────────────
function ScanItem({ scan, onDelete, onClick }) {
  const { color } = scoreToColor(scan.healthScore);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    setDeleting(true);
    try {
      await deleteScan(scan.id);
      onDelete(scan.id);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div
      className="glass-card-sm anim-fade-up"
      onClick={onClick}
      style={{
        padding: 'var(--sp-3) var(--sp-4)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--sp-3)',
        cursor: 'pointer',
        transition: 'border-color var(--t-base)',
      }}
    >
      {/* Thumbnail */}
      <div style={{
        width: 52,
        height: 52,
        borderRadius: 'var(--r-md)',
        background: 'var(--surface-high)',
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        {scan.imageUrl && (
          <img src={scan.imageUrl} alt={scan.foodName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="text-body-sm truncate" style={{ color: 'var(--on-surface)', fontWeight: 600 }}>
          {scan.foodName}
        </p>
        <p className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 9, marginTop: 2 }}>
          {timeAgo(scan.createdAt?.toDate?.() || scan.createdAt)}
        </p>
      </div>

      {/* Score */}
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 18,
        fontWeight: 700,
        color,
        flexShrink: 0,
      }}>
        {scan.healthScore}
      </span>

      {/* Delete */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="btn btn-ghost btn-icon"
        style={{ color: 'var(--on-surface-dim)', padding: 6, flexShrink: 0 }}
        aria-label="Delete scan"
      >
        {deleting
          ? <Loader2 size={14} className="anim-spin" />
          : <Trash2 size={14} />
        }
      </button>
    </div>
  );
}

// ── Weekly report modal ───────────────────────────────────────────────────────
function WeeklyModal({ days, onClose }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5,5,5,0.85)',
      zIndex: 'var(--z-modal)',
      display: 'flex',
      alignItems: 'flex-end',
      padding: 'var(--sp-4)',
    }} onClick={onClose}>
      <div
        className="glass-card anim-fade-up"
        style={{ width: '100%', padding: 'var(--sp-6)', maxHeight: '80dvh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-6)' }}>
          <h2 className="text-headline" style={{ fontSize: 22 }}>Weekly Report</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ color: 'var(--on-surface-dim)' }}>CLOSE</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
          <div>
            <p className="text-label-md" style={{ color: 'var(--on-surface-muted)', marginBottom: 'var(--sp-3)' }}>
              Calorie Trend
            </p>
            <WeeklyChart days={days} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--sp-3)' }}>
            {[
              { label: 'Avg Calories',  val: Math.round(days.reduce((s, d) => s + (d.totalCalories || 0), 0) / 7) },
              { label: 'Avg Protein',   val: `${Math.round(days.reduce((s, d) => s + (d.totalProtein || 0), 0) / 7)}g` },
              { label: 'Total Scans',   val: days.reduce((s, d) => s + (d.scansCount || 0), 0) },
              { label: 'Avg Score',     val: (days.reduce((s, d) => s + (d.nutritionScore || 5), 0) / 7).toFixed(1) },
            ].map(({ label, val }) => (
              <GlassCard key={label} padding="p-4" style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>{val}</p>
                <p className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 9, marginTop: 4 }}>{label}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HistoryPage() {
  const navigate = useNavigate();
  const { removeScanFromHistory } = useAppStore();

  const [scans,        setScans]        = useState([]);
  const [daily,        setDaily]        = useState(null);
  const [weeklyDays,   setWeeklyDays]   = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showWeekly,   setShowWeekly]   = useState(false);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [historyData, dailyData, weeklyData] = await Promise.all([
          getScanHistory(50),
          getDailyNutrition(),
          getWeeklyNutrition(),
        ]);
        setScans(historyData.scans || []);
        setDaily(dailyData);
        setWeeklyDays(weeklyData.days || []);
      } catch (err) {
        console.error('History load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDelete = (scanId) => {
    setScans(prev => prev.filter(s => s.id !== scanId));
    removeScanFromHistory(scanId);
  };

  return (
    <div className="page">
      <Navbar title="History" showSettings={false} />

      <div className="container" style={{ paddingTop: 'var(--sp-6)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)', paddingBottom: 'var(--sp-12)' }}>

        {/* Daily summary */}
        {daily && (
          <GlassCard className="anim-fade-up" padding="p-5">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-4)' }}>
              <div>
                <p className="text-label-md" style={{ color: 'var(--on-surface-muted)' }}>Today</p>
                <p className="text-title" style={{ color: 'var(--on-surface)', marginTop: 2 }}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
              </div>
              <ProgressRing score={daily.nutritionScore || 5} size={64} strokeWidth={6} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              {[
                { label: 'Calories', val: daily.totalCalories || 0, max: 2000, color: 'var(--primary)' },
                { label: 'Protein',  val: daily.totalProtein  || 0, max: 50,   color: 'var(--tertiary)' },
                { label: 'Carbs',    val: daily.totalCarbs    || 0, max: 275,  color: 'var(--secondary)' },
                { label: 'Fats',     val: daily.totalFats     || 0, max: 78,   color: 'var(--warning)' },
              ].map(({ label, val, max, color }) => (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span className="text-label" style={{ color: 'var(--on-surface-muted)', fontSize: 10 }}>{label}</span>
                    <span className="text-label" style={{ color, fontSize: 10 }}>{Math.round(val)}</span>
                  </div>
                  <div className="progress-bar-track">
                    <div className="progress-bar-fill" style={{
                      width: `${Math.min((val / max) * 100, 100)}%`,
                      background: color,
                      boxShadow: `0 0 4px ${color}`,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Calendar strip */}
        {weeklyDays.length > 0 && (
          <div className="anim-fade-up stagger-2">
            <CalendarStrip
              days={weeklyDays}
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
            />
          </div>
        )}

        {/* Weekly report button */}
        <Button
          variant="outline"
          icon={<BarChart2 size={14} />}
          fullWidth
          onClick={() => setShowWeekly(true)}
          className="anim-fade-up stagger-2"
        >
          VIEW WEEKLY HEALTH REPORT
        </Button>

        {/* Behavioral Pattern Insights */}
        {scans.length > 0 && (
          <GlassCard className="anim-fade-up stagger-2" padding="p-4" style={{ borderColor: 'rgba(0, 219, 233, 0.3)', background: 'var(--surface-highest)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 'var(--sp-2)' }}>
              <span className="chip" style={{ background: 'var(--secondary)', color: '#000', fontSize: 9, fontWeight: 800, padding: '2px 6px' }}>AI MEMORY</span>
              <p className="text-label" style={{ color: 'var(--secondary)', fontSize: 10, letterSpacing: '0.05em' }}>BEHAVIORAL INSIGHT</p>
            </div>
            <p className="text-body-sm" style={{ color: 'var(--on-surface)' }}>
              {generateInsight(scans)}
            </p>
          </GlassCard>
        )}

        {/* Scan feed */}
        <div className="anim-fade-up stagger-3">
          <p className="text-label-md" style={{ color: 'var(--on-surface-muted)', marginBottom: 'var(--sp-3)' }}>
            All Scans {scans.length > 0 && `(${scans.length})`}
          </p>

          {loading ? (
            <div className="flex-center" style={{ padding: 'var(--sp-12)' }}>
              <Loader2 size={28} color="var(--primary)" className="anim-spin" />
            </div>
          ) : scans.length === 0 ? (
            <GlassCard style={{ textAlign: 'center', padding: 'var(--sp-8)' }}>
              <p className="text-body" style={{ color: 'var(--on-surface-muted)' }}>
                No scans yet. Start scanning food to build your history!
              </p>
            </GlassCard>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
              {scans.map((scan, i) => (
                <ScanItem
                  key={scan.id}
                  scan={scan}
                  onDelete={handleDelete}
                  onClick={() => navigate(`/results?scanId=${scan.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showWeekly && (
        <WeeklyModal days={weeklyDays} onClose={() => setShowWeekly(false)} />
      )}

      <BottomNav />
    </div>
  );
}
