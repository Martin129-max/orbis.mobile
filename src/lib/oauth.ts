import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import {
  getOAuthUrl,
  type OAuthProvider,
  type OAuthSignupDetails,
} from '@/lib/api';
import { safeNext } from '@/lib/navigation';
import { secureStorage } from '@/lib/storage';

const PENDING_OAUTH_KEY = 'oauth-pending-v1';
const PENDING_SIGNUP_KEY = 'oauth-signup-v1';
let takingPendingOAuth = false;

export type PendingOAuth = {
  provider: OAuthProvider;
  nonce: string;
  token: string | null;
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
    pending.destination.startsWith('/')
  );
}

export async function startOAuth(
  provider: OAuthProvider,
  token: string | null,
  destination: string,
) {
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
  };
  await secureStorage.removeItem(PENDING_SIGNUP_KEY);
  await secureStorage.setItem(PENDING_OAUTH_KEY, JSON.stringify(pending));

  try {
    const url = await getOAuthUrl(provider, nonce, token ?? undefined);
    const result = await WebBrowser.openAuthSessionAsync(
      url,
      Linking.createURL('auth/callback'),
    );
    if (result.type !== 'success') {
      await clearPendingOAuth();
    }
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
    return pending;
  } finally {
    takingPendingOAuth = false;
  }
}

export async function clearPendingOAuth() {
  await secureStorage.removeItem(PENDING_OAUTH_KEY);
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
