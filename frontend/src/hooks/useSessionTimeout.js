/**
 * useSessionTimeout hook
 * 
 * Manages session timeout and activity tracking.
 * Should be used in the root component (e.g., App.jsx).
 * 
 * Usage:
 * ```jsx
 * function App() {
 *   useSessionTimeout();
 *   return <Routes>...</Routes>;
 * }
 * ```
 */

import { useEffect, useRef } from 'react';
import { 
  startSessionTimeout, 
  resetSessionTimeout, 
  clearExistingTimeouts 
} from '../services/sessionTimeout';

const ACTIVITY_EVENTS = [
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
  'click',
  'mousemove',
  'wheel',
  'change',
  'submit',
];

export function useSessionTimeout() {
  const timeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    // Start initial session timeout
    startSessionTimeout();

    // Create activity handler with debounce
    const createActivityHandler = () => {
      let isScheduled = false;

      return () => {
        if (!isScheduled) {
          isScheduled = true;
          
          // Debounce: only reset timeout every 1 minute
          const timeSinceLastActivity = Date.now() - lastActivityRef.current;
          if (timeSinceLastActivity > 60 * 1000) {
            lastActivityRef.current = Date.now();
            resetSessionTimeout();
          }
          
          // Reset flag after a short delay
          setTimeout(() => {
            isScheduled = false;
          }, 1000);
        }
      };
    };

    const activityHandler = createActivityHandler();

    // Attach listeners
    ACTIVITY_EVENTS.forEach(eventName => {
      document.addEventListener(eventName, activityHandler, true);
    });

    // Cleanup
    return () => {
      ACTIVITY_EVENTS.forEach(eventName => {
        document.removeEventListener(eventName, activityHandler, true);
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      clearExistingTimeouts();
    };
  }, []);

  // No render needed - this hook only manages side effects
  return null;
}
