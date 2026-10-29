import { usePathname } from 'expo-router';
import * as Organism from '@organism';
import * as Template from '@template';

export default function NotFoundScreen() {
  const pathname = usePathname();

  return (
    <Template.ScreenTemplate>
      <Organism.ComingSoon
        title="Not in the app yet"
        description="This page isn’t available in the app yet. You can open it on the Orbis website instead."
        webPath={pathname || '/'}
      />
    </Template.ScreenTemplate>
  );
}
