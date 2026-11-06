import type { RailFolder, RailItem } from './api';

export const COMMUNITY_FOLDER_COLORS = [
  { value: '#5b8def', label: 'Blue' },
  { value: '#4caf7a', label: 'Green' },
  { value: '#e3b341', label: 'Yellow' },
  { value: '#f08a4b', label: 'Orange' },
  { value: '#e5534b', label: 'Red' },
  { value: '#e57bb5', label: 'Pink' },
  { value: '#9a7cf0', label: 'Purple' },
] as const;

export function normalizeCommunityLayout(layout: RailItem[], communityIds: number[]): RailItem[] {
  const known = new Set(communityIds);
  const placed = new Set<number>();
  const take = (id: number) => {
    if (!known.has(id) || placed.has(id)) return false;
    placed.add(id);
    return true;
  };
  const items = layout.flatMap((item): RailItem[] => {
    if (item.type === 'community') {
      return take(item.communityId) ? [item] : [];
    }

    const ids = item.communityIds.filter(take);
    if (ids.length === 0) return [];
    if (ids.length === 1) return [{ type: 'community', communityId: ids[0] }];
    return [{ ...item, communityIds: ids }];
  });

  return [
    ...items,
    ...communityIds
      .filter((id) => !placed.has(id))
      .map((communityId) => ({ type: 'community', communityId }) as const),
  ];
}

export function moveLayoutItem(layout: RailItem[], index: number, direction: -1 | 1): RailItem[] {
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || index >= layout.length || nextIndex >= layout.length) {
    return layout;
  }
  const next = [...layout];
  [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
  return next;
}

export function moveFolderCommunity(
  layout: RailItem[],
  folderId: number,
  communityId: number,
  direction: -1 | 1,
): RailItem[] {
  const folder = layout.find(
    (item): item is RailFolder => item.type === 'folder' && item.id === folderId,
  );
  const index = folder?.communityIds.indexOf(communityId) ?? -1;
  const nextIndex = index + direction;
  if (!folder || index < 0 || nextIndex < 0 || nextIndex >= folder.communityIds.length) {
    return layout;
  }
  const communityIds = [...folder.communityIds];
  [communityIds[index], communityIds[nextIndex]] = [communityIds[nextIndex], communityIds[index]];
  return layout.map((item) => item === folder ? { ...folder, communityIds } : item);
}

export function createCommunityFolder(
  layout: RailItem[],
  selectedIds: number[],
  folder: RailFolder,
): RailItem[] {
  const selected = new Set(selectedIds);
  const selectedInLayout = layout.flatMap((item) =>
    item.type === 'community'
      ? selected.has(item.communityId) ? [item.communityId] : []
      : item.communityIds.filter((id) => selected.has(id)),
  );
  if (selectedInLayout.length < 2) return layout;

  const selectedSet = new Set(selectedInLayout);
  let inserted = false;
  return layout.flatMap((item): RailItem[] => {
    if (item.type === 'community') {
      if (!selectedSet.has(item.communityId)) return [item];
      if (inserted) return [];
      inserted = true;
      return [folder];
    }

    const remaining = item.communityIds.filter((id) => !selectedSet.has(id));
    const items: RailItem[] = [];
    if (!inserted && remaining.length !== item.communityIds.length) {
      items.push(folder);
      inserted = true;
    }
    if (remaining.length === 1) {
      items.push({ type: 'community', communityId: remaining[0] });
    } else if (remaining.length > 1) {
      items.push({ ...item, communityIds: remaining });
    }
    return items;
  });
}

export function updateCommunityFolder(
  layout: RailItem[],
  folderId: number,
  changes: Pick<RailFolder, 'name' | 'color'>,
): RailItem[] {
  return layout.map((item) =>
    item.type === 'folder' && item.id === folderId ? { ...item, ...changes } : item,
  );
}

export function ungroupCommunityFolder(layout: RailItem[], folderId: number): RailItem[] {
  return layout.flatMap((item): RailItem[] =>
    item.type === 'folder' && item.id === folderId
      ? item.communityIds.map((communityId) => ({ type: 'community', communityId }))
      : [item],
  );
}
