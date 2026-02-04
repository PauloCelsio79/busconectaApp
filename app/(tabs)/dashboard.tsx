import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface StoredUser {
  name: string;
  email: string;
  password: string;
}

export default function Dashboard() {
  const [origem, setOrigem] = useState('');
  const [destino, setDestino] = useState('');
  const [dataIda, setDataIda] = useState('');
  const [dataRegresso, setDataRegresso] = useState('');
  const [idaVolta, setIdaVolta] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    async function loadUserName() {
      try {
        const currentUserEmail = await AsyncStorage.getItem('currentUserEmail');
        if (!currentUserEmail) return;

        const json = await AsyncStorage.getItem('users');
        if (!json) return;

        const users: StoredUser[] = JSON.parse(json);
        const user = users.find((u) => u.email === currentUserEmail);
        if (user) {
          setUserName(user.name);
        }
      } catch {
        // ignora erro silenciosamente
      }
    }

    void loadUserName();
  }, []);

  return (
    <View style={styles.container}>
      {/* Fundo azul */}
      <View style={styles.blueBackground} />

      {/* Botão de menu no topo, sobre o fundo azul */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setMenuOpen((prev) => !prev)}
        >
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
        </TouchableOpacity>
      </View>

      {menuOpen && (
        <View style={styles.menu}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuOpen(false);
              router.push('/minhas-viagens');
            }}
          >
            <Text style={styles.menuItemText}>Minhas viagens</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuOpen(false);
              router.push('/meus-tickets');
            }}
          >
            <Text style={styles.menuItemText}>Meus tickets</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={async () => {
              setMenuOpen(false);
              await AsyncStorage.removeItem('currentUserEmail');
              router.replace('/');
            }}
          >
            <Text style={styles.menuItemText}>Terminar sessão</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Cartão branco */}
      <View style={styles.card}>
        {/* Topo com saudação */}
        <View style={styles.headerRow}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingLabel}>Para bazamos hoje</Text>
            <Text style={styles.greetingName}>
              {userName ? userName : 'viajante'}?
            </Text>
          </View>
        </View>

        <Text style={styles.title}>Pesquisar Viagem</Text>

        <TextInput
          style={styles.input}
          placeholder="Origem"
          value={origem}
          onChangeText={setOrigem}
        />
  
        <TextInput
          style={styles.input}
          placeholder="Destino"
          value={destino}
          onChangeText={setDestino}
        />

        <TextInput
          style={styles.input}
          placeholder="Data de ida"
          value={dataIda}
          onChangeText={setDataIda}
        />
    
        {idaVolta && (
          <TextInput
            style={styles.input}
            placeholder="Data de regresso"
            value={dataRegresso}
            onChangeText={setDataRegresso}
          />
        )}

        {/* Checkbox */}
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setIdaVolta(!idaVolta)}
        >
          <View style={[styles.checkbox, idaVolta && styles.checkboxChecked]} />
          <Text style={styles.checkboxLabel}>Viagem de ida e volta</Text>
        </TouchableOpacity>

        {/* Botão Pesquisar */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            if (!origem || !destino || !dataIda) {
              alert('Preencha origem, destino e data de ida');
              return;
            }

            router.push({
              pathname: '/resultados',
              params: {
                origem,
                destino,
                dataIda,
              },
            });
          }}
        >
          <Text style={styles.buttonText}>Pesquisar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e90ff' },
  blueBackground: { height: '35%' },
  card: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '75%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
  },
  topBar: {
    position: 'absolute',
    top: 40,
    left: 24,
    zIndex: 20,
  },
  headerRow: {
    marginBottom: 16,
  },
  menuButton: {
    padding: 4,
  },
  menuLine: {
    width: 22,
    height: 2,
    backgroundColor: '#333',
    marginVertical: 2,
    borderRadius: 2,
  },
  greetingContainer: {
    flex: 1,
    marginLeft: 12,
  },
  greetingLabel: {
    fontSize: 12,
    color: '#888',
  },
  greetingName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e90ff',
  },
  menu: {
    position: 'absolute',
    top: 56,
    left: 24,
    right: 24,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10,
  },
  menuItem: {
    paddingVertical: 10,
  },
  menuItemText: {
    fontSize: 14,
    color: '#333',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#1e90ff',
    borderRadius: 4,
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#1e90ff',
  },
  checkboxLabel: {
    fontSize: 14,
  },
  button: {
    backgroundColor: '#1e90ff',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
