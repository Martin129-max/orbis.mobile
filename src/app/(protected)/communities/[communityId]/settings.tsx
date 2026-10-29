import { useLocalSearchParams, type Href } from 'expo-router';
import * as Organism from '@organism';
import * as Template from '@template';

import { useCommunity } from '@/hooks/use-community';
import { canManage } from '@/lib/api';

export default function CommunitySettingsScreen() {
  const { communityId = '' } = useLocalSearchParams<{ communityId: string }>();
  const { loading, community, failed, retry } = useCommunity(communityId);
  const access = failed
    ? 'failed'
    : loading
      ? 'loading'
      : community && canManage(community)
        ? 'allowed'
        : 'denied';

  return (
    <Template.ScreenTemplate>
      <Organism.AccessGate
        access={access}
        description={
          community
            ? `Only the owner and admins can make changes to ${community.name}.`
            : 'Only a community’s owner and admins can change its settings.'
        }
        back={{
          label: 'Back to community',
          href: `/communities/${encodeURIComponent(communityId)}` as Href,
        }}
        onRetry={retry}>
        <Organism.ComingSoon
          title="Community settings"
          description="Community settings aren’t in the app yet. You can change them on the Orbis website in the meantime."
          webPath={`/communities/${encodeURIComponent(communityId)}/settings`}
        />
      </Organism.AccessGate>
    </Template.ScreenTemplate>
  );
}
