/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#242320',
    background: '#f5f2eb',
    surface: '#fffefa',
    rail: '#eae5dc',
    divider: '#d6d0c5',
    accent: '#b23b26',
    accentForeground: '#ffffff',
    accentSoft: '#f7e6df',
    backgroundElement: '#eae5dc',
    backgroundSelected: '#ddd7cb',
    textSecondary: '#625d55',
  },
  dark: {
    text: '#f1ede3',
    background: '#1c1d1b',
    surface: '#252623',
    rail: '#151613',
    divider: '#42433c',
    accent: '#f07357',
    accentForeground: '#211c18',
    accentSoft: '#352620',
    backgroundElement: '#353630',
    backgroundSelected: '#42433c',
    textSecondary: '#aca99e',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
