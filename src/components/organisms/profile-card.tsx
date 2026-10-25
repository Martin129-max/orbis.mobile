import { StyleSheet, View } from 'react-native';
import * as Atom from '@atom';

import { Spacing } from '@/constants/theme';
import type { Profile } from '@/lib/api';

type ProfileCardProps = {
  profile: Profile;
  onLogout: () => void;
};

export function ProfileCard({ profile, onLogout }: ProfileCardProps) {
  return (
    <View style={styles.card}>
      <Atom.ThemedText type="subtitle">@{profile.username}</Atom.ThemedText>
      <Atom.ThemedText themeColor="textSecondary">{profile.email}</Atom.ThemedText>
      <Atom.ThemedText type="small" themeColor="textSecondary">
        User #{profile.userId}
        {profile.isPublic ? ' · Public profile' : ' · Private profile'}
      </Atom.ThemedText>
      <Atom.Button label="Log out" variant="secondary" onPress={onLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    gap: Spacing.two,
  },
});
