import { useState, useRef, useCallback } from 'react';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

/**
 * Hook for Web Speech Recognition API (voice input).
 */
export function useSpeechRecognition({ onResult, onEnd } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript,  setTranscript]  = useState('');
  const [isSupported] = useState(() => !!SpeechRecognition);
  const recognitionRef = useRef(null);

  const start = useCallback(() => {
    if (!isSupported) return;

    const recognition = new SpeechRecognition();
    recognition.lang          = 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (e) => {
      const text = Array.from(e.results)
        .map(r => r[0].transcript)
        .join('');
      setTranscript(text);
      if (e.results[e.results.length - 1].isFinal) {
        onResult?.(text);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      onEnd?.();
    };

    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setTranscript('');
  }, [isSupported, onResult, onEnd]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { start, stop, isListening, transcript, isSupported };
}
