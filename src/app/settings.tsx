import { StyleSheet, View } from 'react-native';
import * as Atom from '@atom';
import * as Template from '@template';

export default function SettingsScreen() {
  return (
    <Template.ScreenTemplate>
      <View style={styles.page}>
        <Atom.ThemedText type="subtitle">Settings</Atom.ThemedText>
        <Atom.ThemedText themeColor="textSecondary">
          Control profile visibility, appearance, and account preferences.
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
