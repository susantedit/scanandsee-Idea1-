import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Hook for Web Speech API TTS playback.
 * Supports personality-based speech params.
 */
export function useVoice() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported] = useState(() => 'speechSynthesis' in window);
  const utteranceRef = useRef(null);

  // Cancel on unmount
  useEffect(() => {
    return () => {
      if (utteranceRef.current) window.speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback((text, speechParams = {}) => {
    if (!isSupported || !text) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate   = speechParams.rate   ?? 1.0;
    utterance.pitch  = speechParams.pitch  ?? 1.0;
    utterance.volume = speechParams.volume ?? 1.0;
    utterance.lang   = 'en-US';

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend   = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  }, []);

  const toggle = useCallback((text, speechParams) => {
    if (isPlaying) {
      stop();
    } else {
      speak(text, speechParams);
    }
  }, [isPlaying, speak, stop]);

  return { speak, stop, toggle, isPlaying, isSupported };
}
