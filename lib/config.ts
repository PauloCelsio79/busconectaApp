import { Platform } from 'react-native';

/** Host por defeito: emulador Android usa 10.0.2.2; iOS/simulador usa localhost. */
function defaultApiBase(): string {
  const host =
    Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';
  return `${host}/api/v1`;
}

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? defaultApiBase();
