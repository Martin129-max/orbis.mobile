import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import * as Organism from '@organism';
import * as Template from '@template';

import { useAuthStore } from '@/stores/auth-store';

export default function ProfileScreen() {
  const profile = useAuthStore((state) => state.profile);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    fetchProfile().catch(() => null);
  }, [fetchProfile]);

  function handleLogout() {
    logout();
    router.replace('/');
  }

  return (
    <Template.ScreenTemplate>
      {profile ? (
        <Organism.ProfileCard profile={profile} onLogout={handleLogout} />
      ) : (
        <ActivityIndicator />
      )}
    </Template.ScreenTemplate>
  );
}
