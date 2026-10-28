import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import * as Atom from '@atom';
import * as Template from '@template';

import { APP_ROUTES } from '@/lib/navigation';

export default function MessagesTab() {
  return (
    <Template.ScreenTemplate>
      <View style={styles.page}>
        <Atom.ThemedText type="subtitle">Messages</Atom.ThemedText>
        <Atom.ThemedText themeColor="textSecondary">
          Follow private conversations and community check-ins.
        </Atom.ThemedText>
        <Atom.Button
          label="Open notifications"
          onPress={() => router.push(APP_ROUTES.notifications as any)}
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
