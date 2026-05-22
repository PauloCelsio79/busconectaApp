import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useCallback } from 'react';
import { Platform } from 'react-native';

import { Palette } from '@/constants/theme';

/**
 * Ícones da status bar do sistema.
 * - dark: ícones escuros — usar em fundos claros (maioria dos ecrãs).
 * - light: ícones claros — usar em fundos escuros (login, dashboard).
 */
export type StatusBarIconStyle = 'light' | 'dark';

type FocusedStatusBarProps = {
  iconStyle?: StatusBarIconStyle;
  /** Cor por trás da status bar (Android edge-to-edge). */
  backgroundColor?: string;
};

export function FocusedStatusBar({
  iconStyle = 'dark',
  backgroundColor = Palette.surface,
}: FocusedStatusBarProps) {
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        void SystemUI.setBackgroundColorAsync(backgroundColor);
      }
    }, [backgroundColor])
  );

  return <StatusBar style={iconStyle === 'light' ? 'light' : 'dark'} />;
}
