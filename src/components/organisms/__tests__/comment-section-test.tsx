import { fireEvent } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import * as api from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

import { CommentSection } from '../comment-section';

jest.mock('@/lib/api', () => ({
  ...jest.requireActual('@/lib/api'),
  getComments: jest.fn(),
}));

const getComments = api.getComments as jest.Mock;

describe('comment section', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getComments.mockResolvedValue([]);
    useAuthStore.setState({ token: 'token', sessionExpired: false });
  });

  it('does not expose comment/reply composition without community membership', async () => {
    await renderRouter({
      index: () => (
        <CommentSection
          target={{ type: 'post', id: 3 }}
          canComment={false}
          onCommentsChange={jest.fn()}
        />
      ),
    });

    expect(screen.getByText('Join this community to comment.')).toBeTruthy();
    expect(screen.queryByLabelText('Write a comment…')).toBeNull();
  });

  it('shows a retry action when comments cannot be loaded', async () => {
    getComments
      .mockRejectedValueOnce(new Error('Could not load comments.'))
      .mockResolvedValueOnce([]);

    await renderRouter({
      index: () => (
        <CommentSection
          target={{ type: 'post', id: 3 }}
          canComment
          onCommentsChange={jest.fn()}
        />
      ),
    });

    expect(await screen.findByText('Could not load comments.')).toBeTruthy();
    await fireEvent.press(screen.getByText('Try again'));
    expect(await screen.findByText('No comments yet.')).toBeTruthy();
  });
});
