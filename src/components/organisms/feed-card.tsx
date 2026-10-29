import { router, type Href } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import * as Atom from '@atom';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { FeedEntry } from '@/lib/api';

type FeedCardProps = {
  item: FeedEntry;
  onLike: (item: FeedEntry) => void;
  onVote: (item: Extract<FeedEntry, { type: 'thread' }>, value: -1 | 0 | 1) => void;
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

function activityLabel(status: Extract<FeedEntry, { type: 'activity' }>['status']) {
  switch (status) {
    case 'current':
      return 'is watching / reading / playing';
    case 'completed':
      return 'completed';
    case 'on_hold':
      return 'put on hold';
    case 'dropped':
      return 'dropped';
    case 'planned':
      return 'plans to try';
  }
}

export function FeedCard({ item, onLike, onVote }: FeedCardProps) {
  const theme = useTheme();
  const author = item.author;
  const displayName = author.name || author.username;
  const postContext =
    item.type === 'thread'
      ? item.community.name
      : item.type === 'post'
        ? item.community?.name
          ?? (item.wallUser
            ? `Wall of ${item.wallUser.name || item.wallUser.username}`
            : 'Your wall')
        : '';

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.divider }]}>
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
        {item.type === 'thread' && (
          <Atom.ThemedText type="smallBold" themeColor="textSecondary">
            Forum
          </Atom.ThemedText>
        )}
        {item.type === 'activity' && (
          <Atom.ThemedText type="smallBold" themeColor="textSecondary">
            Library
          </Atom.ThemedText>
        )}
      </Pressable>

      {item.type === 'thread' ? (
        <View style={styles.body}>
          <Atom.ThemedText type="smallBold">{item.title}</Atom.ThemedText>
          {item.content ? <Atom.ThemedText>{readableContent(item.content)}</Atom.ThemedText> : null}
        </View>
      ) : item.type === 'activity' ? (
        <View style={styles.body}>
          <Atom.ThemedText themeColor="textSecondary">{activityLabel(item.status)}</Atom.ThemedText>
          <View style={styles.mediaRow}>
            {item.media.coverImage ? (
              <Image source={{ uri: item.media.coverImage }} style={styles.cover} />
            ) : null}
            <View style={styles.authorInfo}>
              <Atom.ThemedText type="smallBold">{item.media.title}</Atom.ThemedText>
              <Atom.ThemedText type="small" themeColor="textSecondary">
                {item.media.type}
                {item.media.year ? ` · ${item.media.year}` : ''}
              </Atom.ThemedText>
              {item.progress ? (
                <Atom.ThemedText type="small" themeColor="textSecondary">
                  Progress {item.progress.from} → {item.progress.to}
                </Atom.ThemedText>
              ) : null}
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.body}>
          {item.hiddenAt ? (
            <Atom.ThemedText type="small" themeColor="textSecondary">
              This post is hidden.
            </Atom.ThemedText>
          ) : null}
          {item.content ? <Atom.ThemedText>{readableContent(item.content)}</Atom.ThemedText> : null}
          {item.linkUrl ? (
            <Atom.ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
              {item.linkUrl}
            </Atom.ThemedText>
          ) : null}
        </View>
      )}

      <View style={[styles.actions, { borderTopColor: theme.divider }]}>
        {item.type === 'thread' ? (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Upvote, score ${item.score}`}
              onPress={() => onVote(item, item.myVote === 1 ? 0 : 1)}
              style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
              <Atom.ThemedText
                type="smallBold"
                style={{ color: item.myVote === 1 ? theme.accent : theme.text }}>
                ▲ {item.score}
              </Atom.ThemedText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Downvote"
              onPress={() => onVote(item, item.myVote === -1 ? 0 : -1)}
              style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
              <Atom.ThemedText
                type="smallBold"
                style={{ color: item.myVote === -1 ? theme.accent : theme.text }}>
                ▼
              </Atom.ThemedText>
            </Pressable>
          </>
        ) : (
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
        )}
        <Atom.ThemedText type="small" themeColor="textSecondary">
          {item.commentCount} {item.commentCount === 1 ? 'comment' : 'comments'}
        </Atom.ThemedText>
      </View>
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
  pressed: {
    opacity: 0.65,
  },
});
