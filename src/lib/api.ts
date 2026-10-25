import Constants from 'expo-constants';

function devServerUrl() {
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${host ?? 'localhost'}:4000`;
}

export const API_URL = process.env.EXPO_PUBLIC_API_URL || devServerUrl();

export type LoginCredentials = { identifier: string; password: string };

export type SignupDetails = { email: string; username: string; password: string };

export type Profile = {
  userId: number;
  email: string;
  username: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  backgroundUrl: string | null;
  theme: string;
  appearOffline: boolean;
  isPublic: boolean;
  isAdmin: boolean;
  isHeadAdmin: boolean;
  createdAt: string;
};

export async function api(path: string, init?: RequestInit) {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, init);
  } catch {
    throw new Error("Can't reach Orbis right now. Please try again.");
  }
  if (res.status === 429) {
    throw new Error('You’re doing that too often. Try again in a minute.');
  }
  return res;
}

function authHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function errorMessage(res: Response, fallback: string) {
  const { message } = await res.json().catch(() => ({ message: null }));
  return typeof message === 'string' ? `${message}.` : fallback;
}

async function authenticate(
  path: string,
  credentials: LoginCredentials | SignupDetails,
): Promise<string> {
  const res = await api(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (res.status === 401) {
    throw new Error('Invalid username, email, or password.');
  }
  if (res.status === 409) {
    throw new Error(await errorMessage(res, 'That account already exists.'));
  }
  if (res.status === 400) {
    throw new Error('Usernames are 3–20 characters: letters, numbers, or underscores.');
  }
  if (!res.ok) throw new Error('Something went wrong. Please try again.');

  const { access_token } = await res.json();
  return access_token;
}

export function signup(details: SignupDetails) {
  return authenticate('/auth/signup', details);
}

export function login(credentials: LoginCredentials) {
  return authenticate('/auth/login', credentials);
}

export async function getProfile(token: string): Promise<Profile | null> {
  const res = await api('/users', { headers: authHeaders(token) });

  return res.ok ? res.json() : null;
}

export async function getServerStatus(): Promise<string> {
  const res = await api('/');
  return res.text();
}
