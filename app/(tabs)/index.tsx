import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface StoredUser {
  name: string;
  email: string;
  password: string;
}

async function loadUsers(): Promise<StoredUser[]> {
  const json = await AsyncStorage.getItem('users');
  if (!json) return [];
  try {
    return JSON.parse(json) as StoredUser[];
  } catch {
    return [];
  }
}

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      alert('Informe e-mail e senha.');
      return;
    }

    setLoading(true);
    try {
      const users = await loadUsers();
      const user = users.find(
        (u) =>
          u.email.trim().toLowerCase() === email.trim().toLowerCase() &&
          u.password === password
      );

      if (!user) {
        alert('E-mail ou senha incorretos.');
        return;
      }

      await AsyncStorage.setItem('currentUserEmail', user.email);
      router.replace('/dashboard');
    } catch {
      alert('Não foi possível efetuar o login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BusConecta</Text>
      <Text style={styles.subtitle}>Acesso ao sistema</Text>

      <TextInput
        style={styles.input}
        placeholder="E-mail"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Senha"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'A entrar...' : 'Entrar'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => router.push('/register')}
        disabled={loading}
      >
        <Text style={styles.linkText}>Criar nova conta</Text>
      </TouchableOpacity>

      <TouchableOpacity disabled>
        <Text style={styles.forgotPassword}>Esqueci a senha (em breve)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#1e90ff',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 12,
  },
  linkText: {
    textAlign: 'center',
    color: '#1e90ff',
  },
  forgotPassword: {
    textAlign: 'center',
    marginTop: 8,
    color: '#1e90ff',
  },
});
