import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as api from '@/lib/api';
import type { LoginCredentials, Profile, SignupDetails } from '@/lib/api';
import { secureStorage } from '@/lib/storage';

type AuthState = {
  token: string | null;
  profile: Profile | null;
  login: (credentials: LoginCredentials, signal?: AbortSignal) => Promise<void>;
  signup: (details: SignupDetails, signal?: AbortSignal) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<Profile | null>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      profile: null,
      login: async (credentials, signal) => {
        set({ token: await api.login(credentials, signal) });
      },
      signup: async (details, signal) => {
        set({ token: await api.signup(details, signal) });
      },
      logout: () => set({ token: null, profile: null }),
      fetchProfile: async () => {
        const { token } = get();

        if (!token) {
          set({ profile: null });
          return null;
        }

        const profile = await api.getProfile(token);
        if (!profile) {
          get().logout();
          return null;
        }

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

export function useAuthHydrated() {
  return useSyncExternalStore(
    (onChange) => useAuthStore.persist.onFinishHydration(onChange),
    () => useAuthStore.persist.hasHydrated(),
    () => false,
  );
}
