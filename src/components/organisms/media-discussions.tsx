import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import * as Atom from '@atom';
import * as Template from '@template';

import { Spacing } from '@/constants/theme';
import { useCurrentProfile } from '@/hooks/use-current-profile';
import { useTheme } from '@/hooks/use-theme';
import {
  createMediaPost,
  getMediaPosts,
  getMediaProfile,
  setLike,
  type FeedEntry,
  type MediaProfile,
  type MediaType,
} from '@/lib/api';
import { sessionFingerprint } from '@/lib/session';
import { useAuthStore } from '@/stores/auth-store';
import { EmailConfirmNotice } from './email-confirm-notice';
import { FeedCard } from './feed-card';
import { PostComposer } from './post-composer';

type MediaPage = {
  key: string;
  items: FeedEntry[];
  nextCursor: string | null;
  error: string | null;
};

const mediaTypes: MediaType[] = ['anime', 'manga', 'game'];

function entryKey(entry: FeedEntry) {
  return `${entry.type}-${entry.id}`;
}

function parseType(value: string | string[] | undefined): MediaType | null {
  const type = Array.isArray(value) ? value[0] : value;
  return mediaTypes.find((mediaType) => mediaType === type) ?? null;
}

export function MediaDiscussions() {
  const params = useLocalSearchParams<{ type?: string; sourceId?: string }>();
  const type = parseType(params.type);
  const sourceId = Array.isArray(params.sourceId) ? params.sourceId[0] : params.sourceId;
  const token = useAuthStore((state) => state.token);
  const { profile, failed: profileFailed, retry: retryProfile } = useCurrentProfile();
  const theme = useTheme();
  const [titleState, setTitleState] = useState<{
    key: string;
    title: MediaProfile | null;
    error: string | null;
  } | null>(null);
  const [page, setPage] = useState<MediaPage | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const actionKeys = useRef(new Set<string>());
  const sessionKey = sessionFingerprint(token);
  const titleKey = `${sessionKey}:${type ?? ''}:${sourceId ?? ''}:${attempt}`;
  const postsKey = titleKey;
  const currentTitle = titleState?.key === titleKey ? titleState.title : null;
  const titleError = titleState?.key === titleKey ? titleState.error : null;
  const currentPage = page?.key === postsKey ? page : null;
  const posts = currentPage?.items ?? null;
  const nextCursor = currentPage?.nextCursor ?? null;

  useEffect(() => {
    if (!type || !sourceId) return;
    let active = true;
    getMediaProfile(token, type, sourceId)
      .then((title) => {
        if (active) {
          setTitleState({
            key: titleKey,
            title,
            error: title ? null : 'This title could not be found.',
          });
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setTitleState({
            key: titleKey,
            title: null,
            error: cause instanceof Error ? cause.message : 'Could not load this title.',
          });
        }
      });
    return () => {
      active = false;
    };
  }, [sourceId, titleKey, token, type]);

  useEffect(() => {
    if (!type || !sourceId) return;
    let active = true;
    getMediaPosts(token, type, sourceId)
      .then((result) => {
        if (active) {
          setPage({
            key: postsKey,
            items: result.items,
            nextCursor: result.nextCursor,
            error: null,
          });
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setPage({
            key: postsKey,
            items: [],
            nextCursor: null,
            error: cause instanceof Error ? cause.message : 'Could not load title discussions.',
          });
        }
      });
    return () => {
      active = false;
    };
  }, [postsKey, sourceId, token, type]);

  async function handlePost(content: string, linkUrl?: string) {
    if (!token || !type || !sourceId || !profile?.emailVerifiedAt) {
      throw new Error('Confirm your email before posting.');
    }
    const post = await createMediaPost(token, type, sourceId, content, linkUrl);
    setPage((current) => current?.key === postsKey
      ? { ...current, items: [post, ...current.items.filter((item) => entryKey(item) !== entryKey(post))] }
      : current === null
        ? { key: postsKey, items: [post], nextCursor: null, error: null }
        : current);
  }

  function handleChange(updated: FeedEntry) {
    setPage((current) => current?.key === postsKey
      ? {
          ...current,
          items: current.items.map((item) => entryKey(item) === entryKey(updated) ? updated : item),
        }
      : current);
  }

  async function handleLike(item: FeedEntry) {
    if (!token) return;
    const key = entryKey(item);
    if (actionKeys.current.has(key)) return;
    actionKeys.current.add(key);
    const liked = !item.liked;
    setPage((current) => current?.key === postsKey
      ? {
          ...current,
          items: current.items.map((entry) =>
            entryKey(entry) === key
              ? { ...entry, liked, likeCount: entry.likeCount + (liked ? 1 : -1) }
              : entry,
          ),
        }
      : current);
    try {
      const result = await setLike(token, item.type, item.id, liked);
      setPage((current) => current?.key === postsKey
        ? {
            ...current,
            items: current.items.map((entry) =>
              entryKey(entry) === key ? { ...entry, ...result } : entry,
            ),
          }
        : current);
    } catch (cause) {
      setPage((current) => current?.key === postsKey
        ? {
            ...current,
            error: cause instanceof Error ? cause.message : 'Could not save your like.',
            items: current.items.map((entry) =>
              entryKey(entry) === key
                ? { ...entry, liked: item.liked, likeCount: item.likeCount }
                : entry,
            ),
          }
        : current);
    } finally {
      actionKeys.current.delete(key);
    }
  }

  async function loadMore() {
    if (!type || !sourceId || !nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await getMediaPosts(token, type, sourceId, nextCursor);
      setPage((current) => {
        if (current?.key !== postsKey) return current;
        const existing = new Set(current.items.map(entryKey));
        return {
          ...current,
          items: [...current.items, ...result.items.filter((item) => !existing.has(entryKey(item)))],
          nextCursor: result.nextCursor,
          error: null,
        };
      });
    } catch (cause) {
      setPage((current) => current?.key === postsKey
        ? { ...current, error: cause instanceof Error ? cause.message : 'Could not load more discussions.' }
        : current);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <Template.ScreenTemplate>
      {!type || !sourceId ? (
        <View style={styles.state}>
          <Atom.ErrorMessage>This title could not be found.</Atom.ErrorMessage>
        </View>
      ) : titleError ? (
        <View style={styles.state}>
          <Atom.ErrorMessage>{titleError}</Atom.ErrorMessage>
          {titleError.startsWith('This title is 18+') ? (
            <Atom.Button
              label="Open settings"
              variant="secondary"
              onPress={() => router.push('/settings' as Href)}
            />
          ) : (
            <Atom.Button label="Try again" variant="secondary" onPress={() => setAttempt((value) => value + 1)} />
          )}
        </View>
      ) : !currentTitle ? (
        <View style={styles.state}>
          <ActivityIndicator color={theme.accent} />
          <Atom.ThemedText type="small" themeColor="textSecondary">Loading title…</Atom.ThemedText>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={[styles.titleCard, { backgroundColor: theme.surface, borderColor: theme.divider }]}>
            {currentTitle.coverImage ? (
              <Image source={{ uri: currentTitle.coverImage }} style={styles.cover} resizeMode="cover" />
            ) : null}
            <View style={styles.titleInfo}>
              <Atom.ThemedText type="subtitle">{currentTitle.title}</Atom.ThemedText>
              <Atom.ThemedText type="small" themeColor="textSecondary">
                {currentTitle.type}{currentTitle.year ? ` · ${currentTitle.year}` : ''}
                {currentTitle.score ? ` · ${currentTitle.score.toFixed(1)}` : ''}
              </Atom.ThemedText>
              {currentTitle.synopsis ? (
                <Atom.ThemedText type="small" themeColor="textSecondary" numberOfLines={5}>
                  {currentTitle.synopsis}
                </Atom.ThemedText>
              ) : null}
              {currentTitle.genres.length ? (
                <Atom.ThemedText type="small" themeColor="textSecondary">
                  {currentTitle.genres.join(' · ')}
                </Atom.ThemedText>
              ) : null}
            </View>
          </View>

          {profile?.emailVerifiedAt === null ? (
            <EmailConfirmNotice email={profile.email} />
          ) : profile ? (
            <PostComposer
              placeholder={`Share your thoughts about ${currentTitle.title}…`}
              onPost={handlePost}
            />
          ) : profileFailed ? (
            <View style={styles.state}>
              <Atom.ErrorMessage>Could not check your account.</Atom.ErrorMessage>
              <Atom.Button label="Retry account check" variant="secondary" onPress={retryProfile} />
            </View>
          ) : (
            <View style={styles.state}>
              <ActivityIndicator color={theme.accent} />
              <Atom.ThemedText type="small" themeColor="textSecondary">Checking your account…</Atom.ThemedText>
            </View>
          )}

          <Atom.ThemedText type="smallBold">Title discussions</Atom.ThemedText>
          {currentPage?.error ? <Atom.ErrorMessage>{currentPage.error}</Atom.ErrorMessage> : null}
          {posts === null ? (
            <View style={styles.state}>
              <ActivityIndicator color={theme.accent} />
            </View>
          ) : posts.length ? (
            <View style={styles.posts}>
              {posts.map((item) => (
                <FeedCard
                  key={entryKey(item)}
                  item={item}
                  onLike={handleLike}
                  onChange={handleChange}
                  context={currentTitle.title}
                />
              ))}
              {nextCursor ? (
                <Atom.Button
                  label="Load more"
                  variant="secondary"
                  loading={loadingMore}
                  onPress={() => void loadMore()}
                />
              ) : null}
            </View>
          ) : currentPage?.error ? (
            <Atom.Button label="Try again" variant="secondary" onPress={() => setAttempt((value) => value + 1)} />
          ) : (
            <Atom.ThemedText type="small" themeColor="textSecondary">
              No discussions yet. Start the conversation.
            </Atom.ThemedText>
          )}
        </View>
      )}
    </Template.ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.three,
  },
  titleCard: {
    flexDirection: 'row',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
  },
  cover: {
    width: 88,
    height: 128,
    borderRadius: 8,
  },
  titleInfo: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.two,
  },
  posts: {
    gap: Spacing.three,
  },
  state: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.four,
  },
});
