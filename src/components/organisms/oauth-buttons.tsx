import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as Atom from '@atom';

import { Spacing } from '@/constants/theme';
import { getOAuthProviders, type OAuthProvider } from '@/lib/api';
import { startOAuth } from '@/lib/oauth';
import { safeNext } from '@/lib/navigation';

const labels: Record<OAuthProvider, string> = {
  discord: 'Discord',
  twitch: 'Twitch',
};

export function OAuthButtons({
  token = null,
  destination = '/(protected)/(tabs)',
  connected = [],
}: {
  token?: string | null;
  destination?: string;
  connected?: OAuthProvider[];
}) {
  const [providers, setProviders] = useState<OAuthProvider[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<OAuthProvider | null>(null);
  const active = useRef(true);
  const launching = useRef(false);
  const target = safeNext(destination) ?? '/(protected)/(tabs)';

  useEffect(() => {
    active.current = true;
    getOAuthProviders()
      .then((available) => {
        if (active.current) setProviders(available);
      })
      .catch((cause: unknown) => {
        if (active.current) {
          setError(cause instanceof Error ? cause.message : 'Could not load sign-in providers.');
        }
      });
    return () => {
      active.current = false;
    };
  }, []);

  async function begin(provider: OAuthProvider) {
    if (launching.current) return;
    launching.current = true;
    setPending(provider);
    setError(null);
    try {
      await startOAuth(provider, token, target);
    } catch (cause) {
      if (active.current) {
        setError(cause instanceof Error ? cause.message : 'Could not start provider authentication.');
      }
    } finally {
      launching.current = false;
      if (active.current) setPending(null);
    }
  }

  const options = providers.filter((provider) => !connected.includes(provider));
  if (!options.length && !error) return null;

  return (
    <View style={styles.container}>
      {options.map((provider) => (
        <Atom.Button
          key={provider}
          label={`Continue with ${labels[provider]}`}
          variant="secondary"
          loading={pending === provider}
          disabled={pending !== null}
          onPress={() => begin(provider)}
        />
      ))}
      {error && <Atom.ErrorMessage>{error}</Atom.ErrorMessage>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
});
