import * as Organism from '@organism';
import * as Template from '@template';

export default function NotificationsScreen() {
  return (
    <Template.ScreenTemplate>
      <Organism.ComingSoon
        title="Notifications"
        description="Notifications aren’t in the app yet. You can see them on the Orbis website in the meantime."
        webPath="/notifications"
      />
    </Template.ScreenTemplate>
  );
}
