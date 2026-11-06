import { router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
import * as Atom from '@atom';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCommunity } from '@/hooks/use-community';
import { getMembers, type Member } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

type Loaded = { key: string; members: Member[]; error: string | null };

function memberName(member: Member) {
  return member.nickname?.trim() || member.name || member.username;
}

function MemberRow({ member }: { member: Member }) {
  const theme = useTheme();
  const role = member.isOwner ? 'Owner' : member.isAdmin ? 'Admin' : null;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`View ${memberName(member)}’s profile`}
      onPress={() => router.push(`/users/${encodeURIComponent(member.username)}` as Href)}
      style={[styles.member, { backgroundColor: theme.surface, borderColor: theme.divider }]}>
      {member.avatarUrl ? (
        <Image source={{ uri: member.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, { backgroundColor: theme.rail }]} />
      )}
      <View style={styles.memberInfo}>
        <Atom.ThemedText type="smallBold" numberOfLines={1}>
          {memberName(member)}{member.isVerified ? ' ✓' : ''}
        </Atom.ThemedText>
        <Atom.ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          @{member.username}{role ? ` · ${role}` : ''}
        </Atom.ThemedText>
      </View>
      <View
        accessibilityLabel={member.online ? 'Online' : 'Offline'}
        style={[
          styles.presence,
          { backgroundColor: member.online ? theme.accent : theme.textSecondary },
        ]}
      />
    </Pressable>
  );
}

export function CommunityMembers({ communityId }: { communityId: string }) {
  const theme = useTheme();
  const token = useAuthStore((state) => state.token);
  const { loading, community, failed, retry } = useCommunity(communityId);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${token ?? ''}:${communityId}:${attempt}`;
  const current = loaded?.key === requestKey ? loaded : null;

  useEffect(() => {
    if (!token || !community?.role) return;
    let active = true;
    getMembers(token, Number(communityId))
      .then((members) => {
        if (active && useAuthStore.getState().token === token) {
          setLoaded({ key: requestKey, members, error: null });
        }
      })
      .catch((cause: unknown) => {
        if (active && useAuthStore.getState().token === token) {
          setLoaded({
            key: requestKey,
            members: [],
            error: cause instanceof Error ? cause.message : 'Could not load community members.',
          });
        }
      });
    return () => {
      active = false;
    };
  }, [community?.role, communityId, requestKey, token]);

  if (loading) {
    return (
      <View style={styles.state}>
        <ActivityIndicator color={theme.accent} />
        <Atom.ThemedText type="small" themeColor="textSecondary">Checking community access…</Atom.ThemedText>
      </View>
    );
  }

  if (failed || !community) {
    return (
      <View style={styles.state}>
        <Atom.ErrorMessage>
          {failed ? 'Could not load this community.' : 'This community is private or no longer available.'}
        </Atom.ErrorMessage>
        {failed ? <Atom.Button label="Try again" variant="secondary" onPress={retry} /> : null}
      </View>
    );
  }

  if (!community.role) {
    return (
      <View style={styles.state}>
        <Atom.ThemedText type="subtitle">Members</Atom.ThemedText>
        <Atom.ThemedText themeColor="textSecondary">
          Join this community to view its member list.
        </Atom.ThemedText>
        <Atom.Button
          label="Back to community"
          variant="secondary"
          onPress={() => router.dismissTo(`/communities/${community.id}` as Href)}
        />
      </View>
    );
  }

  if (!current) {
    return (
      <View style={styles.state}>
        <ActivityIndicator color={theme.accent} />
        <Atom.ThemedText type="small" themeColor="textSecondary">Loading members…</Atom.ThemedText>
      </View>
    );
  }

  if (current.error) {
    return (
      <View style={styles.state}>
        <Atom.ErrorMessage>{current.error}</Atom.ErrorMessage>
        <Atom.Button
          label="Try again"
          variant="secondary"
          onPress={() => setAttempt((value) => value + 1)}
        />
        <Atom.Button
          label="Back to community"
          variant="secondary"
          onPress={() => router.dismissTo(`/communities/${community.id}` as Href)}
        />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <View style={styles.heading}>
        <Atom.ThemedText type="subtitle">{community.name} members</Atom.ThemedText>
        <Atom.ThemedText type="small" themeColor="textSecondary">
          {current.members.length.toLocaleString()} {current.members.length === 1 ? 'member' : 'members'}
        </Atom.ThemedText>
      </View>
      {current.members.length ? (
        <View style={styles.list}>
          {current.members.map((member) => <MemberRow key={member.userId} member={member} />)}
        </View>
      ) : (
        <Atom.ThemedText type="small" themeColor="textSecondary">
          This community has no members.
        </Atom.ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    width: '100%',
    gap: Spacing.three,
  },
  heading: {
    gap: Spacing.one,
  },
  state: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.four,
  },
  list: {
    gap: Spacing.two,
  },
  member: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.two,
    gap: Spacing.two,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  memberInfo: {
    flex: 1,
    minWidth: 0,
  },
  presence: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
