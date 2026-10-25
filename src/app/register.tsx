import * as Organism from '@organism';
import * as Template from '@template';

export default function RegisterScreen() {
  return (
    <Template.ScreenTemplate>
      <Organism.AuthForm mode="signup" />
    </Template.ScreenTemplate>
  );
}
