import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppTextInput } from '@/components/ui/app-text-input';
import { FocusedStatusBar } from '@/components/ui/focused-status-bar';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api/client';
import { Brand, Palette, Radius, Spacing, Typography } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [authLoading, isAuthenticated, router]);

  async function handleLogin() {
    setFormError('');

    if (!email.trim() || !password) {
      setFormError('Informe o e-mail e a palavra-passe.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      router.replace('/dashboard');
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível iniciar sessão. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <FocusedStatusBar iconStyle="light" backgroundColor={Brand.primaryDark} />
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>A carregar...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <FocusedStatusBar iconStyle="light" backgroundColor={Brand.primaryDark} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandBlock}>
            <View style={styles.brandRow}>
              <Text style={styles.brandBus}>Bus</Text>
              <Text style={styles.brandConecta}>Conecta</Text>
            </View>
            <Text style={styles.tagline}>Reserve autocarros em Angola com simplicidade</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Entrar na conta</Text>
            <Text style={styles.cardSubtitle}>Aceda às suas viagens e reservas</Text>

            {formError ? (
              <View style={styles.errorBanner} accessibilityRole="alert">
                <Text style={styles.errorBannerText}>{formError}</Text>
              </View>
            ) : null}

            <AppTextInput
              label="E-mail"
              placeholder="passageiro@busconecta.ao"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
            />

            <AppTextInput
              label="Palavra-passe"
              placeholder="••••••••"
              secureTextEntry
              autoComplete="password"
              value={password}
              onChangeText={setPassword}
            />

            <PrimaryButton
              title={loading ? 'A entrar...' : 'Entrar'}
              onPress={handleLogin}
              loading={loading}
              style={styles.submit}
            />

            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => router.push('/register')}
              disabled={loading}
              accessibilityRole="button"
            >
              <Text style={styles.linkText}>Criar nova conta</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerNote}>
            Conta demo: passageiro@busconecta.ao / password
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Brand.primaryDark,
  },
  flex: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Brand.white,
    fontSize: 15,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  brandBlock: {
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  brandBus: {
    ...Typography.hero,
    color: Brand.white,
    marginRight: Spacing.sm,
  },
  brandConecta: {
    ...Typography.hero,
    color: Brand.accent,
  },
  tagline: {
    marginTop: Spacing.md,
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 22,
  },
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  cardTitle: {
    ...Typography.title,
    fontSize: 22,
    color: Palette.text,
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    color: Palette.textSecondary,
    marginBottom: Spacing.xl,
  },
  errorBanner: {
    backgroundColor: Brand.primaryLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: Brand.primary,
  },
  errorBannerText: {
    color: Brand.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  submit: {
    marginTop: Spacing.sm,
  },
  linkRow: {
    marginTop: Spacing.lg,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  linkText: {
    color: Brand.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  footerNote: {
    textAlign: 'center',
    marginTop: Spacing.xl,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
});
