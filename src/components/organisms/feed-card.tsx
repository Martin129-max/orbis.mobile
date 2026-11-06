import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import * as Linking from 'expo-linking';
import * as Atom from '@atom';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { WEB_URL, type FeedEntry } from '@/lib/api';

type FeedCardProps = {
  item: FeedEntry;
  onLike: (item: FeedEntry) => void;
  compact?: boolean;
};

function readableContent(content: string) {
  return content
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .trim();
}

function relativeTime(date: string) {
  const elapsed = Math.max(0, Date.now() - new Date(date).getTime());
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(date).toLocaleDateString();
}

function activityText(activity: Extract<FeedEntry, { type: 'activity' }>): [string, string] {
  const { media, progress, status } = activity;
  if (progress) {
    const verb = media.type === 'manga' ? 'read' : 'watched';
    const unit = media.type === 'manga' ? 'chapter' : 'episode';
    const range = progress.from === progress.to
      ? `${unit} ${progress.to}`
      : `${unit}s ${progress.from}–${progress.to}`;
    return [`${verb} ${range} of`, ''];
  }

  const verb = { anime: 'watching', manga: 'reading', game: 'playing' }[media.type];
  const text: Record<typeof status, [string, string]> = {
    current: [`started ${verb}`, ''],
    completed: ['completed', ''],
    on_hold: ['put', 'on hold'],
    dropped: ['dropped', ''],
    planned: [`plans to ${verb.replace(/ing$/, '')}`, ''],
  };
  return text[status];
}

