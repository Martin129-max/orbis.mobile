export const APP_ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  tabs: '/(protected)/(tabs)',
  homeTab: '/(protected)/(tabs)/index',
  communitiesTab: '/(protected)/(tabs)/communities',
  libraryTab: '/(protected)/(tabs)/library',
  messagesTab: '/(protected)/(tabs)/messages',
  profileTab: '/(protected)/(tabs)/profile',
  search: '/search',
  notifications: '/notifications',
  settings: '/settings',
  community: (communityId: number) => `/communities/${communityId}`,
  user: (username: string) => `/users/${encodeURIComponent(username)}`,
  notification: (notificationId: number) => `/notifications/${notificationId}`,
} as const;

export function safeNext(value: string | string[] | undefined): string | null {
  const next = Array.isArray(value) ? value[0] : value;
  if (
    !next ||
    next.length > 2048 ||
    !next.startsWith('/') ||
    next.startsWith('//') ||
    next.includes('\\') ||
    /[\u0000-\u001f]/.test(next)
  ) {
    return null;
  }

  try {
    const url = new URL(next, 'https://orbis.invalid');
    if (url.origin !== 'https://orbis.invalid') return null;
    if (url.pathname === '/login' || url.pathname === '/register') return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function pathWithQuery(
  pathname: string,
  params: Record<string, string | string[] | undefined>,
  segments: readonly string[],
): string {
  const routeKeys = new Set(
    segments.flatMap((segment) => {
      const match = /^\[(?:\.\.\.)?([^\]]+)\]$/.exec(segment);
      return match ? [match[1]] : [];
    }),
  );
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (routeKeys.has(key)) continue;
    const values = Array.isArray(value) ? value : value === undefined ? [] : [value];
    for (const item of values) query.append(key, item);
  }

  const search = query.toString();
  return search ? `${pathname}?${search}` : pathname;
}
