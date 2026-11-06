import { fireEvent } from '@testing-library/react-native';
import { renderRouter, screen, waitFor } from 'expo-router/testing-library';
import * as api from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

import { PostComposer } from '../post-composer';

jest.mock('@/lib/api', () => ({
  ...jest.requireActual('@/lib/api'),
  searchPeople: jest.fn(),
}));

const searchPeople = api.searchPeople as jest.Mock;

describe('post composer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ token: 'token', sessionExpired: false });
  });

  it('submits rich HTML for selected text', async () => {
    const onPost = jest.fn().mockResolvedValue(undefined);
    await renderRouter({ index: () => <PostComposer onPost={onPost} /> });
    const input = screen.getByLabelText('Write something…');

    await fireEvent.changeText(input, 'hello');
    expect(screen.getByDisplayValue('hello')).toBeTruthy();
    await fireEvent(input, 'selectionChange', {
      nativeEvent: { selection: { start: 0, end: 5 } },
    });
    await fireEvent.press(screen.getByLabelText('Bold'));
    await fireEvent.press(screen.getByText('Post'));

    await waitFor(() => {
      expect(onPost).toHaveBeenCalledWith('<p><strong>hello</strong></p>', undefined);
    });
  });

  it('inserts the selected friend username instead of the display name', async () => {
    searchPeople.mockResolvedValue([{
      id: 8,
      username: 'sakura',
      name: 'Sakura Haruno',
      avatarUrl: null,
    }]);
    const onPost = jest.fn().mockResolvedValue(undefined);
    await renderRouter({ index: () => <PostComposer onPost={onPost} /> });
    const input = screen.getByLabelText('Write something…');

    await fireEvent.changeText(input, 'Hi @sa');
    await fireEvent(input, 'selectionChange', {
      nativeEvent: { selection: { start: 6, end: 6 } },
    });
    await fireEvent.press(await screen.findByLabelText('Mention Sakura Haruno, @sakura'));
    await fireEvent.press(screen.getByText('Post'));

    await waitFor(() => {
      expect(onPost).toHaveBeenCalledWith('<p>Hi @sakura </p>', undefined);
    });
    expect(searchPeople).toHaveBeenCalledWith('token', 'sa');
  });

  it('does not send duplicate posts while a submission is pending', async () => {
    let finish!: () => void;
    const onPost = jest.fn(() => new Promise<void>((resolve) => {
      finish = resolve;
    }));
    await renderRouter({ index: () => <PostComposer onPost={onPost} /> });
    await fireEvent.changeText(screen.getByLabelText('Write something…'), 'hello');
    const submit = screen.getByText('Post');

    await fireEvent.press(submit);
    await fireEvent.press(submit);

    expect(onPost).toHaveBeenCalledTimes(1);
    finish();
    await waitFor(() => expect(onPost).toHaveBeenCalledTimes(1));
  });
});
