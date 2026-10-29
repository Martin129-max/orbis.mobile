import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as Atom from '@atom';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { resendConfirmation } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

export function EmailConfirmNotice({ email }: { email: string }) {
  const theme = useTheme();
  const token = useAuthStore((state) => state.token);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resend() {
    if (!token || sending) return;
    setSending(true);
    setError(null);
    try {
      const { confirmed } = await resendConfirmation(token);
      if (confirmed) await fetchProfile();
      else setSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Couldn’t send the email.');
    } finally {
      setSending(false);
    }
  }

  async function checkAgain() {
    if (checking) return;
    setChecking(true);
    setError(null);
    try {
      const profile = await fetchProfile();
      if (profile && !profile.emailVerifiedAt) {
        setError('Your email isn’t confirmed yet. Open the link we sent, then try again.');
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not check your account.');
    } finally {
      setChecking(false);
    }
  }

  return (
    <View style={[styles.notice, { backgroundColor: theme.surface, borderColor: theme.divider }]}>
      <Atom.ThemedText type="smallBold">Confirm your email to start posting.</Atom.ThemedText>
      <Atom.ThemedText type="small" themeColor="textSecondary">
        Until then, Orbis is read-only. Look for the link we sent to {email}.
      </Atom.ThemedText>
      <View style={styles.actions}>
        <Atom.Button
          label={sent ? 'Sent. Check your inbox.' : 'Send a new link'}
          variant="secondary"
          loading={sending}
          disabled={sent}
          onPress={resend}
        />
        <Atom.Button
          label="I’ve confirmed it"
          variant="secondary"
          loading={checking}
          onPress={checkAgain}
        />
      </View>
      {error ? <Atom.ErrorMessage>{error}</Atom.ErrorMessage> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
  },
  actions: {
    gap: Spacing.two,
  },
});
