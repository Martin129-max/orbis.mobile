import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as Atom from '@atom';
import * as Molecule from '@molecule';

import { Spacing } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth-store';

type Mode = 'login' | 'signup';

const content = {
  login: {
    title: 'Log in',
    submit: 'Log in',
    switchText: 'No account yet?',
    switchLabel: 'Sign up',
    switchHref: '/register',
  },
  signup: {
    title: 'Sign up',
    submit: 'Create account',
    switchText: 'Already have an account?',
    switchLabel: 'Log in',
    switchHref: '/login',
  },
} as const;

export function AuthForm({ mode }: { mode: Mode }) {
  const login = useAuthStore((state) => state.login);
  const signup = useAuthStore((state) => state.signup);
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const { title, submit, switchText, switchLabel, switchHref } = content[mode];

  async function handleSubmit() {
    setError(null);
    setPending(true);

    try {
      if (mode === 'login') {
        await login({ identifier: identifier.trim(), password });
      } else {
        await signup({ email: email.trim(), username: username.trim(), password });
      }
      router.replace('/profile');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setPending(false);
    }
  }

  return (
    <View style={styles.form}>
      <Atom.ThemedText type="subtitle">{title}</Atom.ThemedText>
      {mode === 'login' ? (
        <Molecule.FormField
          label="Username or email"
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          autoComplete="username"
          autoCorrect={false}
        />
      ) : (
        <>
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
        </>
      )}
      <Molecule.FormField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        onSubmitEditing={handleSubmit}
      />
      {error && <Atom.ErrorMessage>{error}</Atom.ErrorMessage>}
      <Atom.Button label={submit} loading={pending} onPress={handleSubmit} />
      <Atom.ThemedText type="small">
        {switchText}{' '}
        <Link href={switchHref} replace>
          <Atom.ThemedText type="smallBold">{switchLabel}</Atom.ThemedText>
        </Link>
      </Atom.ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    width: '100%',
    gap: Spacing.three,
  },
});
