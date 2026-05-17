/**
 * Push Notification Service
 * Handles permission, local notifications, daily reminders, achievement alerts.
 */

const NOTIF_KEY = 'scanandsee_notif_prefs';
const loadPrefs = () => { try { return JSON.parse(localStorage.getItem(NOTIF_KEY) || '{}'); } catch { return {}; } };
const savePrefs = (p) => { try { localStorage.setItem(NOTIF_KEY, JSON.stringify(p)); } catch {} };

export async function requestPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  const result = await Notification.requestPermission();
  savePrefs({ ...loadPrefs(), permissionAsked: true, permission: result });
  return result;
}

export const getPermission = () => !('Notification' in window) ? 'unsupported' : Notification.permission;

export function showNotification(title, body, options = {}) {
  if (Notification.permission !== 'granted') return;
  try {
    navigator.serviceWorker?.ready.then(r => r.showNotification(title, {
      body, icon: '/icons/icon-192.png', badge: '/icons/icon-96.png',
      tag: options.tag || 'scanandsee', vibrate: [100, 50, 100],
      data: options.url ? { url: options.url } : {}, ...options,
    })).catch(() => new Notification(title, { body, icon: '/icons/icon-192.png' }));
  } catch {}
}

export function scheduleDailyReminder(hourOfDay = 12) {
  const prefs = loadPrefs();
  if (prefs.dailyReminderScheduled) return;
  const now = new Date(), next = new Date();
  next.setHours(hourOfDay, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  setTimeout(() => {
    showNotification('ScanAndSee', "What are you eating today? Scan it before you eat.", { tag: 'daily', url: '/scan' });
    savePrefs({ ...loadPrefs(), dailyReminderScheduled: false });
    scheduleDailyReminder(hourOfDay);
  }, next.getTime() - now.getTime());
  savePrefs({ ...loadPrefs(), dailyReminderScheduled: true });
}

export const notifyAchievement  = (title, desc) => showNotification(`🏆 ${title}`, desc, { tag: 'achievement', url: '/profile' });
export const notifyHealthPattern = (msg)         => showNotification('Health Alert', msg, { tag: 'health', url: '/history' });
export const shouldAskPermission = ()            => 'Notification' in window && Notification.permission === 'default' && !loadPrefs().permissionAsked;
