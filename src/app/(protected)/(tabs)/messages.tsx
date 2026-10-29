import * as Organism from '@organism';
import * as Template from '@template';

export default function MessagesTab() {
  return (
    <Template.ScreenTemplate>
      <Organism.ComingSoon
        title="Messages"
        description="Messages aren’t in the app yet. You can read and send them on the Orbis website in the meantime."
        webPath="/messages"
      />
    </Template.ScreenTemplate>
  );
}
