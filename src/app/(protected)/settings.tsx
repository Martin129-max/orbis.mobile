import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, View } from 'react-native';
import * as Atom from '@atom';
import * as Template from '@template';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  disconnectOAuth,
  getOAuthConnections,
  setShowLive,
  type OAuthConnections,
  type OAuthProvider,
} from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import * as Organism from '@organism';

const providerLabels: Record<OAuthProvider, string> = {
  discord: 'Discord',
  twitch: 'Twitch',
};

export default function SettingsScreen() {
  const theme = useTheme();
  const token = useAuthStore((state) => state.token);
  const [accounts, setAccounts] = useState<OAuthConnections | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const active = useRef(true);

  const loadConnections = useCallback(async () => {
    if (!token) return;
    try {
      const result = await getOAuthConnections(token);
      if (active.current) {
        setAccounts(result);
        setError(null);
      }
    } catch (cause) {
      if (active.current) {
        setError(cause instanceof Error ? cause.message : 'Could not load your connected accounts.');
      }
    }
  }, [token]);

  useEffect(() => {
    active.current = true;
    if (token) {
      getOAuthConnections(token)
        .then((result) => {
          if (active.current) {
            setAccounts(result);
            setError(null);
          }
        })
        .catch((cause: unknown) => {
          if (active.current) {
            setError(
              cause instanceof Error
                ? cause.message
                : 'Could not load your connected accounts.',
            );
          }
        });
    }
    return () => {
      active.current = false;
    };
  }, [token]);

  async function disconnect(provider: OAuthProvider) {
    if (!token || pending) return;
    setPending(provider);
    setError(null);
    try {
      await disconnectOAuth(token, provider);
      await loadConnections();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not disconnect this account.');
    } finally {
      setPending(null);
    }
  }

  async function updateLive(provider: OAuthProvider, showLive: boolean) {
    if (!token || pending) return;
    setPending(`${provider}-live`);
    setError(null);
    try {
      await setShowLive(token, provider, showLive);
      setAccounts((current) => current && ({
        ...current,
        connections: current.connections.map((connection) =>
          connection.provider === provider ? { ...connection, showLive } : connection,
        ),
      }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update this setting.');
    } finally {
      setPending(null);
    }
  }

  const connected = accounts?.connections.map((connection) => connection.provider) ?? [];

  return (
    <Template.ScreenTemplate>
      <View style={styles.page}>
        <Atom.ThemedText type="subtitle">Settings</Atom.ThemedText>
        <Atom.ThemedText themeColor="textSecondary">
          Manage your connected accounts and Twitch live status.
        </Atom.ThemedText>
        <View style={styles.section}>
          <Atom.ThemedText type="smallBold">Connected accounts</Atom.ThemedText>
          {accounts ? (
            accounts.connections.length ? (
              accounts.connections.map((connection) => (
                <View
                  key={connection.provider}
                  style={[styles.connection, { borderBottomColor: theme.divider }]}>
                  <View style={styles.connectionInfo}>
                    <Atom.ThemedText type="smallBold">
                      {providerLabels[connection.provider]} · {connection.username}
                    </Atom.ThemedText>
                    {connection.provider === 'twitch' ? (
                      <View style={styles.preference}>
                        <Atom.ThemedText type="small" themeColor="textSecondary">
                          Show live status
                        </Atom.ThemedText>
                        <Switch
                          accessibilityLabel="Show Twitch live status"
                          value={connection.showLive}
                          disabled={pending !== null}
                          onValueChange={(value) => updateLive(connection.provider, value)}
                        />
                      </View>
                    ) : null}
                  </View>
                  <Atom.Button
                    label="Disconnect"
                    variant="secondary"
                    loading={pending === connection.provider}
                    disabled={
                      pending !== null ||
                      (!accounts.hasPassword && accounts.connections.length === 1)
                    }
                    onPress={() => disconnect(connection.provider)}
                  />
                </View>
              ))
            ) : (
              <Atom.ThemedText type="small" themeColor="textSecondary">
                No provider accounts are connected.
              </Atom.ThemedText>
            )
          ) : (
            <ActivityIndicator />
          )}
          {error && <Atom.ErrorMessage>{error}</Atom.ErrorMessage>}
          {!accounts && error ? (
            <Atom.Button
              label="Try again"
              variant="secondary"
              disabled={!token}
              onPress={() => {
                if (!token) return;
                setError(null);
                void loadConnections();
              }}
            />
          ) : null}
          {accounts && (
            <Organism.OAuthButtons
              token={token}
              destination="/settings"
              connected={connected}
            />
          )}
          {accounts && !accounts.hasPassword && accounts.connections.length === 1 ? (
            <Atom.ThemedText type="small" themeColor="textSecondary">
              Add a password or another sign-in method before disconnecting this account.
            </Atom.ThemedText>
          ) : null}
        </View>
      </View>
    </Template.ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  page: {
    width: '100%',
    gap: Spacing.three,
  },
  section: {
    gap: Spacing.two,
  },
  connection: {
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  connectionInfo: {
    gap: Spacing.one,
  },
  preference: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
