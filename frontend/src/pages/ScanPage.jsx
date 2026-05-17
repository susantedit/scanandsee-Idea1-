import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, ArrowLeft } from 'lucide-react';
import CameraView from '../components/scan/CameraView.jsx';
import UploadZone from '../components/scan/UploadZone.jsx';
import Button from '../components/ui/Button.jsx';
import { analyzeScan } from '../services/api.js';
import { trackEvent } from '../services/firebase.js';
import { useToast } from '../components/ui/Toast.jsx';
import { generateBadges } from '../utils/badgeGenerator.js';
import useGamificationStore from '../store/useGamificationStore.js';
import useAppStore from '../store/useAppStore.js';
import { recordScan as memoryRecordScan, getInsights } from '../services/aiMemory.js';
import { shouldAskPermission, requestPermission, scheduleDailyReminder, notifyHealthPattern } from '../services/notifications.js';

export default function ScanPage() {
  const navigate = useNavigate();
  const { gymMode, setCurrentScan, setIsAnalyzing, isAnalyzing, getPersona, getGoal } = useAppStore();
  const { recordScan } = useGamificationStore();

  const [mode,        setMode]        = useState('camera');
  const [file,        setFile]        = useState(null);
  const [preview,     setPreview]     = useState(null);
  const [error,       setError]       = useState('');
  const [live,        setLive]        = useState(false);
  const [liveOverlay, setLiveOverlay] = useState(null);
  const liveTimerRef = React.useRef(null);

  React.useEffect(() => {
    if (!liveOverlay) return;
    const iv = setTimeout(() => setLiveOverlay(null), 2500);
    return () => clearTimeout(iv);
  }, [liveOverlay]);

  React.useEffect(() => {
    return () => { if (liveTimerRef.current) clearTimeout(liveTimerRef.current); };
  }, []);

  const toast = useToast();

  const BACKOFF_KEY = 'scan429Backoff';
  const MAX_BACKOFF = 300;

  const getBackoff    = () => { try { const r = sessionStorage.getItem(BACKOFF_KEY); return r ? JSON.parse(r) : { count: 0 }; } catch { return { count: 0 }; } };
  const setBackoff    = (s) => { try { sessionStorage.setItem(BACKOFF_KEY, JSON.stringify(s)); } catch {} };
  const resetBackoff  = ()  => { try { sessionStorage.removeItem(BACKOFF_KEY); } catch {} };

  function incrementBackoff(baseSeconds) {
    const s = getBackoff();
    const nextCount = (s.count || 0) + 1;
    const pause = Math.min(baseSeconds * Math.pow(2, nextCount - 1), MAX_BACKOFF);
    const next = { count: nextCount, pause, until: Date.now() + pause * 1000 };
    setBackoff(next);
    return next;
  }

  // ── Step 1: After successful scan — ask for notifications + record memory ──
  async function handlePostScan(result) {
    // Record into AI memory
    try { memoryRecordScan(result, gymMode); } catch {}

    // Check for proactive health patterns and send notification
    try {
      const insights = getInsights();
      if (insights.length > 0) {
        notifyHealthPattern(insights[0]);
      }
    } catch {}

    // Ask for notification permission after first scan (best moment)
    try {
      if (shouldAskPermission()) {
        const perm = await requestPermission();
        if (perm === 'granted') {
          scheduleDailyReminder(12);
          try { toast?.show?.('Daily reminders enabled!', { type: 'success' }); } catch {}
        }
      }
    } catch {}
  }

  const handleCapture = async (capturedFile, opts = { live: false }) => {
    try { trackEvent('scan_start'); } catch {}
    await runAnalysis(capturedFile, { navigateOnSuccess: !opts.live, liveFrame: opts.live });
  };

  const handleFileSelected = (selectedFile) => {
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const runAnalysis = async (imageFile, opts = { navigateOnSuccess: true, liveFrame: false }) => {
    setError('');
    setIsAnalyzing(true);
    try {
      const result = await analyzeScan(imageFile, gymMode, getGoal(), getPersona());
      try { trackEvent('scan_complete', { health_score: result.health_score }); } catch {}
      try { resetBackoff(); } catch {}
      try { recordScan(); } catch {}

      if (opts.liveFrame) {
        const badges = generateBadges(result, gymMode);
        setLiveOverlay({ food: result.food_name, score: result.health_score, verdict: result.verdict, badges, timestamp: Date.now() });
        try { trackEvent('scan_live_result', { health_score: result.health_score }); } catch {}
      } else {
        setCurrentScan(result);
        await handlePostScan(result); // ← Step 1: notifications + memory
        navigate('/results');
      }
    } catch (err) {
      try { trackEvent('scan_error', { message: err.message?.slice(0, 200) }); } catch {}
      const retrySec = err?.details?.retryInSeconds || 30;
      if (err.status === 429) {
        const { pause, count } = incrementBackoff(retrySec);
        const msg = `Rate limit reached. Pausing for ${pause}s (attempt ${count}).`;
        setError(msg);
        try { toast?.show?.(msg, { duration: pause * 1000 }); } catch {}
        setLive(false);
        if (liveTimerRef.current) clearTimeout(liveTimerRef.current);
        liveTimerRef.current = setTimeout(() => setLive(true), pause * 1000);
      } else {
        setError(err.message || 'Analysis failed. Please try again.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--void)', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'var(--sp-4) var(--margin-mobile)',
        background: 'linear-gradient(to bottom, rgba(5,5,5,0.8), transparent)',
      }}>
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-icon glass" aria-label="Go back" style={{ color: 'var(--on-surface)' }}>
          <ArrowLeft size={20} />
        </button>

        <div style={{ display: 'flex', background: 'rgba(14,14,16,0.8)', borderRadius: 'var(--r-full)', padding: 3, gap: 2, border: '1px solid var(--glass-border)' }}>
          {[{ id: 'camera', icon: Camera, label: 'Camera' }, { id: 'upload', icon: Upload, label: 'Upload' }].map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setMode(id)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
              borderRadius: 'var(--r-full)',
              background: mode === id ? 'var(--primary)' : 'transparent',
              color: mode === id ? 'var(--on-primary)' : 'var(--on-surface-muted)',
              border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)',
              fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', transition: 'all var(--t-base)',
            }}>
              <Icon size={13} />{label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        {mode === 'camera' ? (
          <div style={{ height: '100dvh' }}>
            <CameraView live={live} onLiveChange={setLive} onCapture={handleCapture} isAnalyzing={isAnalyzing} liveResult={liveOverlay} gymMode={gymMode} />
          </div>
        ) : (
          <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'var(--sp-16) var(--margin-mobile) var(--sp-8)', gap: 'var(--sp-6)' }}>
            <UploadZone onFileSelected={handleFileSelected} preview={preview} />
            {file && !isAnalyzing && (
              <Button variant="primary" size="lg" fullWidth onClick={() => runAnalysis(file)}>
                ANALYZE THIS OBJECT
              </Button>
            )}
            {isAnalyzing && (
              <div style={{ textAlign: 'center' }}>
                <p className="text-label anim-blink" style={{ color: 'var(--secondary)', letterSpacing: '0.15em' }}>AI ANALYZING...</p>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div style={{ position: 'fixed', bottom: 'var(--sp-8)', left: 'var(--margin-mobile)', right: 'var(--margin-mobile)', background: 'var(--error-bg)', border: '1px solid var(--error)', borderRadius: 'var(--r-lg)', padding: 'var(--sp-4)', zIndex: 50 }}>
          <p className="text-body-sm" style={{ color: 'var(--error)' }}>{error}</p>
        </div>
      )}
    </div>
  );
}
