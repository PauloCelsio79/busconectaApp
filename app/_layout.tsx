import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as SystemUI from 'expo-system-ui';
import 'react-native-reanimated';

import { AuthProvider } from '@/contexts/AuthContext';
import { Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (Platform.OS === 'android') {
      void SystemUI.setBackgroundColorAsync(Palette.surface);
    }
  }, []);

  return (
    <AuthProvider>
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="register" />
        <Stack.Screen name="resultados" />
        <Stack.Screen name="reserva" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="minhas-viagens" />
        <Stack.Screen name="meus-tickets" />
      </Stack>
    </ThemeProvider>
    </AuthProvider>
  );
}
