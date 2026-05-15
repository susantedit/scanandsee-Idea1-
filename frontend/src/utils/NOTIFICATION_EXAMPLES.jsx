/**
 * NOTIFICATION SYSTEM USAGE EXAMPLES
 * 
 * Use the notificationService to show toasts + system notifications
 * in your React components.
 */

import { useNotification } from '../utils/notificationService';

// ============================================
// EXAMPLE 1: Basic Usage in Component
// ============================================
export function ScanResultsExample() {
  const { success, error } = useNotification();

  const handleScanResult = (result) => {
    if (result.confidence > 0.8) {
      success(
        'Food Identified',
        `${result.food} detected with ${Math.round(result.confidence * 100)}% confidence`
      );
    } else {
      error('Low Confidence', 'Please try a clearer photo');
    }
  };

  return <div>{/* Component content */}</div>;
}

// ============================================
// EXAMPLE 2: All Notification Types
// ============================================
export function NotificationTypesExample() {
  const { success, error, warning, info } = useNotification();

  return (
    <div>
      <button onClick={() => success('Success!', 'Operation completed successfully')}>
        Show Success
      </button>
      <button onClick={() => error('Error!', 'Something went wrong')}>
        Show Error
      </button>
      <button onClick={() => warning('Warning!', 'Please review this action')}>
        Show Warning
      </button>
      <button onClick={() => info('Info', 'Here is some useful information')}>
        Show Info
      </button>
    </div>
  );
}

// ============================================
// EXAMPLE 3: Custom Duration & System Notif Control
// ============================================
export function CustomNotificationExample() {
  const { notify } = useNotification();

  return (
    <div>
      {/* Notification stays for 8 seconds */}
      <button
        onClick={() =>
          notify({
            title: 'Long Message',
            message: 'This notification will stay for 8 seconds',
            type: 'info',
            duration: 8000,
          })
        }
      >
        Long Duration
      </button>

      {/* Only shows toast, no system notification */}
      <button
        onClick={() =>
          notify({
            title: 'App Only',
            message: 'No system notification for this',
            type: 'info',
            systemNotif: false,
          })
        }
      >
        App Toast Only
      </button>

      {/* Manual dismiss (duration: 0) */}
      <button
        onClick={() =>
          notify({
            title: 'Manual Dismiss',
            message: 'Click the X to dismiss this notification',
            type: 'warning',
            duration: 0, // Requires manual dismissal
          })
        }
      >
        Manual Dismiss
      </button>
    </div>
  );
}

// ============================================
// EXAMPLE 4: In Async Operations (Scans, API Calls)
// ============================================
export function AsyncOperationExample() {
  const { success, error, info } = useNotification();

  const performScan = async (imageFile) => {
    try {
      info('Scanning...', 'Analyzing food image');

      const response = await fetch('/api/scan/analyze', {
        method: 'POST',
        body: new FormData({ image: imageFile }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      success('Scan Complete!', `Found: ${result.foodName}`);
      return result;
    } catch (err) {
      error('Scan Failed', err.message);
      throw err;
    }
  };

  return <button onClick={(e) => performScan(e.target.files[0])}>Upload & Scan</button>;
}

// ============================================
// EXAMPLE 5: Achievement/Gamification Notification
// ============================================
export function AchievementExample() {
  const { success } = useNotification();

  const unlockBadge = (badgeName, description) => {
    success(
      `🏆 Badge Unlocked!`,
      `${badgeName}: ${description}`,
      {
        duration: 5000,
        systemNotif: true, // Show as system notification too
      }
    );
  };

  return (
    <button onClick={() => unlockBadge('Protein King', 'Completed 10 high-protein scans')}>
      Unlock Badge
    </button>
  );
}

// ============================================
// EXAMPLE 6: Requesting Notification Permission
// ============================================
export function SettingsExample() {
  const { requestPermission } = useNotification();

  const enableNotifications = async () => {
    const permission = await requestPermission();
    if (permission === 'granted') {
      console.log('Notifications enabled!');
    }
  };

  return (
    <button onClick={enableNotifications}>
      Enable Desktop Notifications
    </button>
  );
}

// ============================================
// INTEGRATION WITH App.jsx
// ============================================
/*
In your App.jsx, make sure ToastProvider is wrapping your app:

import { ToastProvider } from './components/ui/Toast';

function App() {
  return (
    <ToastProvider>
      {/* Your app routes */}
    </ToastProvider>
  );
}

The notification system will automatically work in any child component
that imports `useNotification()`.
*/
