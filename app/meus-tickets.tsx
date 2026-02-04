import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Passageiro {
  nome: string;
  bilhete: string;
}

interface ReservaSalva {
  id: string;
  userEmail: string | null;
  viagem: {
    agencia?: string | string[];
    origem?: string | string[];
    destino?: string | string[];
    data?: string | string[];
    hora?: string | string[];
    preco?: string | string[];
    duracao?: string | string[];
    embarque?: string | string[];
  };
  assentos: number[];
  passageiros: Passageiro[];
  status: 'ativa' | 'cancelada' | 'remarcada';
  criadaEm: string;
}

export default function MeusTicketsScreen() {
  const [reservas, setReservas] = useState<ReservaSalva[]>([]);
  const [loading, setLoading] = useState(false);
  const [ticketAberto, setTicketAberto] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const currentUserEmail = await AsyncStorage.getItem('currentUserEmail');
      const json = await AsyncStorage.getItem('reservas');
      const todas: ReservaSalva[] = json ? JSON.parse(json) : [];

      const minhas = todas.filter(
        (r) => r.userEmail && r.userEmail === currentUserEmail
      );

      setReservas(minhas);
    } catch {
      alert('Não foi possível carregar os seus tickets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Meus tickets</Text>
      <Text style={styles.subtitle}>
        Veja os bilhetes das suas reservas. Mostre o QR no momento do embarque.
      </Text>

      {loading && <Text style={styles.info}>A carregar tickets...</Text>}

      {!loading && reservas.length === 0 && (
        <Text style={styles.info}>
          Ainda não tem nenhum ticket disponível.
        </Text>
      )}

      {reservas.map((r) => {
        const isOpen = ticketAberto === r.id;
        const qrCode = `TICKET-${r.id}`;

        return (
          <TouchableOpacity
            key={r.id}
            activeOpacity={0.9}
            style={styles.card}
            onPress={() =>
              setTicketAberto((prev) => (prev === r.id ? null : r.id))
            }
          >
            <View style={styles.row}>
              <View>
                <Text style={styles.agencia}>{r.viagem.agencia}</Text>
                <Text style={styles.route}>
                  {r.viagem.origem} → {r.viagem.destino}
                </Text>
                <Text style={styles.detail}>
                  {r.viagem.data ? `Data: ${r.viagem.data} • ` : ''}
                  Hora: {r.viagem.hora}
                </Text>
              </View>
              <View style={styles.right}>
                <Text style={styles.price}>{r.viagem.preco}</Text>
                <Text style={styles.status}>{r.status.toUpperCase()}</Text>
              </View>
            </View>

            {isOpen && (
              <View style={styles.qrContainer}>
                <View style={styles.qrBox}>
                  <Text style={styles.qrLabel}>QR DO BILHETE</Text>
                  <Image
                    source={require('../assets/images/qr-code.jpg')}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.qrCode}>{qrCode}</Text>
                </View>
                <Text style={styles.qrHint}>
                  Apresente este código/QR no momento do embarque.
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  info: {
    marginTop: 16,
    color: '#555',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  agencia: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  route: {
    marginTop: 4,
    fontWeight: '500',
  },
  detail: {
    marginTop: 2,
    fontSize: 12,
    color: '#555',
  },
  right: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e90ff',
  },
  status: {
    marginTop: 6,
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
    color: '#fff',
    backgroundColor: '#1e90ff',
  },
  qrContainer: {
    marginTop: 12,
  },
  qrBox: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f7f7f7',
  },
  qrLabel: {
    fontSize: 12,
    color: '#555',
    marginBottom: 8,
  },
  qrImage: {
    width: 140,
    height: 140,
    borderRadius: 12,
    marginBottom: 8,
  },
  qrCode: {
    fontFamily: 'monospace',
    fontSize: 13,
  },
  qrHint: {
    marginTop: 4,
    fontSize: 11,
    color: '#777',
  },
});

