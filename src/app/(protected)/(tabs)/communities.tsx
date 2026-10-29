import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import * as Atom from '@atom';
import * as Template from '@template';

import { APP_ROUTES } from '@/lib/navigation';

export default function CommunitiesTab() {
  return (
    <Template.ScreenTemplate>
      <View style={styles.page}>
        <Atom.ThemedText type="subtitle">Communities</Atom.ThemedText>
        <Atom.ThemedText themeColor="textSecondary">
          Find your communities, join new spaces, and keep up with conversations.
        </Atom.ThemedText>
        <Atom.Button
          label="Browse search"
          onPress={() => router.push(APP_ROUTES.search as any)}
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
