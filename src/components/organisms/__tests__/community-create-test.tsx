import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Text } from 'react-native';
import * as api from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

import { CommunityCreate } from '../community-create';

jest.mock('@/lib/api', () => ({
  ...jest.requireActual('@/lib/api'),
  createCommunity: jest.fn(),
}));

const createCommunity = api.createCommunity as jest.Mock;

describe('community creation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ token: 'token', sessionExpired: false });
  });

  it('creates a private community and opens it', async () => {
    createCommunity.mockResolvedValue({ id: 8, name: 'Konoha', isPublic: false });
    await renderRouter({
      index: () => <CommunityCreate />,
      'communities/[communityId]': () => <Text>Opened community</Text>,
    });

    await fireEvent.changeText(screen.getByLabelText('Community name'), 'Konoha');
    await fireEvent.press(screen.getByLabelText('Public community'));
    await fireEvent.press(screen.getByText('Create community'));

    await waitFor(() => {
      expect(createCommunity).toHaveBeenCalledWith('token', 'Konoha', false);
    });
    expect(await screen.findByText('Opened community')).toBeTruthy();
  });

  it('shows server creation errors without navigating away', async () => {
    createCommunity.mockRejectedValue(new Error('You can’t create more communities.'));
    await renderRouter({ index: () => <CommunityCreate /> });

    await fireEvent.changeText(screen.getByLabelText('Community name'), 'Konoha');
    await fireEvent.press(screen.getByText('Create community'));

    expect(await screen.findByText('You can’t create more communities.')).toBeTruthy();
  });
});
