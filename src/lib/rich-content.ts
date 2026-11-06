export type RichNode = {
  tag: string;
  text?: string;
  href?: string;
  children: RichNode[];
};

const allowedTags = new Set([
  'a',
  'blockquote',
  'br',
  'code',
  'del',
  'div',
  'em',
  'i',
  'li',
  'ol',
  'p',
  'pre',
  's',
  'strike',
  'strong',
  'u',
  'ul',
]);

export function safeWebUrl(raw: string): string | null {
  try {
    const url = new URL(/^www\./i.test(raw) ? `https://${raw}` : raw);
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.toString();
    if (url.protocol === 'mailto:' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(url.pathname)) {
      return url.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export function normalizeWebUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value || (/^[a-z][\w+.-]*:/i.test(value) && !/^https?:\/\//i.test(value))) return null;
  return safeWebUrl(/^https?:\/\//i.test(value) ? value : `https://${value}`);
}

export function findTextUrl(text: string): string | null {
  const found = text.match(/(?:https?:\/\/|www\.)[^\s<>"']+/i)?.[0];
  if (!found) return null;
  return safeWebUrl(found.replace(/[.,!?;:)\]}'"]+$/, ''));
}

function decodeEntities(value: string) {
  return value.replace(/&(#(?:x[\da-f]+|\d+)|amp|lt|gt|quot|apos|nbsp);/gi, (entity, name: string) => {
    const key = name.toLowerCase();
    if (key === 'amp') return '&';
    if (key === 'lt') return '<';
    if (key === 'gt') return '>';
    if (key === 'quot') return '"';
    if (key === 'apos') return "'";
    if (key === 'nbsp') return ' ';
    const code = key.startsWith('#x')
      ? Number.parseInt(key.slice(2), 16)
      : Number.parseInt(key.slice(1), 10);
    return Number.isInteger(code) && code >= 0 && code <= 0x10ffff
      ? String.fromCodePoint(code)
      : entity;
  });
}

function attributeValue(attributes: string, name: string) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = attributes.match(new RegExp(`\\b${escapedName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return match ? decodeEntities(match[1] ?? match[2] ?? match[3] ?? '') : undefined;
}

export function parseRichContent(content: string): RichNode[] {
  const root: RichNode = { tag: 'root', children: [] };
  const stack = [root];
  const tokens = content.match(/<[^>]*>|[^<]+/g) ?? [];

  for (const token of tokens) {
    if (!token.startsWith('<')) {
      stack[stack.length - 1].children.push({
        tag: 'text',
        text: decodeEntities(token),
        children: [],
      });
      continue;
    }

    const match = token.match(/^<\s*(\/?)\s*([a-z][\w-]*)([\s\S]*?)>$/i);
    if (!match) {
      stack[stack.length - 1].children.push({
        tag: 'text',
        text: decodeEntities(token),
        children: [],
      });
      continue;
    }
    const closing = Boolean(match[1]);
    const tag = match[2].toLowerCase();
    if (closing) {
      let index = -1;
      for (let cursor = stack.length - 1; cursor > 0; cursor -= 1) {
        if (stack[cursor].tag === tag) {
          index = cursor;
          break;
        }
      }
      if (index > 0) stack.length = index;
      continue;
    }
    if (!allowedTags.has(tag)) continue;

    const node: RichNode = {
      tag,
      children: [],
      ...(tag === 'a' ? { href: attributeValue(match[3], 'href') } : {}),
    };
    stack[stack.length - 1].children.push(node);
    if (!/\/\s*>$/.test(token) && tag !== 'br') stack.push(node);
  }

  return root.children;
}
