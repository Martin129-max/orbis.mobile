import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import * as Atom from '@atom';
import * as Template from '@template';

import { completeOAuth } from '@/lib/api';
import { safeNext } from '@/lib/navigation';
import {
  isOAuthProvider,
  savePendingOAuthSignup,
  takePendingOAuth,
} from '@/lib/oauth';
import { useAuthStore } from '@/stores/auth-store';

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function OAuthCallbackScreen() {
  const params = useLocalSearchParams<{
    provider?: string | string[];
    code?: string | string[];
    state?: string | string[];
    error?: string | string[];
  }>();
  const loginWithToken = useAuthStore((state) => state.loginWithToken);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function finish() {
      const pending = await takePendingOAuth();
      const providerValue = first(params.provider) ?? '';
      if (!pending) throw new Error('This sign-in attempt has expired or was already handled.');
      if (!isOAuthProvider(providerValue ?? '') || pending.provider !== providerValue) {
        throw new Error('The sign-in provider did not match the request. Please try again.');
      }

      const currentToken = useAuthStore.getState().token;
      if (currentToken !== pending.token) {
        throw new Error('Your account changed during sign-in. Please start again.');
      }

      if (first(params.error)) {
        throw new Error(
          first(params.error) === 'access_denied'
            ? 'Sign-in was cancelled.'
            : 'The provider could not authorize this sign-in.',
        );
      }

      const code = first(params.code);
      const state = first(params.state);
      if (!code || !state) {
        throw new Error('The provider returned an incomplete sign-in response. Please try again.');
      }

      const result = await completeOAuth(
        providerValue,
        { code, state, nonce: pending.nonce },
        pending.token,
      );

      if ('access_token' in result) {
        loginWithToken(result.access_token);
      } else if ('signup' in result) {
        await savePendingOAuthSignup({ provider: providerValue, ...result.signup });
        router.replace('/auth/oauth-signup' as Href);
        return;
      }

      router.replace((safeNext(pending.destination) ?? '/(protected)/(tabs)') as Href);
    }

    finish().catch((cause: unknown) => {
      setError(cause instanceof Error ? cause.message : 'Could not finish provider sign-in.');
    });
  }, [loginWithToken, params]);

  return (
    <Template.ScreenTemplate>
      <View style={{ width: '100%', gap: 16 }}>
        <Atom.ThemedText type="subtitle">
          {error ? 'Sign-in could not be completed' : 'Finishing sign-in…'}
        </Atom.ThemedText>
        {error ? (
          <>
            <Atom.ErrorMessage>{error}</Atom.ErrorMessage>
            <Atom.Button
              label={useAuthStore.getState().token ? 'Back to Orbis' : 'Back to log in'}
              variant="secondary"
              onPress={() => router.replace(
                (useAuthStore.getState().token ? '/(protected)/(tabs)' : '/login') as Href,
              )}
            />
          </>
        ) : null}
      </View>
    </Template.ScreenTemplate>
  );
}
