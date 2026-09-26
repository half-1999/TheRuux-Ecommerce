import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, cartApi } from '../api/client';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      setSession: ({ user, accessToken }) => set({ user, accessToken }),
      clearSession: () => set({ user: null, accessToken: null }),
      login: async ({ email, password }) => {
        const data = await api.post('/auth/login', { email, password });
        set({ user: data.user, accessToken: data.accessToken });
        try {
          await cartApi.merge();
        } catch {
          /* guest merge optional */
        }
        return data;
      },
      register: async ({ name, email, password }) => {
        const data = await api.post('/auth/register', { name, email, password });
        set({ user: data.user, accessToken: data.accessToken });
        try {
          await cartApi.merge();
        } catch {
          /* guest merge optional */
        }
        return data;
      },
      logout: async () => {
        const token = get().accessToken;
        try {
          if (token) await api.post('/auth/logout', null, { token });
        } finally {
          set({ user: null, accessToken: null });
        }
      },
      refresh: async () => {
        const data = await api.post('/auth/refresh');
        set({ user: data.user, accessToken: data.accessToken });
        return data;
      },
    }),
    {
      name: 'theruux-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
      }),
    },
  ),
);
