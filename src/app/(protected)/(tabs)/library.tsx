import * as Organism from '@organism';
import * as Template from '@template';

export default function LibraryTab() {
  return (
    <Template.ScreenTemplate>
      <Organism.ComingSoon
        title="Library"
        description="Tracking what you’re watching, reading, and playing isn’t in the app yet. You can use it on the Orbis website in the meantime."
        webPath="/library"
      />
    </Template.ScreenTemplate>
  );
}
