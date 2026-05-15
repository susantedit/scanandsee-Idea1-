import { create } from 'zustand';

export const useAdminStore = create((set) => ({
  adminUser: null,
  adminRole: null,
  permissions: [],
  isLoading: false,
  error: null,

  setAdmin: (admin) => set({ adminUser: admin }),
  setRole: (role) => set({ adminRole: role }),
  setPermissions: (permissions) => set({ permissions }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  hasPermission: (permission) => {
    const state = useAdminStore.getState();
    return state.permissions.includes(permission) || state.adminRole === 'admin';
  },

  logout: () => {
    set({
      adminUser: null,
      adminRole: null,
      permissions: [],
      error: null,
    });
  },
}));
