import { StyleSheet, View } from 'react-native';
import * as Atom from '@atom';
import * as Template from '@template';

export default function NotificationsScreen() {
  return (
    <Template.ScreenTemplate>
      <View style={styles.page}>
        <Atom.ThemedText type="subtitle">Notifications</Atom.ThemedText>
        <Atom.ThemedText themeColor="textSecondary">
          Review mentions, replies, and updates without leaving the app.
        </Atom.ThemedText>
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
