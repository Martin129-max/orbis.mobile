export const APP_ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  tabs: '/(tabs)',
  homeTab: '/(tabs)/index',
  communitiesTab: '/(tabs)/communities',
  libraryTab: '/(tabs)/library',
  messagesTab: '/(tabs)/messages',
  profileTab: '/(tabs)/profile',
  search: '/search',
  notifications: '/notifications',
  settings: '/settings',
  community: (communityId: number) => `/communities/${communityId}`,
  user: (username: string) => `/users/${encodeURIComponent(username)}`,
  notification: (notificationId: number) => `/notifications/${notificationId}`,
} as const;

export const appRoutes = APP_ROUTES;
export const routeMap = APP_ROUTES;
export const deepLinkMap = {
  community: APP_ROUTES.community,
  user: APP_ROUTES.user,
  notification: APP_ROUTES.notification,
};
