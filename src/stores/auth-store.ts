import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as api from '@/lib/api';
import type { LoginCredentials, Profile, SignupDetails } from '@/lib/api';
import { secureStorage } from '@/lib/storage';

type AuthState = {
  token: string | null;
  profile: Profile | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (details: SignupDetails) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<Profile | null>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      profile: null,
      login: async (credentials) => {
        set({ token: await api.login(credentials) });
      },
      signup: async (details) => {
        set({ token: await api.signup(details) });
      },
      logout: () => set({ token: null, profile: null }),
      fetchProfile: async () => {
        const { token } = get();

        if (!token) {
          set({ profile: null });
          return null;
        }

        try {
          const profile = await api.getProfile(token);
          set({ profile: profile ?? null });
          return profile;
        } catch {
          set({ profile: null });
          return null;
        }
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
