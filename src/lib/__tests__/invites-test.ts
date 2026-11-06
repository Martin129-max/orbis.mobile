import {
  acceptInvite,
  createInvite,
  getInvitePreview,
} from '../api';

describe('community invites API', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('loads invite previews publicly and encodes the invite code', async () => {
    const preview = { code: 'a/b', community: { id: 4, name: 'Games' } };
    const fetch = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(preview), { status: 200 }),
    );

    await expect(getInvitePreview('a/b')).resolves.toEqual(preview);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/invites\/a%2Fb$/),
      undefined,
    );
  });

  it('treats a missing preview as an unavailable invite', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 404 }));

    await expect(getInvitePreview('missing')).resolves.toBeNull();
  });

  it('creates invite links with the selected expiration and use limits', async () => {
    const invite = { code: 'new-link' };
    const fetch = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(invite), { status: 201 }),
    );

    await expect(createInvite('token', 4, { maxAge: 3600, maxUses: 5 })).resolves.toEqual(invite);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/communities\/4\/invites$/),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer token' }),
        body: JSON.stringify({ maxAge: 3600, maxUses: 5 }),
      }),
    );
  });

  it('accepts a code-specific invite after authentication', async () => {
    const community = { id: 4, name: 'Games' };
    const fetch = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(community), { status: 200 }),
    );

    await expect(acceptInvite('token', 'code/with/slash')).resolves.toEqual(community);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/invites\/code%2Fwith%2Fslash$/),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer token' }),
      }),
    );
  });
});
