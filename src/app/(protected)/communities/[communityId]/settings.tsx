import { useLocalSearchParams } from 'expo-router';
import * as Organism from '@organism';
import * as Template from '@template';

export default function CommunitySettingsScreen() {
  const { communityId } = useLocalSearchParams<{ communityId: string }>();

  return (
    <Template.ScreenTemplate>
      <Organism.ComingSoon
        title="Community settings"
        description="Community settings aren’t in the app yet. Owners and admins can change them on the Orbis website in the meantime."
        webPath={`/communities/${encodeURIComponent(communityId ?? '')}/settings`}
      />
    </Template.ScreenTemplate>
  );
}
