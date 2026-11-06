import {
  api,
  createCommunity,
  createWallPost,
  deleteCommunity,
  getCommunity,
  getCommunityMembers,
  getCommunityPosts,
  getDirectoryUsers,
  getProfile,
  getUserPosts,
  joinCommunity,
  login,
  removeCommunityImage,
  searchCommunities,
  setCommunityAdmin,
  setProfileVerified,
  setUnauthorizedHandler,
  updateCommunity,
  uploadCommunityImage,
} from '../api';

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

  it('asks the server to leave out hidden kinds of posts, like web', async () => {
    fetchMock.mockReturnValue(respond(200, { items: [], nextCursor: null }));

    await getUserPosts(null, 'naruto', 'next-page', ['post', 'activity']);

    expect(String(fetchMock.mock.calls[0][0])).toMatch(
      /\/users\/naruto\/posts\?cursor=next-page&exclude=post%2Cactivity$/,
    );
  });

  it('treats a hidden community as no access but reports outages', async () => {
    fetchMock.mockReturnValueOnce(respond(404, { message: 'Not Found' }));
    await expect(getCommunity('token', '5')).resolves.toBeNull();

    fetchMock.mockReturnValueOnce(respond(500, { message: 'Internal server error' }));
    await expect(getCommunity('token', '5')).rejects.toThrow();
  });

  it('uses the existing Explore search and join endpoints', async () => {
    fetchMock
      .mockReturnValueOnce(respond(200, []))
      .mockReturnValueOnce(respond(200, { id: 5, name: 'Konoha', iconUrl: null }));

    await searchCommunities('token', 'leaf village');
    await joinCommunity('token', 5);

    expect(String(fetchMock.mock.calls[0][0])).toContain('/communities/search?q=leaf+village');
    expect(String(fetchMock.mock.calls[1][0])).toContain('/communities/5/join');
    expect(fetchMock.mock.calls[1][1].method).toBe('POST');
  });

  it('uses existing admin directory and verification endpoints', async () => {
    fetchMock
      .mockReturnValueOnce(respond(200, { items: [], total: 0, page: 1, pageSize: 20 }))
      .mockReturnValueOnce(respond(200, { isVerified: true }));

    await getDirectoryUsers('token', 2);
    await expect(setProfileVerified('token', 'sakura', true)).resolves.toBe(true);

    expect(String(fetchMock.mock.calls[0][0])).toContain('/admin/users?page=2');
    expect(String(fetchMock.mock.calls[1][0])).toContain('/users/sakura/verified');
    expect(fetchMock.mock.calls[1][1].method).toBe('PUT');
  });

  it('creates communities with the shared name and visibility contract', async () => {
    fetchMock.mockReturnValue(respond(201, { id: 8, name: 'Konoha', isPublic: false }));

    await createCommunity('token', '  Konoha  ', false);

    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/communities$/);
    expect(fetchMock.mock.calls[0][1].method).toBe('POST');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      name: 'Konoha',
      isPublic: false,
    });
  });

  it('updates community fields and applies the owner-only admin endpoints', async () => {
    fetchMock
      .mockReturnValueOnce(respond(200, { name: 'New name', isPublic: true }))
      .mockReturnValueOnce(respond(200, [{ userId: 7, isAdmin: true }]))
      .mockReturnValueOnce(respond(200, [{ userId: 7, isAdmin: false }]));

    await updateCommunity('token', 5, {
      name: 'New name',
      description: 'A description',
      isPublic: true,
      links: { website: 'https://example.com' },
    });
    await setCommunityAdmin('token', 5, 7, true);
    await setCommunityAdmin('token', 5, 7, false);

    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/communities\/5$/);
    expect(fetchMock.mock.calls[0][1].method).toBe('PATCH');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      name: 'New name',
      description: 'A description',
      isPublic: true,
      links: { website: 'https://example.com' },
    });
    expect(String(fetchMock.mock.calls[1][0])).toContain('/communities/5/admins/7');
    expect(fetchMock.mock.calls[1][1].method).toBe('PUT');
    expect(fetchMock.mock.calls[2][1].method).toBe('DELETE');
  });

  it('loads community members and reports denied access', async () => {
    fetchMock
      .mockReturnValueOnce(respond(200, [{ userId: 7, username: 'sakura' }]))
      .mockReturnValueOnce(respond(403, { message: 'Forbidden' }));

    await expect(getCommunityMembers('token', 5)).resolves.toMatchObject([
      { userId: 7, username: 'sakura' },
    ]);
    await expect(getCommunityMembers('token', 5)).rejects.toThrow();
    expect(String(fetchMock.mock.calls[0][0])).toContain('/communities/5/members');
  });

  it('uploads and deletes community images using shared image endpoints', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(new Blob(['image']), { status: 200 }))
      .mockReturnValueOnce(respond(200, { coverUrl: 'https://example.com/cover.jpg' }))
      .mockReturnValueOnce(respond(200, { coverUrl: null }))
      .mockReturnValueOnce(new Response(null, { status: 204 }));

    await uploadCommunityImage('token', 5, 'cover', 'file:///cover.jpg', 'cover.jpg', 'image/jpeg');
    await removeCommunityImage('token', 5, 'cover');
    await deleteCommunity('token', 5);

    expect(String(fetchMock.mock.calls[1][0])).toContain('/communities/5/cover');
    expect(fetchMock.mock.calls[1][1].method).toBe('POST');
    expect(fetchMock.mock.calls[1][1].body).toBeInstanceOf(FormData);
    expect(String(fetchMock.mock.calls[2][0])).toContain('/communities/5/cover');
    expect(fetchMock.mock.calls[2][1].method).toBe('DELETE');
    expect(String(fetchMock.mock.calls[3][0])).toContain('/communities/5');
    expect(fetchMock.mock.calls[3][1].method).toBe('DELETE');
  });

  it('loads community activity using the shared feed cursor contract', async () => {
    fetchMock.mockReturnValue(respond(200, { items: [], nextCursor: null }));

    await getCommunityPosts('token', 5, 'next-page');

    expect(String(fetchMock.mock.calls[0][0])).toContain('/communities/5/posts?cursor=next-page');
  });

  it('uses the guest-compatible community read endpoints without leaking an account token', async () => {
    fetchMock
      .mockReturnValueOnce(respond(200, { id: 5, name: 'Konoha' }))
      .mockReturnValueOnce(respond(200, { items: [], nextCursor: null }));

    await getCommunity(null, '5');
    await getCommunityPosts(null, 5);

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBeUndefined();
  });
});
