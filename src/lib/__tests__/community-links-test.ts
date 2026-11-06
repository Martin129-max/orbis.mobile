import {
  communityLinkFields,
  invalidCommunityLink,
  normalizeCommunityLink,
  normalizeCommunityLinks,
} from '../community-links';

describe('community links', () => {
  it('uses the web normalization for links without a scheme', () => {
    expect(normalizeCommunityLink(' example.com/community ')).toBe('https://example.com/community');
    expect(normalizeCommunityLink('http://example.com')).toBe('http://example.com');
  });

  it('accepts each supported platform and rejects links to the wrong host', () => {
    for (const { key, example, pattern } of communityLinkFields) {
      const link = normalizeCommunityLink(example);
      expect(pattern.test(link)).toBe(true);
      expect(invalidCommunityLink({ [key]: link })).toBeUndefined();
    }

    expect(invalidCommunityLink({ x: 'https://not-x.example/community' })?.key).toBe('x');
    expect(invalidCommunityLink({ website: 'javascript:alert(1)' })?.key).toBe('website');
  });

  it('omits empty links when sending the shared API payload', () => {
    expect(normalizeCommunityLinks({
      x: ' https://x.com/konoha ',
      website: '',
    })).toEqual({ x: 'https://x.com/konoha' });
  });
});
