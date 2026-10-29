import { api, createWallPost, getProfile, login, setUnauthorizedHandler } from '../api';

function respond(status: number, body: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

describe('api requests', () => {
  const fetchMock = jest.fn();
  const onUnauthorized = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    onUnauthorized.mockReset();
    globalThis.fetch = fetchMock;
    setUnauthorizedHandler(onUnauthorized);
  });

  afterAll(() => setUnauthorizedHandler(null));

  it('reports an expired session for the token that was rejected', async () => {
    fetchMock.mockReturnValue(respond(401, { message: 'Unauthorized' }));

    await expect(getProfile('old-token')).resolves.toBeNull();
    expect(onUnauthorized).toHaveBeenCalledWith('old-token');
  });

  it('does not treat a failed login as an expired session', async () => {
    fetchMock.mockReturnValue(respond(401, { message: 'Unauthorized' }));

    await expect(login({ identifier: 'naruto', password: 'wrong' })).rejects.toThrow(
      'Invalid username, email, or password.',
    );
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('keeps the session when the network is down', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));

    await expect(getProfile('token')).rejects.toThrow("Can't reach Orbis right now. Please try again.");
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('shows the server’s wait time when rate limited', async () => {
    fetchMock.mockReturnValue(
      respond(429, { message: 'You’re doing that too often. Try again in 45 minutes' }),
    );

    await expect(api('/friends', { method: 'POST' })).rejects.toThrow(
      'You’re doing that too often. Try again in 45 minutes.',
    );
  });

  it('passes the server’s reason through when a post is refused', async () => {
    fetchMock.mockReturnValue(
      respond(403, {
        code: 'account_too_new',
        message: 'New accounts can post links after their first day. Try again in about 5 hours',
      }),
    );

    await expect(createWallPost('token', 'naruto', 'Free episodes https://spam.test')).rejects.toThrow(
      'New accounts can post links after their first day. Try again in about 5 hours.',
    );
  });
});
