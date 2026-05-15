import React, { useRef } from 'react';
import { Share2, Download } from 'lucide-react';
import { scoreToColor } from '../../utils/scoreColor.js';
import Button from '../ui/Button.jsx';

export default function ShareCard({ scan }) {
  const canvasRef = useRef(null);

  const generateCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const W = 800, H = 800;
    canvas.width = W;
    canvas.height = H;

    const score = scan.health_score ?? scan.healthScore ?? 0;
    const { color } = scoreToColor(score);

    // Background
    ctx.fillStyle = '#131315';
    ctx.fillRect(0, 0, W, H);

    // Gradient overlay
    const grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W/2);
    grad.addColorStop(0, 'rgba(0,238,252,0.06)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Border
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 20, W-40, H-40);

    // App name
    ctx.fillStyle = '#00e639';
    ctx.font = 'bold 28px Sora, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ScanAndSee', W/2, 80);

    // Food name
    ctx.fillStyle = '#e5e1e4';
    ctx.font = 'bold 42px sans-serif';
    // Truncate long food names
    const foodName = (scan.food_name || scan.foodName || 'Unknown Food').slice(0, 30);
    ctx.fillText(foodName, W/2, 180);

    // Score
    ctx.fillStyle = color;
    ctx.font = 'bold 120px sans-serif';
    ctx.fillText(score.toFixed(1), W/2, 340);

    ctx.fillStyle = '#b9ccb2';
    ctx.font = '24px monospace';
    ctx.fillText('HEALTH SCORE / 10', W/2, 390);

    // Verdict
    ctx.fillStyle = color;
    ctx.font = 'bold 32px monospace';
    ctx.fillText(scan.verdict || '', W/2, 460);

    // Macros
    const cal  = scan.calories  || 0;
    const prot = scan.protein_g ?? scan.protein ?? 0;
    const carb = scan.carbs_g   ?? scan.carbs   ?? 0;
    const fat  = scan.fats_g    ?? scan.fats    ?? 0;
    ctx.fillStyle = '#b9ccb2';
    ctx.font = '22px sans-serif';
    ctx.fillText(`${cal} kcal  •  ${prot}g protein  •  ${carb}g carbs  •  ${fat}g fat`, W/2, 540);

    // Footer
    ctx.fillStyle = '#6e6e70';
    ctx.font = '18px Space Mono, monospace';
    ctx.fillText('scanandsee.app', W/2, H - 50);

    return canvas.toDataURL('image/png');
  };

  const handleDownload = () => {
    const dataUrl = generateCard();
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    const name = (scan.food_name || scan.foodName || 'scan').replace(/\s+/g, '-').toLowerCase();
    a.download = `scanandsee-${name}.png`;
    a.click();
  };

  const handleShare = async () => {
    const dataUrl = generateCard();
    if (!dataUrl) return;

    if (navigator.share) {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'scan-result.png', { type: 'image/png' });
      await navigator.share({ files: [file], title: `My ${scan.food_name} scan`, text: `Health Score: ${scan.health_score}/10 — ${scan.verdict}` });
    } else {
      handleDownload();
    }
  };

  return (
    <>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
        <Button variant="outline" icon={<Share2 size={14} />} onClick={handleShare}>
          Share
        </Button>
        <Button variant="ghost" icon={<Download size={14} />} onClick={handleDownload}>
          Save
        </Button>
      </div>
    </>
  );
}
