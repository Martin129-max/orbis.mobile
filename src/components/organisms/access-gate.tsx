import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import * as Atom from '@atom';

import { Spacing } from '@/constants/theme';

export type Access = 'loading' | 'failed' | 'denied' | 'allowed';

export function AccessGate({
  access,
  description,
  back,
  onRetry,
  children,
}: {
  access: Access;
  description?: string;
  back?: { label: string; href: Href };
  onRetry: () => void;
  children: ReactNode;
}) {
  if (access === 'allowed') return <>{children}</>;

  return (
    <View style={styles.page}>
      {access === 'loading' ? (
        <Atom.ThemedText themeColor="textSecondary">Checking your access…</Atom.ThemedText>
      ) : access === 'failed' ? (
        <>
          <Atom.ErrorMessage>Could not check your access. Check your connection and try again.</Atom.ErrorMessage>
          <Atom.Button label="Try again" variant="secondary" onPress={onRetry} />
        </>
      ) : (
        <>
          <Atom.ThemedText type="subtitle">You don’t have access.</Atom.ThemedText>
          {description ? (
            <Atom.ThemedText themeColor="textSecondary">{description}</Atom.ThemedText>
          ) : null}
          {back ? (
            <Atom.Button
              label={back.label}
              variant="secondary"
              onPress={() => router.dismissTo(back.href)}
            />
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    width: '100%',
    gap: Spacing.three,
  },
});
