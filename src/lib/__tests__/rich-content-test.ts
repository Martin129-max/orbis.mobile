import { findTextUrl, normalizeWebUrl, parseRichContent, safeWebUrl } from '../rich-content';

describe('rich content helpers', () => {
  it('parses the HTML formatting shared with the web client', () => {
    expect(parseRichContent('<p><strong>Bold</strong> &amp; <a href="https://example.com">link</a></p>')).toEqual([
      {
        tag: 'p',
        children: [
          { tag: 'strong', children: [{ tag: 'text', text: 'Bold', children: [] }] },
          { tag: 'text', text: ' & ', children: [] },
          {
            tag: 'a',
            href: 'https://example.com',
            children: [{ tag: 'text', text: 'link', children: [] }],
          },
        ],
      },
    ]);
  });

  it('keeps script and unknown attributes from becoming executable markup', () => {
    expect(parseRichContent('<script>alert(1)</script><p style="color:red">Safe</p>')).toEqual([
      { tag: 'text', text: 'alert(1)', children: [] },
      { tag: 'p', children: [{ tag: 'text', text: 'Safe', children: [] }] },
    ]);
  });

  it('accepts only safe web and mail links', () => {
    expect(safeWebUrl('www.example.com')).toBe('https://www.example.com/');
    expect(safeWebUrl('javascript:alert(1)')).toBeNull();
    expect(safeWebUrl('data:text/html,hi')).toBeNull();
    expect(safeWebUrl('mailto:hello@example.com')).toBe('mailto:hello@example.com');
  });

  it('normalizes bare web addresses entered in the link field', () => {
    expect(normalizeWebUrl('example.com')).toBe('https://example.com/');
    expect(normalizeWebUrl('www.example.com')).toBe('https://www.example.com/');
    expect(normalizeWebUrl('javascript:alert(1)')).toBeNull();
  });

  it('extracts a safe URL from plain post text without trailing punctuation', () => {
    expect(findTextUrl('See https://example.com/story).')).toBe('https://example.com/story');
    expect(findTextUrl('not a link')).toBeNull();
  });
});
