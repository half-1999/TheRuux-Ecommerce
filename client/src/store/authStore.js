import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, cartApi } from '../api/client';

let refreshInFlight = null;

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      setSession: ({ user, accessToken }) => set({ user, accessToken }),
      clearSession: () => set({ user: null, accessToken: null }),
      login: async ({ email, password }) => {
        const data = await api.post('/auth/login', { email, password });
        if (data.mfaRequired) return data;
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
      confirmMfa: async ({ mfaToken, code }) => {
        const data = await api.post('/auth/mfa', { mfaToken, code });
        set({ user: data.user, accessToken: data.accessToken });
        try {
          await cartApi.merge();
        } catch {
          /* guest merge optional */
        }
        return data;
      },
      refresh: () => {
        if (!refreshInFlight) {
          refreshInFlight = api
            .post('/auth/refresh')
            .then((data) => {
              set({ user: data.user, accessToken: data.accessToken });
              return data;
            })
            .finally(() => {
              refreshInFlight = null;
            });
        }
        return refreshInFlight;
      },
    }),
    {
      name: 'theruux-auth',
      version: 2,
      migrate: (persisted) => ({ user: persisted?.user || null }),
      partialize: (state) => ({ user: state.user }),
      // This runs inside create(), before useAuthStore exists. Reading it here throws and /admin stays blank.
      onRehydrateStorage: () => () => {
        queueMicrotask(() => {
          const { user, refresh, clearSession } = useAuthStore.getState();
          if (!user) return;
          refresh().catch(() => clearSession());
        });
      },
    },
  ),
);
