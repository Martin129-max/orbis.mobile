import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import * as Atom from '@atom';

import { Spacing } from '@/constants/theme';

type FormFieldProps = ComponentProps<typeof Atom.Input> & { label: string };

export function FormField({ label, ...inputProps }: FormFieldProps) {
  return (
    <View style={styles.field}>
      <Atom.ThemedText type="smallBold">{label}</Atom.ThemedText>
      <Atom.Input accessibilityLabel={label} {...inputProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.one,
  },
});
