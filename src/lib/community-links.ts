import type { CommunityLinkPlatform, CommunityLinks } from './api';

export const communityLinkFields: {
  key: CommunityLinkPlatform;
  label: string;
  example: string;
  pattern: RegExp;
}[] = [
  {
    key: 'x',
    label: 'X',
    example: 'https://x.com/yourcommunity',
    pattern: /^https:\/\/([a-z0-9-]+\.)*(x\.com|twitter\.com)(\/\S*)?$/i,
  },
  {
    key: 'youtube',
    label: 'YouTube',
    example: 'https://www.youtube.com/@yourcommunity',
    pattern: /^https:\/\/([a-z0-9-]+\.)*(youtube\.com|youtu\.be)(\/\S*)?$/i,
  },
  {
    key: 'kick',
    label: 'Kick',
    example: 'https://kick.com/yourcommunity',
    pattern: /^https:\/\/([a-z0-9-]+\.)*kick\.com(\/\S*)?$/i,
  },
  {
    key: 'instagram',
    label: 'Instagram',
    example: 'https://www.instagram.com/yourcommunity',
    pattern: /^https:\/\/([a-z0-9-]+\.)*instagram\.com(\/\S*)?$/i,
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    example: 'https://www.tiktok.com/@yourcommunity',
    pattern: /^https:\/\/([a-z0-9-]+\.)*tiktok\.com(\/\S*)?$/i,
  },
  {
    key: 'reddit',
    label: 'Reddit',
    example: 'https://www.reddit.com/r/yourcommunity',
    pattern: /^https:\/\/([a-z0-9-]+\.)*reddit\.com(\/\S*)?$/i,
  },
  {
    key: 'website',
    label: 'Website',
    example: 'https://yourcommunity.com',
    pattern: /^https?:\/\/[^\s/.]+(\.[^\s/.]+)+(\/\S*)?$/i,
  },
];

export function normalizeCommunityLink(value: string) {
  const link = value.trim();
  if (!link || /^[a-z][a-z0-9+.-]*:/i.test(link)) return link;
  return `https://${link}`;
}

export function normalizeCommunityLinks(values: CommunityLinks): CommunityLinks {
  const links: CommunityLinks = {};
  for (const { key } of communityLinkFields) {
    const link = normalizeCommunityLink(values[key] ?? '');
    if (link) links[key] = link;
  }
  return links;
}

export function invalidCommunityLink(values: CommunityLinks) {
  return communityLinkFields.find(({ key, pattern }) => {
    const link = values[key];
    return Boolean(link && !pattern.test(link));
  });
}
