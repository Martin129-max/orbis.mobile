import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
import * as Atom from '@atom';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getLinkPreview, type LinkPreview as LinkPreviewData } from '@/lib/api';
import { normalizeWebUrl, safeWebUrl } from '@/lib/rich-content';
import { useAuthStore } from '@/stores/auth-store';

type PreviewState = {
  url: string;
  preview: LinkPreviewData | null;
  error: string | null;
};

export function LinkPreview({ url }: { url: string }) {
  const theme = useTheme();
  const token = useAuthStore((state) => state.token);
  const safeUrl = normalizeWebUrl(url);
  const [state, setState] = useState<PreviewState | null>(null);

  useEffect(() => {
    if (!safeUrl) return;
    let active = true;
    const timer = setTimeout(() => {
      getLinkPreview(token, safeUrl)
        .then((preview) => {
          if (active) setState({ url, preview, error: null });
        })
        .catch((cause: unknown) => {
          if (active) {
            setState({
              url,
              preview: null,
              error: cause instanceof Error ? cause.message : 'Could not load the link preview.',
            });
          }
        });
    }, 400);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [safeUrl, token, url]);

  const current = state?.url === url ? state : null;
  const preview = current?.preview;

  async function openLink() {
    if (!safeUrl) return;
    try {
      await Linking.openURL(safeUrl);
    } catch {
      setState({ url, preview: null, error: 'Could not open this link.' });
    }
  }

  if (!safeUrl) {
    return <Atom.ThemedText type="small" themeColor="textSecondary">{url}</Atom.ThemedText>;
  }

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={preview?.title ?? safeUrl}
      onPress={() => void openLink()}
      style={({ pressed }) => [
        styles.card,
        { borderColor: theme.divider, backgroundColor: theme.backgroundElement, opacity: pressed ? 0.75 : 1 },
      ]}>
      {preview?.image && safeWebUrl(preview.image) ? (
        <Image source={{ uri: preview.image }} style={styles.image} resizeMode="cover" />
      ) : null}
      <View style={styles.content}>
        <Atom.ThemedText type="smallBold" numberOfLines={2}>
          {preview?.title ?? preview?.siteName ?? safeUrl}
        </Atom.ThemedText>
        {preview?.description ? (
          <Atom.ThemedText type="small" themeColor="textSecondary" numberOfLines={3}>
            {preview.description}
          </Atom.ThemedText>
        ) : current?.error ? (
          <Atom.ThemedText type="small" themeColor="textSecondary">
            {current.error}
          </Atom.ThemedText>
        ) : preview?.siteName ? (
          <Atom.ThemedText type="small" themeColor="textSecondary">
            {preview.siteName}
          </Atom.ThemedText>
        ) : current ? null : (
          <ActivityIndicator size="small" color={theme.accent} />
        )}
        <Atom.ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {safeUrl}
        </Atom.ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  image: {
    width: 104,
    minHeight: 92,
  },
  content: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: Spacing.one,
    padding: Spacing.two,
  },
});
