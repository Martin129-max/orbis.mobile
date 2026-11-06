import type { FeedContentType, FeedEntry } from './api';

export const feedContentTypes: FeedContentType[] = ['post', 'activity'];

export type FeedViewMode = 'card' | 'compact';

export function shownFeedTypes(excluded: FeedContentType[]) {
  const shown = feedContentTypes.filter((type) => !excluded.includes(type));
  return shown.length ? shown : feedContentTypes;
}

export function toggleFeedType(
  excluded: FeedContentType[],
  type: FeedContentType,
): FeedContentType[] {
  const normalized = feedContentTypes.filter((item) => excluded.includes(item));
  const safeExcluded = normalized.length === feedContentTypes.length ? [] : normalized;
  const shown = shownFeedTypes(safeExcluded);
  if (shown.includes(type)) {
    if (shown.length === 1) return safeExcluded;
    return [...safeExcluded, type];
  }
  return safeExcluded.filter((item) => item !== type);
}

export function feedItemKey(item: FeedEntry) {
  return `${item.type}-${item.id}`;
}

export function filterFeedItems(items: FeedEntry[], visibleTypes: FeedContentType[]) {
  return items.filter((item) => visibleTypes.includes(item.type));
}

export function mergeFeedItems(existing: FeedEntry[], incoming: FeedEntry[]) {
  const seen = new Set(existing.map(feedItemKey));
  return [
    ...existing,
    ...incoming.filter((item) => {
      const key = feedItemKey(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }),
  ];
}

export function getNewFeedItems(current: FeedEntry[], incoming: FeedEntry[]) {
  const seen = new Set(current.map(feedItemKey));
  const newest = Math.max(0, ...current.map((item) => new Date(item.createdAt).getTime()));
  return incoming.filter(
    (item) =>
      !seen.has(feedItemKey(item)) &&
      new Date(item.createdAt).getTime() > newest,
  );
}
