import * as api from '@/lib/api';
import { clearOAuthState } from '@/lib/oauth';

import { useAuthStore } from '../auth-store';

jest.mock('@/lib/storage', () => {
  const mockItems = new Map<string, string>();
  return {
    secureStorage: {
      getItem: async (key: string) => mockItems.get(key) ?? null,
      setItem: async (key: string, value: string) => {
        mockItems.set(key, value);
      },
      removeItem: async (key: string) => {
        mockItems.delete(key);
      },
    },
  };
});

jest.mock('@/lib/oauth', () => ({ clearOAuthState: jest.fn(async () => undefined) }));

jest.mock('@/lib/api', () => ({
  getProfile: jest.fn(),
  login: jest.fn(),
  signup: jest.fn(),
  setUnauthorizedHandler: jest.fn(),
}));

const getProfile = api.getProfile as jest.Mock;
const setUnauthorizedHandler = api.setUnauthorizedHandler as jest.Mock;
const unauthorizedHandler: (token: string) => void = setUnauthorizedHandler.mock.calls[0][0];

function profileFor(userId: number, username: string): api.Profile {
  return {
    userId,
    username,
    email: `${username}@anime.test`,
    avatarUrl: null,
    coverUrl: null,
    backgroundUrl: null,
    theme: 'dark',
    appearOffline: false,
    isPublic: true,
    isAdmin: false,
    isHeadAdmin: false,
    emailVerifiedAt: '2026-10-01T00:00:00.000Z',
    createdAt: '2026-10-01T00:00:00.000Z',
  };
}

describe('auth store', () => {
  beforeEach(() => {
    getProfile.mockReset();
    (clearOAuthState as jest.Mock).mockClear();
    useAuthStore.setState({ token: null, profile: null, sessionExpired: false });
  });

  it('ignores a profile that arrives after switching accounts', async () => {
    let finishFirst: (profile: api.Profile) => void = () => undefined;
    getProfile.mockReturnValueOnce(new Promise((resolve) => (finishFirst = resolve)));
    useAuthStore.getState().loginWithToken('token-a');

    const loading = useAuthStore.getState().fetchProfile();
    useAuthStore.getState().loginWithToken('token-b');
    finishFirst(profileFor(1, 'naruto'));

    await expect(loading).resolves.toBeNull();
    expect(useAuthStore.getState().profile).toBeNull();
    expect(useAuthStore.getState().token).toBe('token-b');
  });

  it('signs out only when the rejected token is the current one', () => {
    useAuthStore.getState().loginWithToken('token-b');

    unauthorizedHandler('token-a');
    expect(useAuthStore.getState().token).toBe('token-b');

    unauthorizedHandler('token-b');
    expect(useAuthStore.getState()).toMatchObject({ token: null, sessionExpired: true });
    expect(clearOAuthState).toHaveBeenCalled();
  });

  it('clears user data and pending sign-ins on logout', () => {
    useAuthStore.setState({ token: 'token-a', profile: profileFor(1, 'naruto') });

    useAuthStore.getState().logout();

    expect(useAuthStore.getState()).toMatchObject({ token: null, profile: null, sessionExpired: false });
    expect(clearOAuthState).toHaveBeenCalled();
  });

  it('forgets the expired-session notice after logging in again', () => {
    useAuthStore.setState({ sessionExpired: true });

    useAuthStore.getState().loginWithToken('token-c');

    expect(useAuthStore.getState().sessionExpired).toBe(false);
  });
});
