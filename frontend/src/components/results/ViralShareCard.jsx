import React, { useRef } from 'react';
import { Camera, Download, X } from 'lucide-react';
import html2canvas from 'html2canvas';

export default function ViralShareCard({ scan, onClose }) {
  const cardRef = useRef(null);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2, // high res
        useCORS: true,
        backgroundColor: '#050505',
      });
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `scanandsee-${scan.foodName.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = url;
      link.click();
    } catch (err) {
      console.error('Failed to generate image', err);
    }
  };

  const getVerdictColor = (verdict) => {
    if (verdict === 'HEALTHY' || verdict === 'SAFE') return 'var(--primary)';
    if (verdict === 'MODERATE' || verdict === 'CAUTION') return 'var(--warning)';
    return 'var(--error)';
  };

  const vColor = getVerdictColor(scan.verdict);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', zIndex: 100,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 'var(--sp-4)'
    }}>
      <div style={{ alignSelf: 'flex-end', marginBottom: 'var(--sp-4)' }}>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', padding: 8, cursor: 'pointer' }}>
          <X size={24} color="#fff" />
        </button>
      </div>

      {/* The 9:16 Card */}
      <div ref={cardRef} style={{
        width: 300, height: 533, // 9:16 aspect ratio
        background: 'var(--surface)',
        borderRadius: 'var(--r-xl)',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: `0 0 40px ${vColor}30`,
        display: 'flex', flexDirection: 'column'
      }}>
        {/* Background Image / Gradient */}
        <div style={{ height: '40%', position: 'relative' }}>
          {scan.imageUrl ? (
            <img src={scan.imageUrl} crossOrigin="anonymous" alt={scan.foodName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: `linear-gradient(to bottom, ${vColor}40, transparent)` }} />
          )}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(to top, var(--surface), transparent)' }} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: 'var(--sp-6)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: '-20px', zIndex: 1 }}>
          <div style={{ 
            width: 80, height: 80, borderRadius: '50%', 
            background: 'var(--surface-high)', border: `4px solid ${vColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 'var(--sp-4)'
          }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: vColor }}>{scan.healthScore}</span>
          </div>

          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 var(--sp-2) 0', color: 'var(--on-surface)', lineHeight: 1.1 }}>
            {scan.foodName}
          </h2>
          
          <div style={{ background: `${vColor}20`, color: vColor, padding: '4px 12px', borderRadius: 'var(--r-full)', fontSize: 12, fontWeight: 700, marginBottom: 'var(--sp-6)' }}>
            {scan.verdict}
          </div>

          <div style={{ width: '100%', textAlign: 'left', flex: 1 }}>
             <p style={{ fontSize: 14, color: 'var(--on-surface-muted)', margin: 0, lineHeight: 1.4 }}>
               {scan.bodyConsequences?.[0] || scan.voiceExplanation?.split('.')[0] + '.' || "This food has interesting effects."}
             </p>
          </div>

          {/* Footer Branding */}
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-2)', opacity: 0.6 }}>
            <Camera size={14} color="var(--primary)" />
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.1em' }}>SCANANDSEE</span>
          </div>
        </div>
      </div>

      <button onClick={handleDownload} style={{
        marginTop: 'var(--sp-6)',
        display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
        background: 'var(--primary)', color: 'var(--on-primary)',
        border: 'none', padding: '12px 24px', borderRadius: 'var(--r-full)',
        fontSize: 16, fontWeight: 700, cursor: 'pointer',
        boxShadow: 'var(--glow-sm-green)'
      }}>
        <Download size={20} />
        SAVE FOR TIKTOK
      </button>
    </div>
  );
}
