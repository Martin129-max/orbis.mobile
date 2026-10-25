import * as Organism from '@organism';
import * as Template from '@template';

export default function LoginScreen() {
  return (
    <Template.ScreenTemplate>
      <Organism.AuthForm mode="login" />
    </Template.ScreenTemplate>
  );
}
