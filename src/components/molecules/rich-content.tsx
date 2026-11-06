import { router, type Href } from 'expo-router';
import * as Linking from 'expo-linking';
import { useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View, type TextStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { parseRichContent, safeWebUrl, type RichNode } from '@/lib/rich-content';

function openUrl(url: string, onError: () => void) {
  const safeUrl = safeWebUrl(url);
  if (!safeUrl) return;
  void Linking.openURL(safeUrl).catch(onError);
}

function renderText(value: string, key: string, accent: string, onLinkError: () => void) {
  const mentionsAndLinks = /(?:https?:\/\/|www\.)[^\s<>"']+|(^|[\s(])@([A-Za-z0-9_]{2,20})\b/gi;
  const children: ReactNode[] = [];
  let end = 0;
  let match: RegExpExecArray | null;
  while ((match = mentionsAndLinks.exec(value))) {
    const raw = match[0];
    if (/^(?:https?:\/\/|www\.)/i.test(raw)) {
      const link = raw.replace(/[.,!?;:)\]}'"]+$/, '');
      const href = safeWebUrl(link);
      if (!href) continue;
      const start = match.index;
      if (start > end) children.push(value.slice(end, start));
      children.push(
        <Text
          key={`${key}-url-${start}`}
          accessibilityRole="link"
          style={[styles.link, { color: accent }]}
          onPress={() => openUrl(href, onLinkError)}>
          {link}
        </Text>,
      );
      end = start + link.length;
      continue;
    }

    const prefix = match[1] ?? '';
    const start = match.index + prefix.length;
    if (start > end) children.push(value.slice(end, start));
    const username = match[2] ?? '';
    children.push(
      <Text
        key={`${key}-mention-${start}`}
        accessibilityRole="link"
        style={[styles.mention, { color: accent }]}
        onPress={() => router.push(`/users/${encodeURIComponent(username)}` as Href)}>
        @{username}
      </Text>,
    );
    end = start + username.length + 1;
  }
  if (end < value.length) children.push(value.slice(end));
  return children;
}

function renderInline(node: RichNode, key: string, onLinkError: () => void, accent: string): ReactNode {
  if (node.tag === 'text') {
    return renderText(node.text ?? '', key, accent, onLinkError);
  }
  if (node.tag === 'br') return '\n';

  const children = node.children.map((child, index) =>
    renderInline(child, `${key}-${index}`, onLinkError, accent),
  );
  const style = inlineStyles[node.tag];
  if (node.tag === 'a') {
    const href = node.href ? safeWebUrl(node.href) : null;
    return (
      <Text
        key={key}
        accessibilityRole={href ? 'link' : undefined}
        style={href ? [styles.link, { color: accent }] : undefined}
        onPress={href ? () => openUrl(href, onLinkError) : undefined}>
        {children}
      </Text>
    );
  }
  return style ? <Text key={key} style={style}>{children}</Text> : <Text key={key}>{children}</Text>;
}

function renderFlow(nodes: RichNode[], onLinkError: () => void, accent: string): ReactNode[] {
  const output: ReactNode[] = [];

  nodes.forEach((node, index) => {
    const key = `content-${index}`;
    if (node.tag === 'ul' || node.tag === 'ol') {
      const start = node.tag === 'ol' ? 1 : 0;
      const items = node.children.filter((child) => child.tag === 'li');
      output.push(
        <View key={key} style={styles.list}>
          {items.map((item, itemIndex) => (
            <View key={`${key}-${itemIndex}`} style={styles.listItem}>
              <Text style={styles.listMarker}>
                {node.tag === 'ol' ? `${start + itemIndex}.` : '•'}
              </Text>
              <Text style={styles.body}>
                {item.children.map((child, childIndex) =>
                  renderInline(child, `${key}-${itemIndex}-${childIndex}`, onLinkError, accent),
                )}
              </Text>
            </View>
          ))}
        </View>,
      );
    } else if (node.tag === 'p' || node.tag === 'div') {
      output.push(
        <Text key={key} style={styles.paragraph}>
          {node.children.map((child, childIndex) =>
            renderInline(child, `${key}-${childIndex}`, onLinkError, accent),
          )}
        </Text>,
      );
    } else if (node.tag === 'blockquote') {
      output.push(
        <View key={key} style={styles.quote}>
          <Text style={styles.body}>
            {node.children.map((child, childIndex) =>
              renderInline(child, `${key}-${childIndex}`, onLinkError, accent),
            )}
          </Text>
        </View>,
      );
    } else if (node.tag === 'pre') {
      output.push(
        <Text key={key} style={styles.codeBlock}>
          {node.children.map((child, childIndex) =>
            renderInline(child, `${key}-${childIndex}`, onLinkError, accent),
          )}
        </Text>,
      );
    } else {
      output.push(
        <Text key={key} style={styles.paragraph}>
          {renderInline(node, key, onLinkError, accent)}
        </Text>,
      );
    }
  });
  return output;
}

export function RichContent({ content }: { content: string }) {
  const theme = useTheme();
  const [linkError, setLinkError] = useState(false);
  const nodes = useMemo(() => parseRichContent(content), [content]);

  return (
    <View>
      <View>
        {renderFlow(nodes, () => setLinkError(true), theme.accent)}
      </View>
      {linkError ? (
        <Text style={[styles.linkError, { color: theme.textSecondary }]}>
          Could not open this link.
        </Text>
      ) : null}
    </View>
  );
}

const inlineStyles: Record<string, TextStyle> = StyleSheet.create({
  strong: { fontWeight: '700' },
  em: { fontStyle: 'italic' },
  i: { fontStyle: 'italic' },
  u: { textDecorationLine: 'underline' },
  s: { textDecorationLine: 'line-through' },
  strike: { textDecorationLine: 'line-through' },
  del: { textDecorationLine: 'line-through' },
  code: { fontFamily: 'monospace' },
});

const styles = StyleSheet.create({
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  link: {
    color: '#b23b26',
    textDecorationLine: 'underline',
  },
  mention: {
    color: '#b23b26',
    fontWeight: '600',
  },
  list: {
    gap: 4,
    marginBottom: 8,
  },
  listItem: {
    flexDirection: 'row',
    gap: 8,
  },
  listMarker: {
    width: 24,
    fontSize: 15,
    lineHeight: 22,
  },
  quote: {
    borderLeftWidth: 3,
    borderLeftColor: '#b23b26',
    paddingLeft: 12,
    marginVertical: 6,
  },
  codeBlock: {
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 20,
    padding: 8,
  },
  linkError: {
    fontSize: 12,
  },
});
