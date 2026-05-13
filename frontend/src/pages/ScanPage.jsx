import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, ArrowLeft } from 'lucide-react';
import CameraView from '../components/scan/CameraView.jsx';
import UploadZone from '../components/scan/UploadZone.jsx';
import Button from '../components/ui/Button.jsx';
import { analyzeScan } from '../services/api.js';
import useAppStore from '../store/useAppStore.js';

export default function ScanPage() {
  const navigate = useNavigate();
  const { gymMode, setCurrentScan, setIsAnalyzing, isAnalyzing, getPersona, getGoal } = useAppStore();

  const [mode,    setMode]    = useState('camera'); // 'camera' | 'upload'
  const [file,    setFile]    = useState(null);
  const [preview, setPreview] = useState(null);
  const [error,   setError]   = useState('');

  const handleCapture = async (capturedFile) => {
    await runAnalysis(capturedFile);
  };

  const handleFileSelected = (selectedFile) => {
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const runAnalysis = async (imageFile) => {
    setError('');
    setIsAnalyzing(true);
    try {
      const result = await analyzeScan(imageFile, gymMode, getGoal(), getPersona());
      setCurrentScan(result);
      navigate('/results');
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--void)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Top bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--sp-4) var(--margin-mobile)',
        background: 'linear-gradient(to bottom, rgba(5,5,5,0.8), transparent)',
      }}>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-ghost btn-icon glass"
          aria-label="Go back"
          style={{ color: 'var(--on-surface)' }}
        >
          <ArrowLeft size={20} />
        </button>

        {/* Mode toggle */}
        <div style={{
          display: 'flex',
          background: 'rgba(14,14,16,0.8)',
          borderRadius: 'var(--r-full)',
          padding: 3,
          gap: 2,
          border: '1px solid var(--glass-border)',
        }}>
          {[
            { id: 'camera', icon: Camera, label: 'Camera' },
            { id: 'upload', icon: Upload, label: 'Upload' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 'var(--r-full)',
                background: mode === id ? 'var(--primary)' : 'transparent',
                color: mode === id ? 'var(--on-primary)' : 'var(--on-surface-muted)',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                transition: 'all var(--t-base)',
              }}
            >
              <Icon size={13} />
              {label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, position: 'relative' }}>
        {mode === 'camera' ? (
          <div style={{ height: '100dvh' }}>
            <CameraView onCapture={handleCapture} isAnalyzing={isAnalyzing} />
          </div>
        ) : (
          <div style={{
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: 'var(--sp-16) var(--margin-mobile) var(--sp-8)',
            gap: 'var(--sp-6)',
          }}>
            <UploadZone onFileSelected={handleFileSelected} preview={preview} />

            {file && !isAnalyzing && (
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => runAnalysis(file)}
              >
                ANALYZE THIS FOOD
              </Button>
            )}

            {isAnalyzing && (
              <div style={{ textAlign: 'center' }}>
                <p className="text-label anim-blink" style={{ color: 'var(--secondary)', letterSpacing: '0.15em' }}>
                  AI ANALYZING...
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div style={{
          position: 'fixed',
          bottom: 'var(--sp-8)',
          left: 'var(--margin-mobile)',
          right: 'var(--margin-mobile)',
          background: 'var(--error-bg)',
          border: '1px solid var(--error)',
          borderRadius: 'var(--r-lg)',
          padding: 'var(--sp-4)',
          zIndex: 50,
        }}>
          <p className="text-body-sm" style={{ color: 'var(--error)' }}>{error}</p>
        </div>
      )}
    </div>
  );
}
