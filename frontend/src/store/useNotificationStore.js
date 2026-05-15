import { create } from 'zustand';

export const useNotificationStore = create((set) => ({
  notifications: [],

  addNotification: (notification) => {
    const id = Date.now();
    const newNotification = {
      id,
      type: 'info', // 'success', 'error', 'warning', 'info'
      duration: 4000, // ms
      ...notification,
    };

    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));

    // Auto-dismiss after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      }, newNotification.duration);
    }

    return id;
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearAll: () => {
    set({ notifications: [] });
  },
}));
