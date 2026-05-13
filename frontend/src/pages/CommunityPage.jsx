import React, { useEffect, useState } from 'react';
import { Heart, Trophy, Share2, Loader2, Crown, Medal } from 'lucide-react';
import Navbar from '../components/layout/Navbar.jsx';
import BottomNav from '../components/layout/BottomNav.jsx';
import GlassCard from '../components/layout/GlassCard.jsx';
import Button from '../components/ui/Button.jsx';
import { scoreToColor } from '../utils/scoreColor.js';
import { timeAgo } from '../utils/formatNutrition.js';
import { getCommunityFeed, getLeaderboard, likePost, deletePost } from '../services/community.js';

function PostCard({ post, onLike }) {
  const { color } = scoreToColor(post.healthScore || 5);
  const [liked, setLiked] = useState(false);

  const handleLike = async () => {
    if (liked) return;
    setLiked(true);
    onLike(post.id);
  };

  return (
    <GlassCard className="anim-fade-up" padding="p-4">
      <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'flex-start' }}>
        {/* Avatar */}
        <div style={{
          width: 36, height: 36, borderRadius: 'var(--r-full)',
          background: 'var(--primary-bg)', border: '1.5px solid var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, fontFamily: 'var(--font-display)', fontWeight: 700,
          color: 'var(--primary)', fontSize: 14,
        }}>
          {(post.userName || 'A')[0].toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p className="text-body-sm" style={{ color: 'var(--on-surface)', fontWeight: 600 }}>{post.userName}</p>
            <span className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 9 }}>{timeAgo(post.createdAt?.toDate?.() || post.createdAt)}</span>
          </div>

          {/* Food image */}
          {post.imageUrl && (
            <img src={post.imageUrl} alt={post.foodName} style={{
              width: '100%', height: 160, objectFit: 'cover',
              borderRadius: 'var(--r-md)', marginTop: 'var(--sp-2)', marginBottom: 'var(--sp-2)',
            }} />
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-2)' }}>
            <p className="text-body-sm" style={{ color: 'var(--on-surface)', fontWeight: 600 }}>{post.foodName}</p>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color }}>{post.healthScore}/10</span>
          </div>

          {post.caption && (
            <p className="text-body-sm" style={{ color: 'var(--on-surface-muted)', marginBottom: 'var(--sp-3)' }}>{post.caption}</p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
            <button
              onClick={handleLike}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'none', border: 'none', cursor: liked ? 'default' : 'pointer',
                color: liked ? 'var(--error)' : 'var(--on-surface-dim)',
                fontFamily: 'var(--font-mono)', fontSize: 11,
                transition: 'color var(--t-fast)',
              }}
            >
              <Heart size={14} fill={liked ? 'var(--error)' : 'none'} />
              {(post.likes || 0) + (liked ? 1 : 0)}
            </button>
            <span className="chip chip-default" style={{ fontSize: 9 }}>{post.verdict}</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function LeaderboardRow({ entry }) {
  const rankIcon = entry.rank === 1 ? <Crown size={16} color="var(--warning)" /> :
                   entry.rank === 2 ? <Medal size={16} color="#C0C0C0" /> :
                   entry.rank === 3 ? <Medal size={16} color="#CD7F32" /> :
                   <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--on-surface-dim)', width: 16, textAlign: 'center' }}>{entry.rank}</span>;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
      padding: 'var(--sp-3) 0', borderBottom: '1px solid var(--glass-border)',
    }}>
      <div style={{ width: 24, display: 'flex', justifyContent: 'center' }}>{rankIcon}</div>
      <div style={{
        width: 32, height: 32, borderRadius: 'var(--r-full)',
        background: 'var(--primary-bg)', border: '1.5px solid var(--primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--primary)', fontSize: 13,
      }}>
        {(entry.userName || 'A')[0].toUpperCase()}
      </div>
      <div style={{ flex: 1 }}>
        <p className="text-body-sm" style={{ color: 'var(--on-surface)', fontWeight: 600 }}>{entry.userName}</p>
        <p className="text-label" style={{ color: 'var(--on-surface-dim)', fontSize: 9 }}>{entry.totalScans} scans shared</p>
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--primary)' }}>
        {entry.avgScore}
      </span>
    </div>
  );
}

export default function CommunityPage() {
  const [tab,         setTab]         = useState('feed');
  const [posts,       setPosts]       = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (tab === 'feed') {
          const data = await getCommunityFeed(20);
          setPosts(data.posts || []);
        } else {
          const data = await getLeaderboard();
          setLeaderboard(data.leaderboard || []);
        }
      } catch { /* silent — show empty state */ }
      finally { setLoading(false); }
    };
    load();
  }, [tab]);

  const handleLike = async (postId) => {
    try { await likePost(postId); } catch { /* silent */ }
  };

  return (
    <div className="page">
      <Navbar title="Community" showSettings={false} />

      <div className="container" style={{ paddingTop: 'var(--sp-4)', paddingBottom: 'var(--sp-12)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>

        {/* Tab switcher */}
        <div style={{
          display: 'flex', background: 'var(--surface)', borderRadius: 'var(--r-full)',
          padding: 3, gap: 2,
        }}>
          {[
            { id: 'feed',        label: 'Community Feed', icon: Share2 },
            { id: 'leaderboard', label: 'Leaderboard',    icon: Trophy },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px 12px', borderRadius: 'var(--r-full)',
                background: tab === id ? 'var(--primary)' : 'transparent',
                color: tab === id ? 'var(--on-primary)' : 'var(--on-surface-muted)',
                border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                transition: 'all var(--t-base)',
              }}
            >
              <Icon size={13} />
              {label.toUpperCase()}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex-center" style={{ padding: 'var(--sp-12)' }}>
            <Loader2 size={28} color="var(--primary)" className="anim-spin" />
          </div>
        ) : tab === 'feed' ? (
          posts.length === 0 ? (
            <GlassCard style={{ textAlign: 'center', padding: 'var(--sp-8)' }}>
              <p className="text-body" style={{ color: 'var(--on-surface-muted)' }}>
                No posts yet. Be the first to share a scan!
              </p>
              <p className="text-body-sm" style={{ color: 'var(--on-surface-dim)', marginTop: 'var(--sp-2)' }}>
                After scanning food, tap "Share" on the results page.
              </p>
            </GlassCard>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              {posts.map(post => <PostCard key={post.id} post={post} onLike={handleLike} />)}
            </div>
          )
        ) : (
          <GlassCard>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-5)' }}>
              <Trophy size={20} color="var(--warning)" />
              <p className="text-label-md" style={{ color: 'var(--on-surface-muted)' }}>HEALTHIEST EATERS</p>
            </div>
            {leaderboard.length === 0 ? (
              <p className="text-body-sm" style={{ color: 'var(--on-surface-muted)' }}>
                No data yet. Share scans to appear on the leaderboard!
              </p>
            ) : (
              leaderboard.map(entry => <LeaderboardRow key={entry.userId} entry={entry} />)
            )}
          </GlassCard>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
