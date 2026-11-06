import {
  filterFeedItems,
  getNewFeedItems,
  mergeFeedItems,
  shownFeedTypes,
  toggleFeedType,
} from '../feed';
import type { Activity, Post } from '../api';

const post = (id: number, createdAt = '2026-11-06T10:00:00.000Z'): Post => ({
  type: 'post',
  id,
  communityId: 1,
  content: 'Post',
  linkUrl: null,
  commentCount: 0,
  likeCount: 0,
  liked: false,
  createdAt,
  author: { id: 1, username: 'sakura', name: null, avatarUrl: null },
  community: null,
  wallUser: null,
});

const activity = (id: number, createdAt: string): Activity => ({
  type: 'activity',
  id,
  commentCount: 0,
  likeCount: 0,
  liked: false,
  createdAt,
  author: { id: 1, username: 'sakura', name: null, avatarUrl: null },
  status: 'current',
  progress: null,
  media: {
    type: 'anime',
    sourceId: String(id),
    title: 'Naruto',
    coverImage: null,
    year: 2002,
  },
});

describe('feed helpers', () => {
  it('keeps at least one content type visible', () => {
    expect(toggleFeedType([], 'post')).toEqual(['post']);
    expect(toggleFeedType(['activity'], 'post')).toEqual(['activity']);
    expect(toggleFeedType(['post'], 'post')).toEqual([]);
    expect(shownFeedTypes(['post', 'activity'])).toEqual(['post', 'activity']);
  });

  it('merges pages without duplicating entries by type and id', () => {
    expect(mergeFeedItems([post(1)], [post(1), activity(1, '2026-11-06T11:00:00.000Z')]))
      .toEqual([post(1), activity(1, '2026-11-06T11:00:00.000Z')]);
  });

  it('filters items by the visible content types', () => {
    expect(filterFeedItems([post(1), activity(1, '2026-11-06T11:00:00.000Z')], ['post']))
      .toEqual([post(1)]);
  });

  it('only surfaces unseen items newer than the current feed head', () => {
    const current = [post(1, '2026-11-06T10:00:00.000Z')];
    expect(getNewFeedItems(current, [
      post(1, '2026-11-06T10:00:00.000Z'),
      post(2, '2026-11-06T09:00:00.000Z'),
      activity(3, '2026-11-06T11:00:00.000Z'),
    ])).toEqual([activity(3, '2026-11-06T11:00:00.000Z')]);
  });
});
