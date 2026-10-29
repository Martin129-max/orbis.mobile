import { useLocalSearchParams } from 'expo-router';
import * as Organism from '@organism';
import * as Template from '@template';

import { useCurrentProfile } from '@/hooks/use-current-profile';

export default function DirectoryScreen() {
  const query = new URLSearchParams(useLocalSearchParams<Record<string, string>>()).toString();
  const { profile, failed, retry } = useCurrentProfile();
  const access = failed ? 'failed' : !profile ? 'loading' : profile.isAdmin ? 'allowed' : 'denied';

  return (
    <Template.ScreenTemplate>
      <Organism.AccessGate
        access={access}
        description="Only site admins can see the directory."
        onRetry={retry}>
        <Organism.ComingSoon
          title="Directory"
          description="The directory isn’t in the app yet. You can open it on the Orbis website in the meantime."
          webPath={`/directory${query ? `?${query}` : ''}`}
        />
      </Organism.AccessGate>
    </Template.ScreenTemplate>
  );
}
