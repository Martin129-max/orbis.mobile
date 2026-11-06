import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Atom from '@atom';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { UserStatus } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

const choices: { value: UserStatus; label: string; color: string }[] = [
  { value: 'online', label: 'Online', color: '#30a46c' },
  { value: 'idle', label: 'Idle', color: '#e5a000' },
  { value: 'busy', label: 'Busy', color: '#e5484d' },
];

export function PresenceStatusPicker() {
  const theme = useTheme();
  const token = useAuthStore((state) => state.token);
  const profile = useAuthStore((state) => state.profile);
  const preferencesPending = useAuthStore((state) => state.preferencesPending);
  const updatePreferences = useAuthStore((state) => state.updatePreferences);
  const [error, setError] = useState<{ token: string; message: string } | null>(null);

  async function choose(status: UserStatus) {
    if (!profile || preferencesPending) return;
    setError(null);
    try {
      await updatePreferences({ status, appearOffline: false });
    } catch (cause) {
      if (useAuthStore.getState().token === token && token) {
        setError({
          token,
          message: cause instanceof Error ? cause.message : 'Could not update your status.',
        });
      }
    }
  }

  return (
    <View style={styles.section}>
      <Atom.ThemedText type="smallBold">Status</Atom.ThemedText>
      <Atom.ThemedText type="small" themeColor="textSecondary">
        Choose your status while you’re online. Use Appear offline below to hide it from friends.
      </Atom.ThemedText>
      <View accessibilityRole="radiogroup" accessibilityLabel="Status" style={styles.choices}>
        {choices.map((choice) => (
          <Pressable
            key={choice.value}
            accessibilityRole="radio"
            accessibilityState={{
              checked: profile?.status === choice.value && !profile.appearOffline,
              disabled: !profile || preferencesPending,
            }}
            disabled={!profile || preferencesPending}
            onPress={() => void choose(choice.value)}
            style={({ pressed }) => [
              styles.choice,
              {
                backgroundColor:
                  profile?.status === choice.value && !profile.appearOffline
                    ? theme.accentSoft
                    : theme.surface,
                borderColor:
                  profile?.status === choice.value && !profile.appearOffline
                    ? theme.accent
                    : theme.divider,
                opacity: !profile || preferencesPending ? 0.5 : pressed ? 0.75 : 1,
              },
            ]}>
            <View style={[styles.dot, { backgroundColor: choice.color }]} />
            <Atom.ThemedText type="smallBold">{choice.label}</Atom.ThemedText>
          </Pressable>
        ))}
      </View>
      {error?.token === token ? <Atom.ErrorMessage>{error.message}</Atom.ErrorMessage> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  choices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  choice: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
