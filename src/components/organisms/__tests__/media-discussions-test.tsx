import { renderRouter, screen } from 'expo-router/testing-library';
import * as api from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

import { MediaDiscussions } from '../media-discussions';

jest.mock('@/lib/api', () => ({
  ...jest.requireActual('@/lib/api'),
  getMediaProfile: jest.fn(),
  getMediaPosts: jest.fn(),
}));

const getMediaProfile = api.getMediaProfile as jest.Mock;
const getMediaPosts = api.getMediaPosts as jest.Mock;

async function openTitle() {
  await renderRouter(
    { 'library/[type]/[sourceId]': () => <MediaDiscussions /> },
    { initialUrl: '/library/anime/123' },
  );
}

describe('media discussions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getMediaProfile.mockResolvedValue({
      type: 'anime',
      sourceId: '123',
      title: 'Example title',
      coverImage: null,
      year: 2024,
      score: null,
      altTitles: [],
      synopsis: 'A short description.',
      bannerImage: null,
      releaseStatus: 'finished',
      genres: ['Adventure'],
    });
    getMediaPosts.mockResolvedValue({ items: [], nextCursor: null });
    useAuthStore.setState({
      token: 'token',
      sessionExpired: false,
      profile: {
        userId: 7,
        username: 'sakura',
        email: 'sakura@example.test',
        avatarUrl: null,
        coverUrl: null,
        backgroundUrl: null,
        theme: 'dark',
        appearOffline: false,
        status: 'online',
        isPublic: true,
        showNsfw: false,
        showChangelog: true,
        isAdmin: false,
        isHeadAdmin: false,
        emailVerifiedAt: '2026-10-01T00:00:00.000Z',
        createdAt: '2026-10-01T00:00:00.000Z',
      },
    });
  });

  it('loads the title and its discussion list', async () => {
    await openTitle();

    expect(await screen.findByText('Example title')).toBeTruthy();
    expect(await screen.findByText('No discussions yet. Start the conversation.')).toBeTruthy();
    expect(getMediaProfile).toHaveBeenCalledWith('token', 'anime', '123');
    expect(getMediaPosts).toHaveBeenCalledWith('token', 'anime', '123');
  });

  it('shows the adult-content restriction instead of a title page', async () => {
    getMediaProfile.mockRejectedValue(
      new Error('This title is 18+. Check your adult-content settings.'),
    );

    await openTitle();

    expect(await screen.findByText(
      'This title is 18+. Check your adult-content settings.',
    )).toBeTruthy();
    expect(screen.queryByText('Example title')).toBeNull();
  });
});
