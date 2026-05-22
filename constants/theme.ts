/**
 * Design system BusConecta — cores, espaçamento e tipografia.
 */

import { Platform } from 'react-native';

export const Brand = {
  primary: '#C6082A',
  primaryDark: '#9C0415',
  primaryLight: '#F7E1E5',
  accent: '#2F9D45',
  accentLight: '#E8F5EC',
  white: '#FFFFFF',
  black: '#191919',
} as const;

export const Palette = {
  text: '#2E2E2E',
  textSecondary: '#545151',
  textMuted: '#8C8C8C',
  border: '#E8E8E8',
  borderFocus: '#C6082A',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceMuted: '#FAFAFA',
  error: '#C6082A',
  success: '#2AA76C',
  warning: '#F0AD4E',
  disabled: '#C1C1C1',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const Typography = {
  hero: { fontSize: 32, fontWeight: '800' as const },
  title: { fontSize: 24, fontWeight: '700' as const },
  subtitle: { fontSize: 16, fontWeight: '400' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  label: { fontSize: 13, fontWeight: '600' as const },
  button: { fontSize: 16, fontWeight: '700' as const },
};

export const Shadow = {
  card: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    android: { elevation: 4 },
    default: {},
  }),
  button: Platform.select({
    ios: {
      shadowColor: Brand.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
    },
    android: { elevation: 6 },
    default: {},
  }),
};

const tintColorLight = Brand.primary;
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: Palette.text,
    background: Palette.background,
    tint: tintColorLight,
    icon: Palette.textMuted,
    tabIconDefault: Palette.textMuted,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
