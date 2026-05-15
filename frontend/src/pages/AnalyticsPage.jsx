import React, { useEffect, useState } from 'react';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore.js';
import useGamificationStore from '../store/useGamificationStore.js';
import { getScanHistory } from '../services/api.js';

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { profile } = useAppStore();
  const { scanStreak, longestScanStreak, xp } = useGamificationStore();

  const [stats, setStats] = useState({
    totalScans: 0,
    foods: {},
    verdicts: {},
    topFood: null,
    recentScans: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { scans } = await getScanHistory(100, 0);
        if (!scans?.length) {
          setLoading(false);
          return;
        }

        const foods = {};
        const verdicts = {};

        scans.forEach(scan => {
          const food = scan.food_name || 'Unknown';
          foods[food] = (foods[food] || 0) + 1;

          const v = scan.verdict || 'MODERATE';
          verdicts[v] = (verdicts[v] || 0) + 1;
        });

        const topFood = Object.entries(foods).sort((a, b) => b[1] - a[1])[0];

        setStats({
          totalScans: scans.length,
          foods,
          verdicts,
          topFood: topFood ? { name: topFood[0], count: topFood[1] } : null,
          recentScans: scans.slice(0, 5),
        });
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const level = Math.floor(xp / 500) + 1;
  const xpToNext = (level * 500) - xp;

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--void)',
      padding: 'var(--sp-4) var(--margin-mobile)',
      color: 'var(--on-surface)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)', marginBottom: 'var(--sp-8)' }}>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-ghost btn-icon"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Analytics</h1>
      </div>

      {/* Gamification Card */}
      <div style={{
        background: 'linear-gradient(135deg, var(--surface), var(--surface-high))',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--r-lg)',
        padding: 'var(--sp-6)',
        marginBottom: 'var(--sp-6)',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)', marginBottom: 'var(--sp-6)' }}>
          {/* Level */}
          <div>
            <div style={{ fontSize: 13, color: 'var(--on-surface-muted)', marginBottom: 'var(--sp-2)' }}>LEVEL</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--primary)' }}>{level}</div>
            <div style={{ fontSize: 12, color: 'var(--on-surface-muted)' }}>{xpToNext} XP to next</div>
          </div>

          {/* Streak */}
          <div>
            <div style={{ fontSize: 13, color: 'var(--on-surface-muted)', marginBottom: 'var(--sp-2)' }}>STREAK</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--secondary)' }}>{scanStreak}</div>
            <div style={{ fontSize: 12, color: 'var(--on-surface-muted)' }}>Best: {longestScanStreak}</div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div>
          <div style={{ fontSize: 12, color: 'var(--on-surface-muted)', marginBottom: 'var(--sp-2)' }}>PROGRESS</div>
          <div style={{
            width: '100%',
            height: 8,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 'var(--r-full)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${((xp % 500) / 500) * 100}%`,
              background: 'linear-gradient(90deg, var(--primary), var(--primary-bright))',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)', marginBottom: 'var(--sp-6)' }}>
        {/* Total Scans */}
        <div style={{
          background: 'var(--surface-low)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--r-lg)',
          padding: 'var(--sp-4)',
        }}>
          <div style={{ fontSize: 13, color: 'var(--on-surface-muted)', marginBottom: 'var(--sp-2)' }}>Total Scans</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary)' }}>{stats.totalScans}</div>
        </div>

        {/* Top Food */}
        <div style={{
          background: 'var(--surface-low)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--r-lg)',
          padding: 'var(--sp-4)',
        }}>
          <div style={{ fontSize: 13, color: 'var(--on-surface-muted)', marginBottom: 'var(--sp-2)' }}>Top Food</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{stats.topFood?.name || 'N/A'}</div>
          <div style={{ fontSize: 12, color: 'var(--on-surface-muted)' }}>{stats.topFood?.count || 0} scans</div>
        </div>
      </div>

      {/* Verdicts Breakdown */}
      {Object.keys(stats.verdicts).length > 0 && (
        <div style={{
          background: 'var(--surface-low)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--r-lg)',
          padding: 'var(--sp-4)',
          marginBottom: 'var(--sp-6)',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 'var(--sp-4)' }}>Verdicts</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--sp-3)' }}>
            {Object.entries(stats.verdicts).map(([verdict, count]) => (
              <div key={verdict} style={{
                background: 'rgba(255,255,255,0.04)',
                padding: 'var(--sp-3)',
                borderRadius: 'var(--r-md)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 11, color: 'var(--on-surface-muted)', marginBottom: 'var(--sp-2)' }}>{verdict}</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Scans */}
      {stats.recentScans.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 'var(--sp-4)' }}>Recent Scans</div>
          {stats.recentScans.map((scan, idx) => (
            <div key={idx} style={{
              background: 'var(--surface-low)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--r-md)',
              padding: 'var(--sp-3)',
              marginBottom: 'var(--sp-3)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <div style={{ fontWeight: 700 }}>{scan.food_name}</div>
                <div style={{ fontSize: 12, color: 'var(--on-surface-muted)' }}>{scan.verdict}</div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>
                {Math.round(scan.health_score * 10)}
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: 'var(--sp-8)' }}>
          <p style={{ color: 'var(--on-surface-muted)' }}>Loading analytics...</p>
        </div>
      )}
    </div>
  );
}
