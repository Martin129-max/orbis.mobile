import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import * as Atom from '@atom';
import * as Template from '@template';

export default function CommunityDetailScreen() {
  const { communityId } = useLocalSearchParams<{ communityId: string }>();

  return (
    <Template.ScreenTemplate>
      <View style={styles.page}>
        <Atom.ThemedText type="subtitle">Community #{communityId}</Atom.ThemedText>
        <Atom.ThemedText themeColor="textSecondary">
          Community details and posts live here.
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
