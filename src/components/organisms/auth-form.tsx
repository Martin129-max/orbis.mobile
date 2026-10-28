import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Atom from '@atom';
import * as Molecule from '@molecule';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/stores/auth-store';

type Mode = 'login' | 'signup';

const content = {
  login: {
    title: 'Welcome home.',
    submit: 'Log in',
    switchText: 'New to Orbis?',
    switchLabel: 'Create an account',
    switchHref: '/register',
    description: 'Pick up where you left off. Your communities are waiting.',
  },
  signup: {
    title: 'Find your people.',
    submit: 'Create account',
    switchText: 'Already have an account?',
    switchLabel: 'Log in',
    switchHref: '/login',
    description: 'Make a little space for your interests, and find others who share them.',
  },
} as const;

export function AuthForm({ mode }: { mode: Mode }) {
  const theme = useTheme();
  const login = useAuthStore((state) => state.login);
  const signup = useAuthStore((state) => state.signup);
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const { title, submit, switchText, switchLabel, switchHref, description } = content[mode];
  const ready = mode === 'login'
    ? identifier.trim().length > 0 && password.length > 0
    : email.trim().length > 0 && username.trim().length > 0 && password.length > 0;

  async function handleSubmit() {
    setError(null);
    if (!ready) {
      setError(mode === 'login'
        ? 'Enter your email or username and password.'
        : 'Complete all fields to create your account.');
      return;
    }
    setPending(true);

    try {
      if (mode === 'login') {
        await login({ identifier: identifier.trim(), password });
      } else {
        await signup({ email: email.trim(), username: username.trim(), password });
      }
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setPending(false);
    }
  }

  return (
    <View style={styles.form}>
      {mode === 'login' && (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/')}
          style={({ pressed }) => [styles.backLink, pressed && styles.pressed]}>
          <Atom.ThemedText type="smallBold" style={{ color: theme.accent }}>
            ‹  Back to Orbis
          </Atom.ThemedText>
        </Pressable>
      )}
      <View style={styles.brand}>
        <Atom.ThemedText type="smallBold" style={[styles.wordmark, { color: theme.accent }]}>
          ORBIS
        </Atom.ThemedText>
        <Atom.ThemedText type="small" themeColor="textSecondary">
          A home for your fandoms
        </Atom.ThemedText>
      </View>
      <View
        style={[
          styles.card,
          { backgroundColor: theme.surface, borderColor: theme.divider },
        ]}>
        <View style={styles.intro}>
          <Atom.ThemedText type="subtitle" style={styles.title}>
            {title}
          </Atom.ThemedText>
          <Atom.ThemedText type="small" themeColor="textSecondary">
            {description}
          </Atom.ThemedText>
        </View>
        {mode === 'login' ? (
          <View style={styles.fields}>
            <Molecule.FormField
              label="Email or username"
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="Your email or username"
              autoCapitalize="none"
              autoComplete="username"
              autoCorrect={false}
              returnKeyType="next"
            />
            <View style={styles.passwordField}>
              <View style={styles.passwordLabel}>
                <Atom.ThemedText type="smallBold">Password</Atom.ThemedText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  onPress={() => setShowPassword((visible) => !visible)}
                  hitSlop={8}>
                  <Atom.ThemedText type="smallBold" style={{ color: theme.accent }}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Atom.ThemedText>
                </Pressable>
              </View>
              <Atom.Input
                accessibilityLabel="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                placeholder="Your password"
                style={{ backgroundColor: theme.background, borderColor: theme.divider }}
              />
            </View>
          </View>
        ) : (
          <View style={styles.fields}>
            <Molecule.FormField
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
            />
            <Molecule.FormField
              label="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoComplete="username-new"
              autoCorrect={false}
            />
            <Molecule.FormField
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              onSubmitEditing={handleSubmit}
            />
          </View>
        )}
        {error && <Atom.ErrorMessage>{error}</Atom.ErrorMessage>}
        <Atom.Button
          label={submit}
          loading={pending}
          disabled={!ready || pending}
          onPress={handleSubmit}
        />
        <View style={[styles.divider, { backgroundColor: theme.divider }]} />
        <Atom.ThemedText type="small" themeColor="textSecondary">
          {switchText}{' '}
          <Link href={switchHref} replace>
            <Atom.ThemedText type="smallBold" style={{ color: theme.accent }}>
              {switchLabel}
            </Atom.ThemedText>
          </Link>
        </Atom.ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    width: '100%',
    gap: Spacing.four,
  },
  backLink: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.one,
  },
  pressed: {
    opacity: 0.7,
  },
  brand: {
    gap: Spacing.one,
    paddingHorizontal: Spacing.one,
  },
  wordmark: {
    fontSize: 24,
    letterSpacing: 2,
    lineHeight: 28,
  },
  card: {
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: 20,
    padding: Spacing.three,
  },
  intro: {
    gap: Spacing.two,
  },
  title: {
    fontSize: 36,
    lineHeight: 40,
  },
  fields: {
    gap: Spacing.three,
  },
  passwordField: {
    gap: Spacing.one,
  },
  passwordLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
});
