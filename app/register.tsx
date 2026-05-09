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

async function saveUsers(users: StoredUser[]) {
  await AsyncStorage.setItem('users', JSON.stringify(users));
}

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!name || !email || !password || !confirmPassword) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }

    if (password.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      alert('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const users = await loadUsers();
      const alreadyExists = users.some(
        (u) => u.email.trim().toLowerCase() === email.trim().toLowerCase()
      );

      if (alreadyExists) {
        alert('Já existe um utilizador com este e-mail.');
        return;
      }

      const newUser: StoredUser = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      };

      const updated = [...users, newUser];
      await saveUsers(updated);
      await AsyncStorage.setItem('currentUserEmail', newUser.email);

      alert('Conta criada com sucesso! Faça login para continuar.');
      router.replace('/');
    } catch (error) {
      alert('Ocorreu um erro ao criar a conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Criar conta</Text>
      <Text style={styles.subtitle}>
        Registe-se para reservar e gerir as suas viagens.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Nome completo"
        value={name}
        onChangeText={setName}
      />

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

      <TextInput
        style={styles.input}
        placeholder="Confirmar senha"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'A criar conta...' : 'Criar conta'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => router.back()}
        disabled={loading}
      >
        <Text style={styles.secondaryText}>Já tenho conta</Text>
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
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
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
  secondaryButton: {
    marginTop: 16,
  },
  secondaryText: {
    textAlign: 'center',
    color: '#1e90ff',
  },
});

