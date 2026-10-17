import { create } from 'zustand';

let toastId = 0;

export const useUIStore = create((set, get) => ({
  toasts: [],
  sidebarOpen: true,
  theme: 'dark',
  reducedMotion: false,

  toast(message, kind = 'info', ttl = 4200) {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts, { id, message, kind }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, ttl);
  },

  dismissToast(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },

  toggleSidebar() {
    set((s) => ({ sidebarOpen: !s.sidebarOpen }));
  },

  setSidebar(open) {
    set({ sidebarOpen: open });
  },

  async applyUserPrefs(user) {
    const theme = user?.preferences?.theme || 'dark';
    const reducedMotion = Boolean(user?.preferences?.reducedMotion);
    set({ theme, reducedMotion });
    document.documentElement.dataset.theme = theme === 'system' ? prefersTheme() : theme;
    document.documentElement.dataset.reducedMotion = String(reducedMotion);
  },

  setTheme(theme) {
    set({ theme });
    document.documentElement.dataset.theme = theme === 'system' ? prefersTheme() : theme;
  },

  setReducedMotion(reducedMotion) {
    set({ reducedMotion });
    document.documentElement.dataset.reducedMotion = String(reducedMotion);
  },
}));

function prefersTheme() {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}
