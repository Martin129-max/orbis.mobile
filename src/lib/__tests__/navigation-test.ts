import { pathWithQuery, safeNext } from '../navigation';

describe('safeNext', () => {
  it('keeps in-app paths with their query', () => {
    expect(safeNext('/communities/5?post=7')).toBe('/communities/5?post=7');
  });

  it('rejects other sites and the auth screens', () => {
    expect(safeNext('https://evil.test/steal')).toBeNull();
    expect(safeNext('//evil.test')).toBeNull();
    expect(safeNext('/\\evil.test')).toBeNull();
    expect(safeNext('/login')).toBeNull();
    expect(safeNext('/register?next=/settings')).toBeNull();
  });
});

describe('pathWithQuery', () => {
  const communityRoute = ['(protected)', 'communities', '[communityId]'];

  it('drops route params but keeps query values that match a path segment', () => {
    expect(pathWithQuery('/communities/5', { communityId: '5', post: '5' }, communityRoute)).toBe(
      '/communities/5?post=5',
    );
  });

  it('keeps repeated query values', () => {
    expect(pathWithQuery('/settings', { tab: ['a', 'b'] }, ['(protected)', 'settings'])).toBe(
      '/settings?tab=a&tab=b',
    );
  });
});
