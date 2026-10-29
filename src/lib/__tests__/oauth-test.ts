import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import {
  callbackParams,
  clearOAuthState,
  savePendingOAuthSignup,
  startOAuth,
  takePendingOAuth,
} from '../oauth';

const mockStorage = new Map<string, string>();

jest.mock('@/lib/storage', () => ({
  secureStorage: {
    getItem: async (key: string) => mockStorage.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      mockStorage.set(key, value);
    },
    removeItem: async (key: string) => {
      mockStorage.delete(key);
    },
  },
}));

jest.mock('@/lib/api', () => ({
  getOAuthUrl: jest.fn(async () => 'https://discord.test/authorize'),
}));

jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn(async () => new Uint8Array(32).fill(7)),
}));

jest.mock('expo-linking', () => ({
  createURL: (path: string) => `orbis://${path}`,
}));

jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn(),
}));

const openAuthSession = WebBrowser.openAuthSessionAsync as jest.Mock;

function setPlatform(os: typeof Platform.OS) {
  Object.defineProperty(Platform, 'OS', { configurable: true, get: () => os });
}

describe('OAuth sign-in', () => {
  beforeEach(() => {
    mockStorage.clear();
    openAuthSession.mockReset();
    jest.restoreAllMocks();
  });

  afterAll(() => setPlatform('ios'));

  it('reads only the callback fields from the return link', () => {
    expect(
      callbackParams('orbis://auth/callback?provider=discord&code=abc&state=xyz&extra=ignored'),
    ).toEqual({ provider: 'discord', code: 'abc', state: 'xyz' });
  });

  it('returns to the callback screen on iOS and keeps the attempt for it', async () => {
    setPlatform('ios');
    openAuthSession.mockResolvedValue({
      type: 'success',
      url: 'orbis://auth/callback?provider=discord&code=abc&state=xyz',
    });

    const callback = await startOAuth('discord', null, '/settings');

    expect(callback).toEqual({ provider: 'discord', code: 'abc', state: 'xyz' });
    const pending = await takePendingOAuth();
    expect(pending).toMatchObject({ provider: 'discord', token: null, destination: '/settings' });
  });

  it('forgets the attempt when the sheet is closed on iOS', async () => {
    setPlatform('ios');
    openAuthSession.mockResolvedValue({ type: 'cancel' });

    await expect(startOAuth('twitch', null, '/')).resolves.toBeNull();
    await expect(takePendingOAuth()).resolves.toBeNull();
  });

  it('keeps the attempt on Android, where the app link arrives separately', async () => {
    setPlatform('android');
    openAuthSession.mockResolvedValue({ type: 'dismiss' });

    await expect(startOAuth('twitch', 'account-token', '/')).resolves.toBeNull();
    await expect(takePendingOAuth()).resolves.toMatchObject({
      provider: 'twitch',
      token: 'account-token',
    });
  });

  it('only lets an attempt be used once', async () => {
    setPlatform('android');
    openAuthSession.mockResolvedValue({ type: 'dismiss' });
    await startOAuth('discord', null, '/');

    await expect(takePendingOAuth()).resolves.not.toBeNull();
    await expect(takePendingOAuth()).resolves.toBeNull();
  });

  it('rejects an attempt older than ten minutes', async () => {
    setPlatform('android');
    openAuthSession.mockResolvedValue({ type: 'dismiss' });
    const startedAt = Date.now();
    await startOAuth('discord', null, '/');
    jest.spyOn(Date, 'now').mockReturnValue(startedAt + 11 * 60 * 1000);

    await expect(takePendingOAuth()).rejects.toThrow('This sign-in attempt has expired.');
  });

  it('clears every saved attempt, including copies of the account token', async () => {
    setPlatform('android');
    openAuthSession.mockResolvedValue({ type: 'dismiss' });
    await startOAuth('discord', 'account-token', '/');
    await savePendingOAuthSignup({
      provider: 'discord',
      token: 'signup-token',
      username: 'naruto',
      avatarUrl: null,
    });

    await clearOAuthState();

    expect(mockStorage.size).toBe(0);
  });
});
