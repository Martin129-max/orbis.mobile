import { StyleSheet, View } from 'react-native';
import * as Atom from '@atom';
import * as Template from '@template';

export default function SearchScreen() {
  return (
    <Template.ScreenTemplate>
      <View style={styles.page}>
        <Atom.ThemedText type="subtitle">Search</Atom.ThemedText>
        <Atom.ThemedText themeColor="textSecondary">
          Search communities, people, and content from one place.
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
