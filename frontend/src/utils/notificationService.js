import { useNotificationStore } from '../store/useNotificationStore';

class NotificationService {
  constructor() {
    this.systemNotificationsEnabled = false;
    this.checkNotificationPermission();
  }

  /**
   * Check and request notification permission from browser
   */
  async checkNotificationPermission() {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        this.systemNotificationsEnabled = true;
      } else if (Notification.permission !== 'denied') {
        try {
          const permission = await Notification.requestPermission();
          this.systemNotificationsEnabled = permission === 'granted';
        } catch (error) {
          console.error('Failed to request notification permission:', error);
        }
      }
    }
  }

  /**
   * Show both toast and system notification
   * @param {Object} options
   * @param {string} options.title - Notification title
   * @param {string} options.message - Notification message
   * @param {string} options.type - 'success', 'error', 'warning', 'info'
   * @param {number} options.duration - Toast duration in ms (0 = manual dismiss)
   * @param {boolean} options.systemNotif - Show system notification (default: true)
   * @param {string} options.icon - Icon path or emoji for system notification
   */
  notify({ 
    title, 
    message, 
    type = 'info', 
    duration = 4000,
    systemNotif = true,
    icon = null 
  }) {
    const { addNotification } = useNotificationStore.getState();

    // Add toast to app
    const notificationId = addNotification({
      title,
      message,
      type,
      duration,
    });

    // Show system notification if enabled
    if (systemNotif && this.systemNotificationsEnabled && 'Notification' in window) {
      try {
        const systemTitle = title || 'ScanAndSee';
        new Notification(systemTitle, {
          body: message,
          icon: icon || '/icons/icon-192x192.png',
          badge: '/icons/icon-96x96.png',
          tag: `notification-${notificationId}`,
          requireInteraction: type === 'error',
        });
      } catch (error) {
        console.error('Failed to show system notification:', error);
      }
    }

    return notificationId;
  }

  // Convenience methods
  success(title, message, options = {}) {
    return this.notify({
      title,
      message,
      type: 'success',
      ...options,
    });
  }

  error(title, message, options = {}) {
    return this.notify({
      title,
      message,
      type: 'error',
      duration: 6000, // errors stay longer
      ...options,
    });
  }

  warning(title, message, options = {}) {
    return this.notify({
      title,
      message,
      type: 'warning',
      duration: 5000,
      ...options,
    });
  }

  info(title, message, options = {}) {
    return this.notify({
      title,
      message,
      type: 'info',
      ...options,
    });
  }

  /**
   * Request notification permission explicitly
   */
  async requestPermission() {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        this.systemNotificationsEnabled = permission === 'granted';
        return permission;
      } catch (error) {
        console.error('Failed to request notification permission:', error);
        return 'denied';
      }
    }
    return 'unavailable';
  }

  /**
   * Check if system notifications are available
   */
  isAvailable() {
    return 'Notification' in window;
  }

  /**
   * Get current permission status
   */
  getPermissionStatus() {
    if ('Notification' in window) {
      return Notification.permission;
    }
    return 'unavailable';
  }
}

export const notificationService = new NotificationService();

/**
 * Hook for using notifications in components
 */
export const useNotification = () => {
  return {
    notify: notificationService.notify.bind(notificationService),
    success: notificationService.success.bind(notificationService),
    error: notificationService.error.bind(notificationService),
    warning: notificationService.warning.bind(notificationService),
    info: notificationService.info.bind(notificationService),
    requestPermission: notificationService.requestPermission.bind(notificationService),
  };
};
