import {
  createCommunityFolder,
  moveFolderCommunity,
  moveLayoutItem,
  normalizeCommunityLayout,
  ungroupCommunityFolder,
} from '../community-layout';
import type { RailItem } from '../api';

describe('community layout helpers', () => {
  it('drops deleted communities and fills newly joined communities without duplicates', () => {
    const layout: RailItem[] = [
      { type: 'folder', id: 2, name: 'Friends', color: null, communityIds: [1, 2, 9] },
      { type: 'community', communityId: 2 },
    ];

    expect(normalizeCommunityLayout(layout, [1, 2, 3])).toEqual([
      { type: 'folder', id: 2, name: 'Friends', color: null, communityIds: [1, 2] },
      { type: 'community', communityId: 3 },
    ]);
  });

  it('moves top-level items and items within folders in either direction', () => {
    const layout: RailItem[] = [
      { type: 'community', communityId: 1 },
      { type: 'folder', id: 2, name: null, color: null, communityIds: [3, 4] },
    ];

    expect(moveLayoutItem(layout, 0, 1)).toEqual([layout[1], layout[0]]);
    expect(moveFolderCommunity(layout, 2, 4, -1)).toEqual([
      layout[0],
      { ...layout[1], communityIds: [4, 3] },
    ]);
  });

  it('creates a folder from selected communities and keeps the remaining layout intact', () => {
    const layout: RailItem[] = [
      { type: 'community', communityId: 1 },
      { type: 'folder', id: 2, name: 'Old', color: null, communityIds: [3, 4, 5] },
      { type: 'community', communityId: 6 },
    ];
    const folder = {
      type: 'folder' as const,
      id: -10,
      name: 'New',
      color: null,
      communityIds: [1, 4, 6],
    };

    expect(createCommunityFolder(layout, [1, 4, 6], folder)).toEqual([
      folder,
      { type: 'folder', id: 2, name: 'Old', color: null, communityIds: [3, 5] },
    ]);
  });

  it('ungroups a folder in place', () => {
    const layout: RailItem[] = [
      { type: 'community', communityId: 1 },
      { type: 'folder', id: 2, name: null, color: null, communityIds: [3, 4] },
    ];

    expect(ungroupCommunityFolder(layout, 2)).toEqual([
      { type: 'community', communityId: 1 },
      { type: 'community', communityId: 3 },
      { type: 'community', communityId: 4 },
    ]);
  });
});
