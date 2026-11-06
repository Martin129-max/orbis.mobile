import { useLocalSearchParams, type Href } from 'expo-router';
import * as Organism from '@organism';
import * as Template from '@template';

import { useCommunity } from '@/hooks/use-community';

export default function CommunityMemberSettingsScreen() {
  const { communityId = '' } = useLocalSearchParams<{ communityId: string }>();
  const { loading, community, failed, retry } = useCommunity(communityId);
  const access = failed
    ? 'failed'
    : loading
      ? 'loading'
      : community?.role
        ? 'allowed'
        : 'denied';

  return (
    <Template.ScreenTemplate>
      <Organism.AccessGate
        access={access}
        description={
          community
            ? `Only members of ${community.name} can change their community settings.`
            : 'You must be a community member to change your community settings.'
        }
        back={{
          label: 'Back to community',
          href: `/communities/${encodeURIComponent(communityId)}` as Href,
        }}
        onRetry={retry}>
        {community ? <Organism.CommunityMemberSettings community={community} /> : null}
      </Organism.AccessGate>
    </Template.ScreenTemplate>
  );
}
