import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import * as Atom from '@atom';

import { Spacing } from '@/constants/theme';
import { WEB_URL } from '@/lib/api';

export function ComingSoon({
  title,
  description,
  webPath,
  showHome = false,
}: {
  title: string;
  description: string;
  webPath: string;
  showHome?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);

  async function openOnWeb() {
    setError(null);
    try {
      await Linking.openURL(`${WEB_URL}${webPath}`);
    } catch {
      setError('Could not open the website. Please try again.');
    }
  }

  return (
    <View style={styles.page}>
      <Atom.ThemedText type="smallBold" themeColor="textSecondary">
        Coming soon
      </Atom.ThemedText>
      <Atom.ThemedText type="subtitle">{title}</Atom.ThemedText>
      <Atom.ThemedText themeColor="textSecondary">{description}</Atom.ThemedText>
      <Atom.Button label="Open on the web" variant="secondary" onPress={openOnWeb} />
      {showHome ? (
        <Atom.Button label="Back to Orbis" variant="secondary" onPress={() => router.replace('/')} />
      ) : null}
      {error ? <Atom.ErrorMessage>{error}</Atom.ErrorMessage> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    width: '100%',
    gap: Spacing.three,
  },
});
