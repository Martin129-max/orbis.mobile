import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as api from '@/lib/api';
import type { LoginCredentials, Profile, SignupDetails } from '@/lib/api';
import { clearOAuthState } from '@/lib/oauth';
import { secureStorage } from '@/lib/storage';

type AuthState = {
  token: string | null;
  profile: Profile | null;
  sessionExpired: boolean;
  login: (credentials: LoginCredentials, signal?: AbortSignal) => Promise<void>;
  loginWithToken: (token: string) => void;
  setAvatarUrl: (avatarUrl: string | null) => void;
  signup: (details: SignupDetails, signal?: AbortSignal) => Promise<void>;
  logout: () => void;
  expireSession: (token: string) => void;
  fetchProfile: () => Promise<Profile | null>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      profile: null,
      sessionExpired: false,
      login: async (credentials, signal) => {
        const token = await api.login(credentials, signal);
        set({ token, profile: null, sessionExpired: false });
      },
      loginWithToken: (token) => {
        set({ token, profile: null, sessionExpired: false });
      },
      setAvatarUrl: (avatarUrl) => {
        set((state) =>
          state.profile ? { profile: { ...state.profile, avatarUrl } } : state,
        );
      },
      signup: async (details, signal) => {
        const token = await api.signup(details, signal);
        set({ token, profile: null, sessionExpired: false });
      },
      logout: () => {
        set({ token: null, profile: null, sessionExpired: false });
        void clearOAuthState();
      },
      expireSession: (token) => {
        if (get().token !== token) return;
        set({ token: null, profile: null, sessionExpired: true });
        void clearOAuthState();
      },
      fetchProfile: async () => {
        const { token } = get();

        if (!token) {
          set({ profile: null });
          return null;
        }

        const profile = await api.getProfile(token);
        if (!profile || get().token !== token) return null;

        set({ profile });
        return profile;
      },
    }),
    {
      name: 'auth',
      storage: createJSONStorage(() => secureStorage),
      partialize: ({ token }) => ({ token }),
    },
  ),
);

api.setUnauthorizedHandler((token) => useAuthStore.getState().expireSession(token));

export function useAuthHydrated() {
  return useSyncExternalStore(
    (onChange) => useAuthStore.persist.onFinishHydration(onChange),
    () => useAuthStore.persist.hasHydrated(),
    () => false,
  );
}
