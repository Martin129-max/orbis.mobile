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

export type Community = {
  id: number;
  name: string;
  iconUrl: string | null;
};

export type Author = {
  id: number;
  username: string;
  name: string | null;
  avatarUrl: string | null;
};

export type CommunitySummary = Pick<Community, 'id' | 'name' | 'iconUrl'>;

export type Post = {
  type: 'post';
  id: number;
  communityId: number | null;
  content: string;
  linkUrl: string | null;
  commentCount: number;
  likeCount: number;
  liked: boolean;
  hiddenAt?: string | null;
  createdAt: string;
  author: Author;
  community: CommunitySummary | null;
  wallUser: Author | null;
};

export type Thread = {
  type: 'thread';
  id: number;
  communityId: number;
  title: string;
  content: string;
  linkUrl: string | null;
  score: number;
  commentCount: number;
  myVote: number;
  createdAt: string;
  author: Author;
  community: CommunitySummary;
};

export type Activity = {
  type: 'activity';
  id: number;
  commentCount: number;
  likeCount: number;
  liked: boolean;
  createdAt: string;
  author: Author;
  status: 'current' | 'completed' | 'on_hold' | 'dropped' | 'planned';
  progress: { from: number; to: number } | null;
  media: {
    type: 'anime' | 'manga' | 'game';
    sourceId: string;
    title: string;
    coverImage: string | null;
    year: number | null;
  };
};

export type FeedEntry = Post | Thread | Activity;

export type NotificationItem = {
  id: number;
  type: 'like' | 'comment' | 'mention' | 'follow' | 'system';
  readAt: string | null;
  createdAt: string;
  title: string;
  body: string;
  actor: Author | null;
  targetUrl: string | null;
};

export type MessageThread = {
  id: number;
  user: Author;
  preview: string;
  updatedAt: string;
  unreadCount: number;
};

export type Page<T> = { items: T[]; nextCursor: string | null };

export async function api(path: string, init?: RequestInit) {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, init);
  } catch {
    throw new Error("Can't reach Orbis right now. Please try again.");
  }
  if (res.status === 429) {
    throw new Error(await errorMessage(res, 'You’re doing that too often. Try again in a minute.'));
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

export async function getCommunities(token: string): Promise<Community[]> {
  const res = await api('/communities', { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Could not load your communities.');
  return res.json();
}

export async function getNotifications(token: string): Promise<NotificationItem[]> {
  const res = await api('/notifications', { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Could not load your notifications.');
  return res.json();
}

export async function getMessages(token: string): Promise<MessageThread[]> {
  const res = await api('/messages', { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Could not load your messages.');
  return res.json();
}

export async function searchPeople(token: string, query: string): Promise<Author[]> {
  const params = new URLSearchParams({ q: query });
  const res = await api(`/friends/search?${params.toString()}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Could not search people.');
  return res.json();
}

export async function searchCommunities(token: string, query: string): Promise<Community[]> {
  const params = new URLSearchParams({ q: query });
  const res = await api(`/communities/search?${params.toString()}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Could not search communities.');
  return res.json();
}

export async function getFeed(token: string, cursor?: string): Promise<Page<FeedEntry>> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  const res = await api(`/feed${query}`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Could not load your feed.');
  return res.json();
}

export async function createWallPost(
  token: string,
  username: string,
  content: string,
  linkUrl?: string,
): Promise<Post> {
  const res = await api(`/users/${encodeURIComponent(username)}/posts`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, linkUrl }),
  });
  if (res.status === 400) throw new Error('Write something before posting.');
  if (!res.ok) throw new Error('Could not post. Please try again.');
  return res.json();
}

export async function createCommunityPost(
  token: string,
  communityId: number,
  content: string,
  linkUrl?: string,
): Promise<Post> {
  const res = await api(`/communities/${communityId}/posts`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, linkUrl }),
  });
  if (res.status === 400) throw new Error('Write something before posting.');
  if (!res.ok) throw new Error('Could not post. Please try again.');
  return res.json();
}

export async function setLike(
  token: string,
  type: 'post' | 'activity',
  id: number,
  liked: boolean,
): Promise<{ liked: boolean; likeCount: number }> {
  const res = await api('/likes', {
    method: 'PUT',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, id, liked }),
  });
  if (!res.ok) throw new Error('Could not save your like.');
  return res.json();
}

export async function vote(
  token: string,
  id: number,
  value: -1 | 0 | 1,
): Promise<{ score: number; myVote: number }> {
  const res = await api('/votes', {
    method: 'PUT',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'thread', id, value }),
  });
  if (!res.ok) throw new Error('Could not save your vote.');
  return res.json();
}
