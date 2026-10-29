import { useLocalSearchParams } from 'expo-router';
import * as Organism from '@organism';
import * as Template from '@template';

export default function CommunityDetailScreen() {
  const { communityId, ...query } = useLocalSearchParams<Record<string, string>>();
  const search = new URLSearchParams(query).toString();

  return (
    <Template.ScreenTemplate>
      <Organism.ComingSoon
        title="Community"
        description="Communities aren’t in the app yet. You can open this one on the Orbis website in the meantime."
        webPath={`/communities/${encodeURIComponent(communityId ?? '')}${search ? `?${search}` : ''}`}
      />
    </Template.ScreenTemplate>
  );
}
