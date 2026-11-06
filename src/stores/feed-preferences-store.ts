import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { FeedContentType } from '@/lib/api';
import { feedContentTypes, toggleFeedType, type FeedViewMode } from '@/lib/feed';
import { secureStorage } from '@/lib/storage';

type FeedPreferencesState = {
  view: FeedViewMode;
  excludedTypes: FeedContentType[];
  setView: (view: FeedViewMode) => void;
  toggleType: (type: FeedContentType) => void;
  showAll: () => void;
};

function validExcludedTypes(value: unknown): FeedContentType[] {
  if (!Array.isArray(value)) return [];
  return feedContentTypes.filter((type) => value.includes(type));
}

export const useFeedPreferencesStore = create<FeedPreferencesState>()(
  persist(
    (set) => ({
      view: 'card',
      excludedTypes: [],
      setView: (view) => set({ view }),
      toggleType: (type) => set((state) => ({
        excludedTypes: toggleFeedType(state.excludedTypes, type),
      })),
      showAll: () => set({ excludedTypes: [] }),
    }),
    {
      name: 'feed-preferences',
      storage: createJSONStorage(() => secureStorage),
      partialize: ({ view, excludedTypes }) => ({ view, excludedTypes }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<FeedPreferencesState> | undefined;
        return {
          ...current,
          view: saved?.view === 'compact' || saved?.view === 'card' ? saved.view : current.view,
          excludedTypes: validExcludedTypes(saved?.excludedTypes),
        };
      },
    },
  ),
);

export function useFeedPreferencesHydrated() {
  return useSyncExternalStore(
    (onChange) => useFeedPreferencesStore.persist.onFinishHydration(onChange),
    () => useFeedPreferencesStore.persist.hasHydrated(),
    () => false,
  );
}
