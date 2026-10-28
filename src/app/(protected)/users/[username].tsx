import { useLocalSearchParams } from 'expo-router';
import * as Organism from '@organism';

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  return <Organism.MemberProfile key={username} username={username} />;
}
