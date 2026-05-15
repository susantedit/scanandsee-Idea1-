import React from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import './Toast.css';

const ToastContext = React.createContext(null);

function iconForType(type) {
  const iconProps = { size: 20, strokeWidth: 2 };
  switch (type) {
    case 'success':
      return <CheckCircle {...iconProps} className="toast-icon-success" />;
    case 'warning':
      return <AlertTriangle {...iconProps} className="toast-icon-warning" />;
    case 'error':
      return <AlertCircle {...iconProps} className="toast-icon-error" />;
    default:
      return <Info {...iconProps} className="toast-icon-info" />;
  }
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([]);

  const show = (message, opts = {}) => {
    const id = Math.random().toString(36).slice(2, 9);
    const toast = {
      id,
      message,
      type: opts.type || 'info',
      duration: typeof opts.duration === 'number' ? opts.duration : (opts.until ? Math.max(0, Math.ceil((opts.until - Date.now()) / 1000)) * 1000 : 5000),
      until: opts.until || null,
    };
    setToasts(t => [...t, toast]);

    if (toast.duration !== 0) {
      setTimeout(() => hide(id), toast.duration);
    }
    return id;
  };

  const hide = (id) => setToasts(t => t.filter(x => x.id !== id));

  return (
    <ToastContext.Provider value={{ show, hide }}>
      {children}
      <div aria-live="polite" style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 9999 }}>
        {toasts.map(t => (
          <ToastCard key={t.id} toast={t} onHide={() => hide(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onHide }) {
  const { id, message, type, until } = toast;
  const [secondsLeft, setSecondsLeft] = React.useState(until ? Math.max(0, Math.ceil((until - Date.now()) / 1000)) : null);

  React.useEffect(() => {
    if (!until) return undefined;
    const iv = setInterval(() => {
      const s = Math.max(0, Math.ceil((until - Date.now()) / 1000));
      setSecondsLeft(s);
      if (s <= 0) clearInterval(iv);
    }, 1000);
    return () => clearInterval(iv);
  }, [until]);

  return (
    <div className={`toast toast-${type}`} role="alert" aria-live="polite">
      <div className="toast-icon-wrapper">
        {iconForType(type)}
      </div>
      <div className="toast-content">
        <div className="toast-message">{message}</div>
        {secondsLeft !== null && (
          <div className="toast-timer">{secondsLeft}s</div>
        )}
      </div>
      <button
        className="toast-close"
        onClick={onHide}
        aria-label="Dismiss toast"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export default ToastProvider;