export function FeedCard({ item, onLike, compact = false }: FeedCardProps) {
  const theme = useTheme();
  const [linkError, setLinkError] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [showSpoiler, setShowSpoiler] = useState(false);
  const author = item.author;
  const displayName = author.name || author.username;
  const hiddenLabel = item.hiddenBecause?.kind === 'muted'
    ? 'From someone you muted'
    : item.hiddenBecause?.kind === 'blocked'
      ? 'Message from someone you blocked'
      : item.hiddenBecause?.kind === 'filtered'
        ? `Hidden because it mentions “${item.hiddenBecause.phrase}”`
        : null;
  const postContext =
    item.type === 'post'
      ? item.community?.name
        ?? (item.wallUser
          ? `Wall of ${item.wallUser.name || item.wallUser.username}`
          : 'Your wall')
      : '';
  const [activityVerb, activitySuffix] =
    item.type === 'activity' ? activityText(item) : ['', ''];

  async function openLink(value: string) {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      setLinkError(true);
      return;
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      setLinkError(true);
      return;
    }
    setLinkError(false);
    try {
      await Linking.openURL(url.toString());
    } catch {
      setLinkError(true);
    }
  }

  return (
    <View
      style={[
        styles.card,
        compact && styles.compactCard,
        { backgroundColor: theme.surface, borderColor: theme.divider },
      ]}>
      {hiddenLabel && !showHidden ? (
        <View style={[styles.gate, { backgroundColor: theme.backgroundElement, borderColor: theme.divider }]}>
          <Atom.ThemedText type="smallBold" style={styles.gateLabel}>
            {hiddenLabel}
          </Atom.ThemedText>
          <Atom.Button
            label={item.hiddenBecause?.kind === 'filtered' ? 'Show anyway' : 'Show'}
            variant="secondary"
            onPress={() => setShowHidden(true)}
          />
        </View>
      ) : (
        <>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`View ${displayName}’s profile`}
            onPress={() => router.push(`/users/${encodeURIComponent(author.username)}` as Href)}
            style={styles.authorRow}>
            {author.avatarUrl ? (
              <Image source={{ uri: author.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: theme.rail }]}>
                <Atom.ThemedText type="smallBold">
                  {author.username.slice(0, 1).toUpperCase()}
                </Atom.ThemedText>
              </View>
            )}
            <View style={styles.authorInfo}>
              <Atom.ThemedText type="smallBold" numberOfLines={1}>
                {displayName}
              </Atom.ThemedText>
              <Atom.ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                @{author.username}
                {item.type !== 'activity' ? ` · ${postContext}` : ''}
                {' · '}
                {relativeTime(item.createdAt)}
              </Atom.ThemedText>
            </View>
            {item.type === 'activity' && (
              <Atom.ThemedText type="smallBold" themeColor="textSecondary">
                Library
              </Atom.ThemedText>
            )}
          </Pressable>

          {item.type === 'activity' ? (
            <View style={styles.body}>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`View ${item.media.title} on Orbis`}
                onPress={() => openLink(
                  `${WEB_URL}/library/${item.media.type}/${encodeURIComponent(item.media.sourceId)}`,
                )}
                style={styles.mediaRow}>
                {item.media.coverImage ? (
                  <Image source={{ uri: item.media.coverImage }} style={compact ? styles.compactCover : styles.cover} />
                ) : null}
                <View style={styles.authorInfo}>
                  <Atom.ThemedText type="small" themeColor="textSecondary" numberOfLines={compact ? 2 : undefined}>
                    {activityVerb}{' '}
                    <Atom.ThemedText type="smallBold">
                      {item.media.title}
                    </Atom.ThemedText>
                    {activitySuffix ? ` ${activitySuffix}` : ''}
                  </Atom.ThemedText>
                  <Atom.ThemedText type="small" themeColor="textSecondary">
                    {item.media.type}
                    {item.media.year ? ` · ${item.media.year}` : ''}
                  </Atom.ThemedText>
                </View>
              </Pressable>
            </View>
          ) : (
            <View style={styles.body}>
              {item.hiddenAt ? (
                <Atom.ThemedText type="small" themeColor="textSecondary">
                  This post is hidden.
                </Atom.ThemedText>
              ) : item.spoiler !== null && item.spoiler !== undefined && !showSpoiler ? (
                <View style={[styles.gate, { backgroundColor: theme.backgroundElement, borderColor: theme.divider }]}>
                  <Atom.ThemedText type="smallBold" style={styles.gateLabel}>
                    {item.spoiler || 'Spoiler'}
                  </Atom.ThemedText>
                  <Atom.Button label="Show" variant="secondary" onPress={() => setShowSpoiler(true)} />
                </View>
              ) : (
                <>
                  {item.content ? (
                    <Atom.ThemedText numberOfLines={compact ? 3 : undefined}>
                      {readableContent(item.content)}
                    </Atom.ThemedText>
                  ) : null}
                  {item.linkUrl ? (
                    <Pressable
                      accessibilityRole="link"
                      onPress={() => void openLink(item.linkUrl ?? '')}>
                      <Atom.ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                        {item.linkUrl}
                      </Atom.ThemedText>
                    </Pressable>
                  ) : null}
                </>
              )}
            </View>
          )}

          {item.type === 'activity' && item.steam ? (
            <Atom.ThemedText type="small" themeColor="textSecondary">
              Steam · {item.steam.minutes} minutes played
            </Atom.ThemedText>
          ) : null}
          {linkError ? <Atom.ErrorMessage>Could not open this link.</Atom.ErrorMessage> : null}
          <View style={[styles.actions, compact && styles.compactActions, { borderTopColor: theme.divider }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={item.liked ? 'Unlike' : 'Like'}
              onPress={() => onLike(item)}
              style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
              <Atom.ThemedText
                type="smallBold"
                style={{ color: item.liked ? theme.accent : theme.text }}>
                {item.liked ? '♥' : '♡'} {item.likeCount}
              </Atom.ThemedText>
            </Pressable>
            <Atom.ThemedText type="small" themeColor="textSecondary">
              {item.commentCount} {item.commentCount === 1 ? 'comment' : 'comments'}
            </Atom.ThemedText>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  compactCard: {
    borderWidth: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: 0,
    padding: Spacing.two,
    gap: Spacing.two,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorInfo: {
    flex: 1,
    minWidth: 0,
  },
  body: {
    gap: Spacing.two,
  },
  gate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: Spacing.two,
  },
  gateLabel: {
    flex: 1,
  },
  mediaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  cover: {
    width: 48,
    height: 64,
    borderRadius: 6,
  },
  compactCover: {
    width: 32,
    height: 44,
    borderRadius: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.two,
  },
  action: {
    minHeight: 32,
    justifyContent: 'center',
  },
  compactActions: {
    borderTopWidth: 0,
    paddingTop: 0,
  },
  pressed: {
    opacity: 0.65,
  },
});
