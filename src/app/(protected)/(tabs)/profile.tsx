import { router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import * as Atom from '@atom';
import * as Organism from '@organism';
import * as Template from '@template';

import { useAuthStore } from '@/stores/auth-store';

export default function ProfileScreen() {
  const profile = useAuthStore((state) => state.profile);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const logout = useAuthStore((state) => state.logout);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile()
      .then((result) => {
        if (!result) router.replace('/');
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : 'Could not load your profile.');
      });
  }, [fetchProfile]);

  if (profile) return <Organism.MemberProfile username={profile.username} />;

  return (
    <Template.ScreenTemplate>
      {error ? (
        <View style={{ width: '100%', gap: 16 }}>
          <Atom.ErrorMessage>{error}</Atom.ErrorMessage>
          <Atom.Button
            label="Try again"
            variant="secondary"
            onPress={() => {
              setError(null);
              fetchProfile().catch((cause: unknown) => {
                setError(cause instanceof Error ? cause.message : 'Could not load your profile.');
              });
            }}
          />
          <Atom.Button
            label="Account settings"
            variant="secondary"
            onPress={() => router.push('/settings' as Href)}
          />
          <Atom.Button
            label="Log out"
            variant="secondary"
            onPress={() => {
              logout();
              router.replace('/');
            }}
          />
        </View>
      ) : <ActivityIndicator />}
    </Template.ScreenTemplate>
  );
}
