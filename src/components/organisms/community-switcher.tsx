import { router, usePathname, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
import * as Atom from '@atom';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  getCommunities,
  getRailLayout,
  updateRailLayout,
  type Community,
  type RailFolder,
  type RailItem,
} from '@/lib/api';
import {
  COMMUNITY_FOLDER_COLORS,
  createCommunityFolder,
  moveFolderCommunity,
  moveLayoutItem,
  normalizeCommunityLayout,
  ungroupCommunityFolder,
  updateCommunityFolder,
} from '@/lib/community-layout';
import { useAuthStore } from '@/stores/auth-store';

type Loaded = {
  key: string;
  communities: Community[];
  layout: RailItem[];
  error: string | null;
};

function CommunityRow({
  community,
  selected,
  onSelect,
  onMoveUp,
  onMoveDown,
}: {
  community: Community;
  selected: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.communityRow, { borderColor: theme.divider }]}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`Open ${community.name}`}
        onPress={() => router.push(`/communities/${community.id}` as Href)}
        style={styles.communityLink}>
        {community.iconUrl ? (
          <Image source={{ uri: community.iconUrl }} style={styles.icon} />
        ) : (
          <View style={[styles.icon, styles.iconFallback, { backgroundColor: theme.rail }]}>
            <Atom.ThemedText type="smallBold">
              {community.name.slice(0, 1).toUpperCase()}
            </Atom.ThemedText>
          </View>
        )}
        <Atom.ThemedText type="smallBold" numberOfLines={1} style={styles.communityName}>
          {community.name}
        </Atom.ThemedText>
      </Pressable>
      <View style={styles.rowActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${selected ? 'Deselect' : 'Select'} ${community.name} for a folder`}
          accessibilityState={{ selected }}
          onPress={onSelect}
          style={[styles.action, { borderColor: theme.divider }]}>
          <Atom.ThemedText type="small">{selected ? 'Selected' : 'Select'}</Atom.ThemedText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Move ${community.name} up`}
          onPress={onMoveUp}
          style={[styles.action, { borderColor: theme.divider }]}>
          <Atom.ThemedText type="small">Up</Atom.ThemedText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Move ${community.name} down`}
          onPress={onMoveDown}
          style={[styles.action, { borderColor: theme.divider }]}>
          <Atom.ThemedText type="small">Down</Atom.ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

export function CommunitySwitcher({ refreshKey = 0 }: { refreshKey?: number }) {
  const theme = useTheme();
  const token = useAuthStore((state) => state.token);
  const pathname = usePathname();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [savingToken, setSavingToken] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [folderName, setFolderName] = useState('');
  const [folderNames, setFolderNames] = useState<Record<number, string>>({});
  const [folderColors, setFolderColors] = useState<Record<number, string | null>>({});
  const key = `${token ?? ''}:${attempt}:${refreshKey}:${pathname}`;
  const saving = Boolean(token && savingToken === token);
  const current = loaded?.key === key ? loaded : null;
  const currentError = current?.error ?? null;
  const communityById = useMemo(
    () => new Map((current?.communities ?? []).map((community) => [community.id, community])),
    [current?.communities],
  );

  useEffect(() => {
    if (!token) return;

    let active = true;
    Promise.all([getCommunities(token), getRailLayout(token)])
      .then(([communities, layout]) => {
        if (!active || useAuthStore.getState().token !== token) return;
        setLoaded({
          key,
          communities,
          layout: normalizeCommunityLayout(layout, communities.map(({ id }) => id)),
          error: null,
        });
        setSelectedIds([]);
        setSaveError(null);
      })
      .catch((cause: unknown) => {
        if (!active || useAuthStore.getState().token !== token) return;
        setLoaded({
          key,
          communities: [],
          layout: [],
          error: cause instanceof Error ? cause.message : 'Could not load your communities.',
        });
      });

    return () => {
      active = false;
    };
  }, [key, token]);

  async function saveLayout(nextLayout: RailItem[]) {
    if (!token || !current || saving) return;
    const previous = current;
    const normalized = normalizeCommunityLayout(nextLayout, previous.communities.map(({ id }) => id));
    setLoaded({ ...previous, layout: normalized, error: null });
    setSavingToken(token);
    setSaveError(null);
    try {
      const saved = await updateRailLayout(token, normalized);
      if (useAuthStore.getState().token !== token) return;
      setLoaded((value) => value?.key === key
        ? {
            ...value,
            layout: normalizeCommunityLayout(saved, previous.communities.map(({ id }) => id)),
          }
        : value);
    } catch (cause) {
      if (useAuthStore.getState().token === token) {
        setLoaded((value) => value?.key === key ? previous : value);
        setSaveError(cause instanceof Error ? cause.message : 'Could not save your communities.');
      }
    } finally {
      setSavingToken((value) => value === token ? null : value);
    }
  }

  function toggleSelected(communityId: number) {
    setSelectedIds((ids) =>
      ids.includes(communityId) ? ids.filter((id) => id !== communityId) : [...ids, communityId],
    );
  }

  function makeFolder() {
    if (!current || selectedIds.length < 2) return;
    const folder: RailFolder = {
      type: 'folder',
      id: -Date.now(),
      name: folderName.trim() || null,
      color: null,
      communityIds: selectedIds,
    };
    void saveLayout(createCommunityFolder(current.layout, selectedIds, folder));
    setSelectedIds([]);
    setFolderName('');
  }

  function moveEntry(index: number, direction: -1 | 1) {
    if (current) void saveLayout(moveLayoutItem(current.layout, index, direction));
  }

  function moveChild(folderId: number, communityId: number, direction: -1 | 1) {
    if (current) void saveLayout(moveFolderCommunity(current.layout, folderId, communityId, direction));
  }

  function saveFolder(folder: RailFolder) {
    if (!current) return;
    void saveLayout(updateCommunityFolder(current.layout, folder.id, {
      name: (folderNames[folder.id] ?? folder.name ?? '').trim() || null,
      color: folderColors[folder.id] === undefined ? folder.color : folderColors[folder.id],
    }));
  }

  if (!token) return null;

  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <Atom.ThemedText type="subtitle">Your communities</Atom.ThemedText>
        <Atom.ThemedText type="small" themeColor="textSecondary">
          Open a community or organize your list. Changes sync with Orbis on the web.
        </Atom.ThemedText>
      </View>

      {currentError ? (
        <View style={styles.state}>
          <Atom.ErrorMessage>{currentError}</Atom.ErrorMessage>
          <Atom.Button
            label="Retry"
            variant="secondary"
            onPress={() => setAttempt((value) => value + 1)}
          />
        </View>
      ) : !current ? (
        <View style={styles.state}>
          <ActivityIndicator color={theme.accent} />
          <Atom.ThemedText type="small" themeColor="textSecondary">
            Loading your communities…
          </Atom.ThemedText>
        </View>
      ) : current.communities.length === 0 ? (
        <Atom.ThemedText type="small" themeColor="textSecondary">
          You haven’t joined any communities yet.
        </Atom.ThemedText>
      ) : (
        <>
          {current.layout.map((item, index) => {
            if (item.type === 'community') {
              const community = communityById.get(item.communityId);
              if (!community) return null;
              return (
                <CommunityRow
                  key={`community-${community.id}`}
                  community={community}
                  selected={selectedIds.includes(community.id)}
                  onSelect={() => toggleSelected(community.id)}
                  onMoveUp={() => moveEntry(index, -1)}
                  onMoveDown={() => moveEntry(index, 1)}
                />
              );
            }

            const selectedFolderColor =
              folderColors[item.id] === undefined ? item.color : folderColors[item.id];
            return (
              <View
                key={`folder-${item.id}`}
                style={[
                  styles.folder,
                  { backgroundColor: theme.surface, borderColor: theme.divider },
                  selectedFolderColor
                    ? { borderLeftColor: selectedFolderColor, borderLeftWidth: 5 }
                    : null,
                ]}>
                <View style={styles.folderTitle}>
                  <Atom.Input
                    accessibilityLabel={`Name for ${item.name || 'folder'}`}
                    maxLength={32}
                    placeholder="Folder"
                    value={folderNames[item.id] ?? item.name ?? ''}
                    onChangeText={(name) =>
                      setFolderNames((values) => ({ ...values, [item.id]: name }))
                    }
                    style={styles.folderInput}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Move ${item.name || 'folder'} up`}
                    onPress={() => moveEntry(index, -1)}
                    style={[styles.action, { borderColor: theme.divider }]}>
                    <Atom.ThemedText type="small">Up</Atom.ThemedText>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Move ${item.name || 'folder'} down`}
                    onPress={() => moveEntry(index, 1)}
                    style={[styles.action, { borderColor: theme.divider }]}>
                    <Atom.ThemedText type="small">Down</Atom.ThemedText>
                  </Pressable>
                </View>
                <View style={styles.colors}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="No folder color"
                    accessibilityState={{ selected: selectedFolderColor === null }}
                    onPress={() => setFolderColors((values) => ({ ...values, [item.id]: null }))}
                    style={[
                      styles.colorOption,
                      { borderColor: theme.divider, backgroundColor: theme.background },
                    ]}>
                    <Atom.ThemedText type="small">None</Atom.ThemedText>
                  </Pressable>
                  {COMMUNITY_FOLDER_COLORS.map((option) => {
                    const selected = selectedFolderColor === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        accessibilityRole="button"
                        accessibilityLabel={`${option.label} folder color`}
                        accessibilityState={{ selected }}
                        onPress={() =>
                          setFolderColors((values) => ({ ...values, [item.id]: option.value }))
                        }
                        style={[
                          styles.colorDot,
                          { backgroundColor: option.value, borderColor: selected ? theme.text : 'transparent' },
                        ]}
                      />
                    );
                  })}
                </View>
                <View style={styles.folderActions}>
                  <Atom.Button
                    label="Save folder"
                    variant="secondary"
                    disabled={saving}
                    onPress={() => saveFolder(item)}
                  />
                  <Atom.Button
                    label="Ungroup"
                    variant="secondary"
                    disabled={saving}
                    onPress={() => void saveLayout(ungroupCommunityFolder(current.layout, item.id))}
                  />
                </View>
                {item.communityIds.map((communityId) => {
                  const community = communityById.get(communityId);
                  if (!community) return null;
                  return (
                    <CommunityRow
                      key={`community-${community.id}`}
                      community={community}
                      selected={selectedIds.includes(community.id)}
                      onSelect={() => toggleSelected(community.id)}
                      onMoveUp={() => moveChild(item.id, community.id, -1)}
                      onMoveDown={() => moveChild(item.id, community.id, 1)}
                    />
                  );
                })}
              </View>
            );
          })}

          {selectedIds.length > 0 ? (
            <View style={styles.folderCreator}>
              <Atom.ThemedText type="small">
                Select at least two communities to create a folder ({selectedIds.length} selected).
              </Atom.ThemedText>
              <Atom.Input
                accessibilityLabel="New folder name"
                maxLength={32}
                placeholder="Folder name (optional)"
                value={folderName}
                onChangeText={setFolderName}
              />
              <Atom.Button
                label="Create folder"
                variant="secondary"
                disabled={selectedIds.length < 2 || saving}
                onPress={makeFolder}
              />
            </View>
          ) : null}
          {saveError ? <Atom.ErrorMessage>{saveError}</Atom.ErrorMessage> : null}
          {saving ? (
            <Atom.ThemedText type="small" themeColor="textSecondary">Saving your layout…</Atom.ThemedText>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: '100%',
    gap: Spacing.two,
  },
  heading: {
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  state: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.four,
  },
  communityRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.two,
    gap: Spacing.two,
  },
  communityLink: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  iconFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityName: {
    flex: 1,
  },
  rowActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  action: {
    minHeight: 44,
    minWidth: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Spacing.two,
  },
  folder: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.two,
    gap: Spacing.two,
  },
  folderTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  folderInput: {
    flex: 1,
  },
  folderActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  colors: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  colorOption: {
    minHeight: 40,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: Spacing.two,
  },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
  },
  folderCreator: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.two,
  },
});
