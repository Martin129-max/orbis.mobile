import * as ImagePicker from 'expo-image-picker';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import * as api from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

import { MemberProfile } from '../member-profile';

jest.mock('@/lib/storage', () => {
  const mockItems = new Map<string, string>();
  return {
    secureStorage: {
      getItem: async (key: string) => mockItems.get(key) ?? null,
      setItem: async (key: string, value: string) => {
        mockItems.set(key, value);
      },
      removeItem: async (key: string) => {
        mockItems.delete(key);
      },
    },
  };
});

jest.mock('@/lib/api', () => ({
  ...jest.requireActual('@/lib/api'),
  getProfile: jest.fn(async () => null),
  getPublicProfile: jest.fn(),
  getUserPosts: jest.fn(async () => ({ items: [], nextCursor: null })),
  getUserClips: jest.fn(async () => ({ items: [], nextCursor: null })),
  uploadProfileImage: jest.fn(),
  removeProfileImage: jest.fn(),
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  UIImagePickerPreferredAssetRepresentationMode: { Compatible: 'compatible' },
}));

const getPublicProfile = api.getPublicProfile as jest.Mock;
const getUserPosts = api.getUserPosts as jest.Mock;
const uploadProfileImage = api.uploadProfileImage as jest.Mock;
const launchImageLibrary = ImagePicker.launchImageLibraryAsync as jest.Mock;

function publicProfile(overrides: Partial<api.PublicProfile> = {}): api.PublicProfile {
  return {
    userId: 2,
    username: 'naruto',
    name: 'Naruto Uzumaki',
    avatarUrl: null,
    coverUrl: null,
    backgroundUrl: null,
    isAdmin: false,
    isHeadAdmin: false,
    isVerified: false,
    isPublic: true,
    restricted: false,
    hasClips: false,
    createdAt: '2026-10-01T00:00:00.000Z',
    online: true,
    status: 'online',
    friendCount: 3,
    postCount: 12,
    communityCount: 2,
    communities: [],
    friends: [],
    library: [],
    ...overrides,
  };
}

function signInAs(userId: number) {
  useAuthStore.setState({
    token: 'token',
    sessionExpired: false,
    profile: {
      userId,
      username: 'naruto',
      email: 'naruto@anime.test',
      avatarUrl: null,
      coverUrl: null,
      backgroundUrl: null,
      theme: 'dark',
      appearOffline: false,
      isPublic: true,
      isAdmin: false,
      isHeadAdmin: false,
      emailVerifiedAt: '2026-10-01T00:00:00.000Z',
      createdAt: '2026-10-01T00:00:00.000Z',
    },
  });
}

async function openProfile(username = 'naruto') {
  await renderRouter(
    { 'users/[username]': () => <MemberProfile /> },
    { initialUrl: `/users/${username}` },
  );
}

describe('member profiles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ token: null, profile: null, sessionExpired: false });
  });

  it('shows a loading state until the profile arrives', async () => {
    let finish: (profile: api.PublicProfile) => void = () => undefined;
    getPublicProfile.mockReturnValue(new Promise((resolve) => (finish = resolve)));

    await openProfile();
    expect(screen.getByText('Loading profile…')).toBeTruthy();

    finish(publicProfile());
    expect(await screen.findByText('Naruto Uzumaki')).toBeTruthy();
  });

  it('says when a member does not exist', async () => {
    getPublicProfile.mockResolvedValue(null);

    await openProfile('ghost');

    expect(await screen.findByText('Profile not found.')).toBeTruthy();
  });

  it('shows a private profile without counts or content when the server restricts it', async () => {
    getPublicProfile.mockResolvedValue(
      publicProfile({ isPublic: false, restricted: true, postCount: 0, friendCount: 0, communityCount: 0 }),
    );

    await openProfile();

    expect(await screen.findByText('This profile is private.')).toBeTruthy();
    expect(screen.queryByText(/posts · /)).toBeNull();
    expect(getUserPosts).not.toHaveBeenCalled();
  });

  it('does not upload anything when choosing a picture is cancelled', async () => {
    signInAs(2);
    getPublicProfile.mockResolvedValue(publicProfile());
    launchImageLibrary.mockResolvedValue({ canceled: true, assets: null });

    await openProfile();
    await fireEvent.press(await screen.findByText('Change profile picture'));

    await waitFor(() => expect(launchImageLibrary).toHaveBeenCalled());
    expect(launchImageLibrary.mock.calls[0][0]).toMatchObject({
      preferredAssetRepresentationMode: 'compatible',
    });
    expect(uploadProfileImage).not.toHaveBeenCalled();
  });

  it('shows the server’s reason next to the image buttons when an upload fails', async () => {
    signInAs(2);
    getPublicProfile.mockResolvedValue(publicProfile());
    launchImageLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///wallpaper.jpg', fileName: 'wallpaper.jpg', mimeType: 'image/jpeg', fileSize: 1000 }],
    });
    uploadProfileImage.mockRejectedValue(new Error('File is not a supported image.'));

    await openProfile();
    await fireEvent.press(await screen.findByText('Change wallpaper'));

    expect(await screen.findByText('File is not a supported image.')).toBeTruthy();
    expect(getUserPosts).toHaveBeenCalledTimes(1);
  });

  it('keeps another member’s profile free of owner controls', async () => {
    signInAs(1);
    getPublicProfile.mockResolvedValue(publicProfile());

    await openProfile();

    expect(await screen.findByText('Naruto Uzumaki')).toBeTruthy();
    expect(screen.queryByText('Change profile picture')).toBeNull();
    expect(screen.queryByText('Account settings')).toBeNull();
  });
});
