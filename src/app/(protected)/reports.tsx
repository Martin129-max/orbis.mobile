import { useLocalSearchParams } from 'expo-router';
import * as Organism from '@organism';
import * as Template from '@template';

import { useCurrentProfile } from '@/hooks/use-current-profile';

export default function ReportsScreen() {
  const query = new URLSearchParams(useLocalSearchParams<Record<string, string>>()).toString();
  const { profile, failed, retry } = useCurrentProfile();
  const access = failed ? 'failed' : profile ? 'allowed' : 'loading';

  return (
    <Template.ScreenTemplate>
      <Organism.AccessGate access={access} onRetry={retry}>
        <Organism.ComingSoon
          title={profile?.isAdmin ? 'Reports' : 'My reports'}
          description={
            profile?.isAdmin
              ? 'Reviewing reports isn’t in the app yet. You can review them on the Orbis website in the meantime.'
              : 'Your reports aren’t in the app yet. You can follow them on the Orbis website in the meantime.'
          }
          webPath={`/reports${query ? `?${query}` : ''}`}
        />
      </Organism.AccessGate>
    </Template.ScreenTemplate>
  );
}
