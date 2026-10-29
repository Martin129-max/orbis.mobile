import * as Organism from '@organism';
import * as Template from '@template';

export default function SearchScreen() {
  return (
    <Template.ScreenTemplate>
      <Organism.ComingSoon
        title="Search"
        description="Search isn’t in the app yet. You can search Orbis on the website in the meantime."
        webPath="/"
      />
    </Template.ScreenTemplate>
  );
}
