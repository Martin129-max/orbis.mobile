import { Redirect, Stack, useGlobalSearchParams, usePathname } from 'expo-router';

import { pathWithQuery, safeNext } from '@/lib/navigation';
import { useAuthStore } from '@/stores/auth-store';

export default function ProtectedLayout() {
  const signedIn = useAuthStore((state) => Boolean(state.token));
  const pathname = usePathname();
  const params = useGlobalSearchParams<Record<string, string | string[]>>();
  const next = safeNext(pathWithQuery(pathname, params));

  if (!signedIn) {
    return <Redirect href={{ pathname: '/login', params: next ? { next } : undefined }} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
