import * as Organism from '@organism';
import * as Template from '@template';

export default function CommunitiesTab() {
  return (
    <Template.ScreenTemplate>
      <Organism.ComingSoon
        title="Communities"
        description="Browsing and joining communities isn’t in the app yet. You can use it on the Orbis website in the meantime."
        webPath="/explore"
      />
    </Template.ScreenTemplate>
  );
}
