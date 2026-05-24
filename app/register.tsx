import { useRouter } from 'expo-router';
import { useState } from 'react';
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
import { ScreenHeader } from '@/components/ui/screen-header';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api/client';
import { Brand, Palette, Radius, Spacing } from '@/constants/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [bi, setBi] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  async function handleRegister() {
    setFormError('');

    if (!name.trim() || !email.trim() || !telefone.trim() || !bi.trim() || !password || !confirmPassword) {
      setFormError('Preencha todos os campos obrigatórios.');
      return;
    }

    if (password.length < 6) {
      setFormError('A palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('As palavras-passe não coincidem.');
      return;
    }

    setLoading(true);
    try {
      await register({
        nome: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        password_confirmation: confirmPassword,
        telefone: telefone.trim(),
        bi: bi.trim(),
      });
      router.replace('/dashboard');
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível criar a conta. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <FocusedStatusBar iconStyle="dark" backgroundColor={Palette.surface} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader
            title="Criar conta"
            subtitle="Registe-se para reservar e gerir viagens"
            onBack={() => router.back()}
          />

          {formError ? (
            <View style={styles.errorBanner} accessibilityRole="alert">
              <Text style={styles.errorBannerText}>{formError}</Text>
            </View>
          ) : null}

          <AppTextInput
            label="Nome completo"
            placeholder="O seu nome"
            autoCapitalize="words"
            value={name}
            onChangeText={setName}
          />

          <AppTextInput
            label="E-mail"
            placeholder="exemplo@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <AppTextInput
            label="Telefone"
            placeholder="+244900000099"
            keyboardType="phone-pad"
            value={telefone}
            onChangeText={setTelefone}
          />

          <AppTextInput
            label="Bilhete de identidade (BI)"
            placeholder="000111222LA033"
            autoCapitalize="characters"
            value={bi}
            onChangeText={setBi}
          />

          <AppTextInput
            label="Palavra-passe"
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            hint="Use letras e números para maior segurança"
          />

          <AppTextInput
            label="Confirmar palavra-passe"
            placeholder="Repita a palavra-passe"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <PrimaryButton
            title={loading ? 'A criar conta...' : 'Criar conta'}
            onPress={handleRegister}
            loading={loading}
          />

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={styles.linkText}>Já tenho conta — entrar</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
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
  linkRow: {
    marginTop: Spacing.xl,
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  linkText: {
    color: Brand.primary,
    fontWeight: '700',
    fontSize: 15,
  },
});
