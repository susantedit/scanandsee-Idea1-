/**
 * SessionWarning Component
 * 
 * Shows a warning toast when session is about to expire.
 * Appears 5 minutes before auto-logout.
 * 
 * Usage:
 * ```jsx
 * function App() {
 *   return (
 *     <>
 *       <SessionWarning />
 *       {/* rest of app */}
 *     </>
 *   );
 * }
 * ```
 */

import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function SessionWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const handleSessionExpiring = () => {
      setShowWarning(true);
      setTimeLeft(300); // 5 minutes in seconds
    };

    const handleSessionReset = () => {
      setShowWarning(false);
      setTimeLeft(0);
    };

    window.addEventListener('session-expiring', handleSessionExpiring);
    window.addEventListener('session-reset', handleSessionReset);

    return () => {
      window.removeEventListener('session-expiring', handleSessionExpiring);
      window.removeEventListener('session-reset', handleSessionReset);
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!showWarning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showWarning]);

  if (!showWarning) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const handleExtendSession = async () => {
    setIsRefreshing(true);
    try {
      // Get a fresh token by reloading auth state
      const { getAuthToken } = await import('../services/firebase');
      await getAuthToken();
      setShowWarning(false);
      setIsRefreshing(false);
    } catch (error) {
      console.error('Failed to refresh session:', error);
      setIsRefreshing(false);
      // Show error toast
    }
  };

  return (
    <div className="fixed top-4 right-4 bg-gradient-to-r from-yellow-900 to-orange-900 text-yellow-100 p-4 rounded-lg shadow-2xl flex items-start gap-4 z-50 max-w-md border border-yellow-700">
      {/* Icon */}
      <div className="flex-shrink-0 mt-1">
        <AlertTriangle size={24} className="text-yellow-300" />
      </div>

      {/* Content */}
      <div className="flex-grow">
        <p className="font-semibold text-yellow-100">Session Expiring Soon</p>
        <p className="text-sm text-yellow-200 mt-1">
          Your session will expire in{' '}
          <span className="font-mono font-bold">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </p>
        <p className="text-xs text-yellow-200 mt-2">
          Click "Stay Logged In" to keep your session active, or your data will be saved and you'll be logged out.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 flex-shrink-0 ml-2">
        <button
          onClick={handleExtendSession}
          disabled={isRefreshing}
          className="px-3 py-1.5 bg-yellow-600 text-white rounded text-sm font-medium hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          {isRefreshing ? 'Refreshing...' : 'Stay Logged In'}
        </button>
        <button
          onClick={() => setShowWarning(false)}
          className="px-3 py-1.5 bg-transparent border border-yellow-400 text-yellow-200 rounded text-sm hover:bg-yellow-900/30 transition-colors whitespace-nowrap"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
