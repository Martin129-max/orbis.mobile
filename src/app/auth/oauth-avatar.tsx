import { router, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import * as Atom from '@atom';
import * as Template from '@template';

import { Spacing } from '@/constants/theme';
import { applyLinkedOAuthAvatar } from '@/lib/api';
import {
  clearPendingOAuthAvatar,
  getPendingOAuthAvatar,
  type PendingOAuthAvatar,
} from '@/lib/oauth';
import { safeNext } from '@/lib/navigation';
import { useAuthStore } from '@/stores/auth-store';

const providerLabels: Record<PendingOAuthAvatar['provider'], string> = {
  discord: 'Discord',
  twitch: 'Twitch',
};

export default function OAuthAvatarScreen() {
  const token = useAuthStore((state) => state.token);
  const setAvatarUrl = useAuthStore((state) => state.setAvatarUrl);
  const [offer, setOffer] = useState<PendingOAuthAvatar | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    getPendingOAuthAvatar()
      .then(async (details) => {
        if (details && useAuthStore.getState().token !== details.accountToken) {
          await clearPendingOAuthAvatar();
          setError('Your account changed during sign-in. Please start again.');
          return;
        }
        setOffer(details);
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : 'Could not load the avatar offer.');
      })
      .finally(() => setLoading(false));
  }, []);

  function finish(destination: string) {
    router.replace((safeNext(destination) ?? '/(protected)/(tabs)') as Href);
  }

  async function decline() {
    if (!offer || pending) return;
    try {
      await clearPendingOAuthAvatar();
      finish(offer.destination);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not dismiss this avatar offer.');
    }
  }

  async function accept() {
    if (!offer || pending) return;
    if (!token) {
      setError('Sign in again before using this avatar.');
      return;
    }
    if (token !== offer.accountToken) {
      await clearPendingOAuthAvatar();
      setOffer(null);
      setError('Your account changed during sign-in. Please start again.');
      return;
    }

    setPending(true);
    setError(null);
    try {
      const { avatarUrl } = await applyLinkedOAuthAvatar(token, offer.token);
      setAvatarUrl(avatarUrl);
      await clearPendingOAuthAvatar();
      finish(offer.destination);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not use your provider avatar.');
    } finally {
      setPending(false);
    }
  }

  return (
    <Template.ScreenTemplate>
      <View style={styles.page}>
        <Atom.ThemedText type="subtitle">Use your provider avatar?</Atom.ThemedText>
        <Atom.ThemedText themeColor="textSecondary">
          You can use this picture on your Orbis profile or keep your current one.
        </Atom.ThemedText>
        {loading ? (
          <Atom.ThemedText themeColor="textSecondary">Loading avatar offer…</Atom.ThemedText>
        ) : offer ? (
          <>
            <View style={styles.avatarChoice}>
              <Image
                accessibilityLabel={`${providerLabels[offer.provider]} profile picture`}
                source={{ uri: offer.url }}
                style={styles.avatar}
              />
              <Atom.ThemedText type="smallBold">
                Use your {providerLabels[offer.provider]} picture on Orbis?
              </Atom.ThemedText>
            </View>
            {error && <Atom.ErrorMessage>{error}</Atom.ErrorMessage>}
            <Atom.Button label="Use avatar" loading={pending} onPress={accept} />
            <Pressable
              accessibilityRole="button"
              disabled={pending}
              onPress={decline}
              style={styles.decline}>
              <Atom.ThemedText type="small" themeColor="textSecondary">
                Not now
              </Atom.ThemedText>
            </Pressable>
          </>
        ) : (
          <>
            <Atom.ErrorMessage>
              {error ?? 'This avatar offer has expired. You can try linking your account again.'}
            </Atom.ErrorMessage>
            <Atom.Button
              label="Back to settings"
              variant="secondary"
              onPress={() => router.replace('/settings' as Href)}
            />
          </>
        )}
      </View>
    </Template.ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  page: {
    width: '100%',
    gap: Spacing.three,
  },
  avatarChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  decline: {
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
});
