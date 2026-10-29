import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import * as Atom from '@atom';
import * as Template from '@template';

export default function CommunitySettingsScreen() {
  const { communityId } = useLocalSearchParams<{ communityId: string }>();

  return (
    <Template.ScreenTemplate>
      <View style={styles.page}>
        <Atom.ThemedText type="subtitle">Community settings #{communityId}</Atom.ThemedText>
        <Atom.ThemedText themeColor="textSecondary">
          Update roles, privacy, and community preferences here.
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
