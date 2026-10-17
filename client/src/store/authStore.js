import { create } from 'zustand';
import api, { errMessage } from '../services/api.js';

export const useAuthStore = create((set, get) => ({
  user: null,
  status: 'loading', // loading | ready | guest
  error: null,

  async bootstrap() {
    try {
      const { data } = await api.get('/api/v1/auth/me');
      set({ user: data.user, status: 'ready', error: null });
    } catch {
      set({ user: null, status: 'guest' });
    }
  },

  async login(email, password) {
    set({ error: null });
    try {
      const { data } = await api.post('/api/v1/auth/login', { email, password });
      set({ user: data.user, status: 'ready' });
      return data.user;
    } catch (err) {
      const msg = errMessage(err);
      set({ error: msg });
      throw new Error(msg);
    }
  },

  async register(name, email, password) {
    set({ error: null });
    try {
      const { data } = await api.post('/api/v1/auth/register', { name, email, password });
      set({ user: data.user, status: 'ready' });
      return data;
    } catch (err) {
      const msg = errMessage(err);
      set({ error: msg });
      throw new Error(msg);
    }
  },

  async logout() {
    try {
      await api.post('/api/v1/auth/logout');
    } finally {
      set({ user: null, status: 'guest' });
    }
  },

  async updateUser(patch) {
    const { data } = await api.patch('/api/v1/me/profile', patch);
    set({ user: data.user });
    return data.user;
  },

  async updatePrefs(patch) {
    const { data } = await api.patch('/api/v1/me/preferences', patch);
    set({ user: data.user });
    return data.user;
  },
}));
