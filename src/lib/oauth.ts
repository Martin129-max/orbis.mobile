import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import {
  getOAuthUrl,
  type OAuthProvider,
  type OAuthSignupDetails,
} from '@/lib/api';
import { safeNext } from '@/lib/navigation';
import { secureStorage } from '@/lib/storage';

const PENDING_OAUTH_KEY = 'oauth-pending-v1';
const PENDING_SIGNUP_KEY = 'oauth-signup-v1';
const PENDING_AVATAR_KEY = 'oauth-avatar-v1';
const PENDING_OAUTH_TTL_MS = 10 * 60 * 1000;
const CALLBACK_PARAMS = ['provider', 'code', 'state', 'error', 'error_description'] as const;
let takingPendingOAuth = false;

export type PendingOAuth = {
  provider: OAuthProvider;
  nonce: string;
  token: string | null;
  destination: string;
  startedAt: number;
};

export type OAuthCallbackParams = Partial<Record<(typeof CALLBACK_PARAMS)[number], string>>;

export type PendingOAuthAvatar = {
  provider: OAuthProvider;
  url: string;
  token: string;
  accountToken: string;
  destination: string;
};

const providers: OAuthProvider[] = ['discord', 'twitch'];

export function isOAuthProvider(value: string): value is OAuthProvider {
  return providers.includes(value as OAuthProvider);
}

function isPendingOAuth(value: unknown): value is PendingOAuth {
  if (!value || typeof value !== 'object') return false;
  const pending = value as Partial<PendingOAuth>;
  return (
    typeof pending.provider === 'string' &&
    isOAuthProvider(pending.provider) &&
    typeof pending.nonce === 'string' &&
    /^[a-f0-9]{64}$/.test(pending.nonce) &&
    (typeof pending.token === 'string' || pending.token === null) &&
    typeof pending.destination === 'string' &&
    pending.destination.startsWith('/') &&
    typeof pending.startedAt === 'number'
  );
}

export function callbackParams(url: string): OAuthCallbackParams {
  const query = new URL(url).searchParams;
  const params: OAuthCallbackParams = {};
  for (const key of CALLBACK_PARAMS) {
    const value = query.get(key);
    if (value !== null) params[key] = value;
  }
  return params;
}

export async function startOAuth(
  provider: OAuthProvider,
  token: string | null,
  destination: string,
): Promise<OAuthCallbackParams | null> {
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  const nonce = Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  const safeDestination = safeNext(destination);
  const pending: PendingOAuth = {
    provider,
    nonce,
    token,
    destination:
      safeDestination && safeDestination.length <= 512
        ? safeDestination
        : '/(protected)/(tabs)',
    startedAt: Date.now(),
  };
  await secureStorage.removeItem(PENDING_SIGNUP_KEY);
  await secureStorage.setItem(PENDING_OAUTH_KEY, JSON.stringify(pending));

  try {
    const url = await getOAuthUrl(provider, nonce, token ?? undefined);
    const result = await WebBrowser.openAuthSessionAsync(
      url,
      Linking.createURL('auth/callback'),
    );
    if (Platform.OS === 'android') return null;
    if (result.type === 'success') return callbackParams(result.url);
    await clearPendingOAuth();
    return null;
  } catch (error) {
    await clearPendingOAuth();
    throw error;
  }
}

export async function takePendingOAuth(): Promise<PendingOAuth | null> {
  if (takingPendingOAuth) return null;
  takingPendingOAuth = true;
  try {
    const raw = await secureStorage.getItem(PENDING_OAUTH_KEY);
    await secureStorage.removeItem(PENDING_OAUTH_KEY);
    if (!raw) return null;

    let pending: unknown;
    try {
      pending = JSON.parse(raw);
    } catch {
      throw new Error('The saved sign-in attempt is invalid. Please try again.');
    }
    if (!isPendingOAuth(pending)) {
      throw new Error('The saved sign-in attempt is invalid. Please try again.');
    }
    if (Date.now() - pending.startedAt > PENDING_OAUTH_TTL_MS) {
      throw new Error('This sign-in attempt has expired. Please try again.');
    }
    return pending;
  } finally {
    takingPendingOAuth = false;
  }
}

export async function clearPendingOAuth() {
  await secureStorage.removeItem(PENDING_OAUTH_KEY);
}

export async function clearOAuthState() {
  await Promise.all(
    [PENDING_OAUTH_KEY, PENDING_SIGNUP_KEY, PENDING_AVATAR_KEY].map((key) =>
      secureStorage.removeItem(key),
    ),
  );
}

export async function savePendingOAuthSignup(signup: OAuthSignupDetails) {
  await secureStorage.setItem(PENDING_SIGNUP_KEY, JSON.stringify(signup));
}

export async function getPendingOAuthSignup(): Promise<OAuthSignupDetails | null> {
  const raw = await secureStorage.getItem(PENDING_SIGNUP_KEY);
  if (!raw) return null;
  try {
    const signup: unknown = JSON.parse(raw);
    if (
      signup &&
      typeof signup === 'object' &&
      'provider' in signup &&
      typeof signup.provider === 'string' &&
      isOAuthProvider(signup.provider) &&
      'token' in signup &&
      typeof signup.token === 'string' &&
      'username' in signup &&
      typeof signup.username === 'string' &&
      'avatarUrl' in signup &&
      (typeof signup.avatarUrl === 'string' || signup.avatarUrl === null)
    ) {
      return signup as OAuthSignupDetails;
    }
  } catch {
    throw new Error('The saved sign-up attempt is invalid. Please try again.');
  }
  throw new Error('The saved sign-up attempt is invalid. Please try again.');
}

export async function clearPendingOAuthSignup() {
  await secureStorage.removeItem(PENDING_SIGNUP_KEY);
}

export async function savePendingOAuthAvatar(avatar: PendingOAuthAvatar) {
  await secureStorage.setItem(PENDING_AVATAR_KEY, JSON.stringify(avatar));
}

export async function getPendingOAuthAvatar(): Promise<PendingOAuthAvatar | null> {
  const raw = await secureStorage.getItem(PENDING_AVATAR_KEY);
  if (!raw) return null;
  try {
    const avatar: unknown = JSON.parse(raw);
    if (
      avatar &&
      typeof avatar === 'object' &&
      'provider' in avatar &&
      typeof avatar.provider === 'string' &&
      isOAuthProvider(avatar.provider) &&
      'url' in avatar &&
      typeof avatar.url === 'string' &&
      'token' in avatar &&
      typeof avatar.token === 'string' &&
      'accountToken' in avatar &&
      typeof avatar.accountToken === 'string' &&
      'destination' in avatar &&
      typeof avatar.destination === 'string' &&
      avatar.destination.startsWith('/')
    ) {
      return avatar as PendingOAuthAvatar;
    }
  } catch {
    throw new Error('The saved avatar offer is invalid. Please try again.');
  }
  throw new Error('The saved avatar offer is invalid. Please try again.');
}

export async function clearPendingOAuthAvatar() {
  await secureStorage.removeItem(PENDING_AVATAR_KEY);
}
