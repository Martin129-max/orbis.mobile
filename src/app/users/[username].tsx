import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import * as Atom from '@atom';
import * as Template from '@template';

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();

  return (
    <Template.ScreenTemplate>
      <View style={styles.page}>
        <Atom.ThemedText type="subtitle">@{username}</Atom.ThemedText>
        <Atom.ThemedText themeColor="textSecondary">
          User profile details and recent activity show here.
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
