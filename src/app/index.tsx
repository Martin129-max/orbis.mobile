import { router } from 'expo-router';
import * as Atom from '@atom';
import * as Organism from '@organism';
import * as Template from '@template';

import { useAuthStore } from '@/stores/auth-store';

export default function HomeScreen() {
  const signedIn = useAuthStore((state) => Boolean(state.token));

  return (
    <Template.ScreenTemplate>
      <Atom.ThemedText type="title">Orbis</Atom.ThemedText>
      <Organism.ServerStatus />
      {signedIn ? (
        <Atom.Button label="Your profile" onPress={() => router.push('/profile')} />
      ) : (
        <>
          <Atom.Button label="Log in" onPress={() => router.push('/login')} />
          <Atom.Button
            label="Sign up"
            variant="secondary"
            onPress={() => router.push('/register')}
          />
        </>
      )}
    </Template.ScreenTemplate>
  );
}
