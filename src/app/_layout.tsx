import {
  DarkTheme,
  DefaultTheme,
  SplashScreen,
  Stack,
  ThemeProvider,
} from 'expo-router';
import { useEffect } from 'react';
import { AppState, Appearance, useColorScheme, type AppStateStatus } from 'react-native';

import { useAuthHydrated, useAuthStore } from '@/stores/auth-store';
import { useMessagesStore } from '@/stores/messages-store';
import { useThemeHydrated, useThemeStore } from '@/stores/theme-store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const hydrated = useAuthHydrated();
  const themeHydrated = useThemeHydrated();
  const themeMode = useThemeStore((state) => state.mode);
  const signedIn = useAuthStore((state) => Boolean(state.token));
  const token = useAuthStore((state) => state.token);
  const connectMessages = useMessagesStore((state) => state.connect);
  const disconnectMessages = useMessagesStore((state) => state.disconnect);

  useEffect(() => {
    Appearance.setColorScheme(themeMode === 'system' ? 'auto' : themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (hydrated && themeHydrated) SplashScreen.hide();
  }, [hydrated, themeHydrated]);

  useEffect(() => {
    if (!hydrated || !token) {
      disconnectMessages();
      return;
    }

    function onAppStateChange(state: AppStateStatus) {
      if (state === 'active') connectMessages();
      else disconnectMessages();
    }

    if (AppState.currentState === 'active') connectMessages();
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => {
      subscription.remove();
      disconnectMessages();
    };
  }, [connectMessages, disconnectMessages, hydrated, token]);

  if (!hydrated || !themeHydrated) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
        </Stack.Protected>
        <Stack.Screen name="(protected)" />
      </Stack>
    </ThemeProvider>
  );
}
