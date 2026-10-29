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
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : 'Could not load your profile.');
      });
  }, [fetchProfile]);

  function handleLogout() {
    logout();
    router.replace('/');
  }

  return (
    <Template.ScreenTemplate>
      {profile ? (
        <Organism.ProfileCard
          profile={profile}
          onLogout={handleLogout}
          onSettings={() => router.push('/settings' as Href)}
        />
      ) : error ? (
        <View style={{ width: '100%', gap: 16 }}>
          <Atom.ErrorMessage>{error}</Atom.ErrorMessage>
          <Atom.Button
            label="Try again"
            variant="secondary"
            onPress={() => {
              setError(null);
              fetchProfile().catch((reason: unknown) => {
                setError(reason instanceof Error ? reason.message : 'Could not load your profile.');
              });
            }}
          />
        </View>
      ) : (
        <ActivityIndicator />
      )}
    </Template.ScreenTemplate>
  );
}
