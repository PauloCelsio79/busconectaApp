import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Passageiro {
  nome: string;
  bilhete: string;
}

type ReservaStatus = 'ativa' | 'cancelada' | 'remarcada';

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
  status: ReservaStatus;
  criadaEm: string;
}

export default function MinhasViagensScreen() {
  const [reservas, setReservas] = useState<ReservaSalva[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [novaData, setNovaData] = useState('');
  const [novaHora, setNovaHora] = useState('');

  const carregarReservas = useCallback(async () => {
    setLoading(true);
    try {
      const currentUserEmail = await AsyncStorage.getItem('currentUserEmail');
      const json = await AsyncStorage.getItem('reservas');
      const todas: ReservaSalva[] = json ? JSON.parse(json) : [];

      const filtradas = todas.filter(
        (r) => r.userEmail && r.userEmail === currentUserEmail
      );

      setReservas(filtradas);
    } catch {
      alert('Não foi possível carregar as suas reservas neste momento.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregarReservas();
    }, [carregarReservas])
  );

  async function atualizarStatus(id: string, status: ReservaStatus) {
    try {
      const json = await AsyncStorage.getItem('reservas');
      const todas: ReservaSalva[] = json ? JSON.parse(json) : [];
      const atualizadas = todas.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
            }
          : r
      );

      await AsyncStorage.setItem('reservas', JSON.stringify(atualizadas));
      await carregarReservas();
    } catch {
      alert('Não foi possível atualizar a reserva. Tente novamente.');
    }
  }

  async function remarcarReserva(id: string, data: string, hora: string) {
    if (!data || !hora) {
      alert('Informe nova data e nova hora para remarcar.');
      return;
    }

    try {
      const json = await AsyncStorage.getItem('reservas');
      const todas: ReservaSalva[] = json ? JSON.parse(json) : [];
      const atualizadas = todas.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'remarcada',
              viagem: {
                ...r.viagem,
                data,
                hora,
              },
            }
          : r
      );

      await AsyncStorage.setItem('reservas', JSON.stringify(atualizadas));
      setEditingId(null);
      setNovaData('');
      setNovaHora('');
      await carregarReservas();
    } catch {
      alert('Não foi possível remarcar a reserva. Tente novamente.');
    }
  }

  function handleCancelar(id: string) {
    const confirmar = confirm(
      'Tem a certeza que deseja cancelar esta viagem?'
    );
    if (confirmar) {
      void atualizarStatus(id, 'cancelada');
    }
  }

  function handleRemarcar(id: string) {
    const reserva = reservas.find((r) => r.id === id);
    setEditingId(id);
    setNovaData(
      typeof reserva?.viagem.data === 'string' ? reserva.viagem.data : ''
    );
    setNovaHora(
      typeof reserva?.viagem.hora === 'string' ? reserva.viagem.hora : ''
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Minhas viagens</Text>
      <Text style={styles.subtitle}>
        Veja, cancele ou remarque as suas reservas.
      </Text>

      {loading && <Text style={styles.info}>A carregar reservas...</Text>}

      {!loading && reservas.length === 0 && (
        <Text style={styles.info}>
          Ainda não tem nenhuma viagem reservada com esta conta.
        </Text>
      )}

      {reservas.map((reserva) => (
        <View key={reserva.id} style={styles.card}>
          <View style={styles.row}>
            <View>
              <Text style={styles.agencia}>{reserva.viagem.agencia}</Text>
              <Text style={styles.route}>
                {reserva.viagem.origem} → {reserva.viagem.destino}
              </Text>
              <Text style={styles.detail}>
                {reserva.viagem.data ? `Data: ${reserva.viagem.data} • ` : ''}
                Hora: {reserva.viagem.hora} • Duração: {reserva.viagem.duracao}
              </Text>
              <Text style={styles.detail}>
                Embarque: {reserva.viagem.embarque}
              </Text>
            </View>
            <View style={styles.right}>
              <Text style={styles.price}>{reserva.viagem.preco}</Text>
              <Text style={[styles.status, styles[`status_${reserva.status}`]]}>
                {reserva.status === 'ativa'
                  ? 'Ativa'
                  : reserva.status === 'cancelada'
                  ? 'Cancelada'
                  : 'Remarcada'}
              </Text>
            </View>
          </View>

          <Text style={styles.assentos}>
            Assentos: {reserva.assentos.join(', ')}
          </Text>
          <Text style={styles.passageiros}>
            Passageiros: {reserva.passageiros.map((p) => p.nome).join(', ')}
          </Text>

          {editingId === reserva.id && (
            <View style={styles.editContainer}>
              <Text style={styles.editTitle}>Remarcar viagem</Text>
              <TextInput
                style={styles.editInput}
                placeholder="Nova data (ex: 20/02/2026)"
                value={novaData}
                onChangeText={setNovaData}
              />
              <TextInput
                style={styles.editInput}
                placeholder="Nova hora (ex: 08:30)"
                value={novaHora}
                onChangeText={setNovaHora}
              />
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setEditingId(null);
                    setNovaData('');
                    setNovaHora('');
                  }}
                >
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.rescheduleButton]}
                  onPress={() => void remarcarReserva(reserva.id, novaData, novaHora)}
                >
                  <Text style={styles.buttonText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => handleCancelar(reserva.id)}
              disabled={reserva.status === 'cancelada'}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.rescheduleButton]}
              onPress={() => handleRemarcar(reserva.id)}
            >
              <Text style={styles.buttonText}>Remarcar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
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
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
    color: '#fff',
  },
  status_ativa: {
    backgroundColor: '#1e90ff',
  },
  status_cancelada: {
    backgroundColor: '#d9534f',
  },
  status_remarcada: {
    backgroundColor: '#f0ad4e',
  },
  assentos: {
    marginTop: 10,
    fontSize: 12,
  },
  passageiros: {
    marginTop: 2,
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 10,
  } as unknown as View['props']['style'],
  button: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#d9534f',
  },
  rescheduleButton: {
    backgroundColor: '#1e90ff',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

