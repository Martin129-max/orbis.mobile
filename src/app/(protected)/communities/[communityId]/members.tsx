import { useLocalSearchParams } from 'expo-router';
import * as Organism from '@organism';
import * as Template from '@template';

export default function CommunityMembersScreen() {
  const { communityId = '' } = useLocalSearchParams<{ communityId: string }>();

  return (
    <Template.ScreenTemplate>
      <Organism.CommunityMembers communityId={communityId} />
    </Template.ScreenTemplate>
  );
}
