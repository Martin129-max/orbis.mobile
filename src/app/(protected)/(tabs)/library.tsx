import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import * as Atom from '@atom';
import * as Template from '@template';

import { APP_ROUTES } from '@/lib/navigation';

export default function LibraryTab() {
  return (
    <Template.ScreenTemplate>
      <View style={styles.page}>
        <Atom.ThemedText type="subtitle">Library</Atom.ThemedText>
        <Atom.ThemedText themeColor="textSecondary">
          Track what you are reading, watching, and playing.
        </Atom.ThemedText>
        <Atom.Button
          label="Open settings"
          onPress={() => router.push(APP_ROUTES.settings as any)}
        />
      </View>
    </Template.ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  page: {
    width: '100%',
    gap: 12,
  },
});
