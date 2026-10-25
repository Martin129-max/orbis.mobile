import type { ReactNode } from 'react';

import { ThemedText } from './themed-text';

export function ErrorMessage({ children }: { children: ReactNode }) {
  return (
    <ThemedText type="small" accessibilityRole="alert" style={{ color: '#d14343' }}>
      {children}
    </ThemedText>
  );
}
