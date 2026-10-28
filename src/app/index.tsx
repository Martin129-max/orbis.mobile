import { Redirect, router, type Href } from 'expo-router';
import * as Atom from '@atom';
import * as Organism from '@organism';
import * as Template from '@template';

import { useAuthStore } from '@/stores/auth-store';

export default function HomeScreen() {
  const signedIn = useAuthStore((state) => Boolean(state.token));

  if (signedIn) return <Redirect href={'/(protected)/(tabs)' as Href} />;

  return (
    <Template.ScreenTemplate>
      <Atom.ThemedText type="title">Orbis</Atom.ThemedText>
      <Organism.ServerStatus />
      <Atom.Button label="Log in" onPress={() => router.push('/login')} />
      <Atom.Button
        label="Sign up"
        variant="secondary"
        onPress={() => router.push('/register')}
      />
    </Template.ScreenTemplate>
  );
}
