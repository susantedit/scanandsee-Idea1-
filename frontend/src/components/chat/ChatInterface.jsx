import React, { useRef, useEffect } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition.js';

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 4, padding: 'var(--sp-3)', alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 7, height: 7,
          borderRadius: '50%',
          background: 'var(--primary)',
          animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  );
}

export default function ChatInterface({
  messages = [],
  onSend,
  isLoading = false,
  inputValue,
  setInputValue,
}) {
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const { start, stop, isListening, transcript, isSupported: sttSupported } =
    useSpeechRecognition({
      onResult: (text) => setInputValue(text),
    });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    onSend(inputValue.trim());
    setInputValue('');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 'var(--sp-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--sp-3)',
      }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              className="glass-card-sm"
              style={{
                padding: 'var(--sp-3) var(--sp-4)',
                maxWidth: '80%',
                borderLeft: msg.role === 'ai' ? '3px solid var(--primary)' : 'none',
              }}
            >
              <p className="text-body-sm" style={{ color: 'var(--on-surface)' }}>
                {msg.content}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div className="glass-card-sm" style={{ borderLeft: '3px solid var(--primary)' }}>
              <TypingIndicator />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: 'var(--sp-4)',
          borderTop: '1px solid var(--glass-border)',
          display: 'flex',
          gap: 'var(--sp-2)',
          alignItems: 'center',
          background: 'rgba(14,14,16,0.8)',
        }}
      >
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask about this food..."
          className="scan-input"
          style={{ flex: 1, paddingBottom: 8 }}
          disabled={isLoading}
        />

        {sttSupported && (
          <button
            type="button"
            onClick={isListening ? stop : start}
            className="btn btn-ghost btn-icon"
            style={{ color: isListening ? 'var(--error)' : 'var(--on-surface-muted)' }}
            aria-label={isListening ? 'Stop listening' : 'Voice input'}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
        )}

        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="btn btn-primary btn-sm"
          style={{ padding: '10px 14px' }}
          aria-label="Send message"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
