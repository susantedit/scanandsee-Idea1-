import { useState, useRef, useCallback } from 'react';

/**
 * Hook for camera access and photo capture.
 */
export function useCamera() {
  const videoRef   = useRef(null);
  const streamRef  = useRef(null);
  const [isActive, setIsActive]   = useState(false);
  const [error,    setError]      = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' = back camera

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width:  { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsActive(true);
    } catch (err) {
      setError(err.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access.'
        : 'Could not access camera. Try uploading an image instead.'
      );
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsActive(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return null;

    const canvas = document.createElement('canvas');
    canvas.width  = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const file = new File([blob], 'scan.jpg', { type: 'image/jpeg' });
        resolve(file);
      }, 'image/jpeg', 0.92);
    });
  }, []);

  const flipCamera = useCallback(() => {
    stopCamera();
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  }, [stopCamera]);

  return {
    videoRef,
    isActive,
    error,
    facingMode,
    startCamera,
    stopCamera,
    capturePhoto,
    flipCamera,
  };
}
