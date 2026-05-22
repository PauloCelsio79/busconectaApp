import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/empty-state';
import { FocusedStatusBar } from '@/components/ui/focused-status-bar';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Brand, Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';

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

function param(value?: string | string[]) {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

const STATUS_LABEL: Record<ReservaStatus, string> = {
  ativa: 'Ativa',
  cancelada: 'Cancelada',
  remarcada: 'Remarcada',
};

export default function MinhasViagensScreen() {
  const [reservas, setReservas] = useState<ReservaSalva[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [novaData, setNovaData] = useState('');
  const [novaHora, setNovaHora] = useState('');

  const carregarReservas = useCallback(async () => {
    setLoading(true);
    try {
      const currentUserEmail = await AsyncStorage.getItem('currentUserEmail');
      const json = await AsyncStorage.getItem('reservas');
      const todas: ReservaSalva[] = json ? JSON.parse(json) : [];

      setReservas(
        todas.filter((r) => r.userEmail && r.userEmail === currentUserEmail)
      );
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar as suas reservas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
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
        r.id === id ? { ...r, status } : r
      );
      await AsyncStorage.setItem('reservas', JSON.stringify(atualizadas));
      await carregarReservas();
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar a reserva.');
    }
  }

  async function remarcarReserva(id: string, data: string, hora: string) {
    if (!data.trim() || !hora.trim()) {
      Alert.alert('Campos em falta', 'Indique nova data e nova hora.');
      return;
    }

    try {
      const json = await AsyncStorage.getItem('reservas');
      const todas: ReservaSalva[] = json ? JSON.parse(json) : [];
      const atualizadas = todas.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'remarcada' as const,
              viagem: { ...r.viagem, data, hora },
            }
          : r
      );

      await AsyncStorage.setItem('reservas', JSON.stringify(atualizadas));
      setEditingId(null);
      setNovaData('');
      setNovaHora('');
      await carregarReservas();
    } catch {
      Alert.alert('Erro', 'Não foi possível remarcar a reserva.');
    }
  }

  function handleCancelar(id: string) {
    Alert.alert(
      'Cancelar viagem',
      'Tem a certeza que deseja cancelar esta reserva?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, cancelar',
          style: 'destructive',
          onPress: () => void atualizarStatus(id, 'cancelada'),
        },
      ]
    );
  }

  function handleRemarcar(id: string) {
    const reserva = reservas.find((r) => r.id === id);
    setEditingId(id);
    setNovaData(param(reserva?.viagem.data));
    setNovaHora(param(reserva?.viagem.hora));
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FocusedStatusBar iconStyle="dark" backgroundColor={Palette.surface} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void carregarReservas();
            }}
            tintColor={Brand.primary}
          />
        }
      >
        <Text style={styles.title}>Minhas viagens</Text>
        <Text style={styles.subtitle}>
          Consulte, remarque ou cancele as suas reservas.
        </Text>

        {loading && !refreshing ? (
          <Text style={styles.info}>A carregar reservas...</Text>
        ) : null}

        {!loading && reservas.length === 0 ? (
          <EmptyState
            icon="🧳"
            title="Sem viagens ainda"
            message="Pesquise uma rota e efetue a sua primeira reserva para vê-la aqui."
            actionLabel="Pesquisar viagens"
            onAction={() => router.push('/dashboard')}
          />
        ) : null}

        {reservas.map((reserva) => (
          <View key={reserva.id} style={styles.card}>
            <View style={styles.row}>
              <View style={styles.cardMain}>
                <Text style={styles.agencia}>{param(reserva.viagem.agencia)}</Text>
                <Text style={styles.route}>
                  {param(reserva.viagem.origem)} → {param(reserva.viagem.destino)}
                </Text>
                <Text style={styles.detail}>
                  {param(reserva.viagem.data)
                    ? `${param(reserva.viagem.data)} • `
                    : ''}
                  {param(reserva.viagem.hora)} • {param(reserva.viagem.duracao)}
                </Text>
                <Text style={styles.detail}>
                  Embarque: {param(reserva.viagem.embarque)}
                </Text>
              </View>
              <View style={styles.right}>
                <Text style={styles.price}>{param(reserva.viagem.preco)} Kz</Text>
                <View
                  style={[
                    styles.statusBadge,
                    reserva.status === 'ativa' && styles.statusAtiva,
                    reserva.status === 'cancelada' && styles.statusCancelada,
                    reserva.status === 'remarcada' && styles.statusRemarcada,
                  ]}
                >
                  <Text style={styles.statusText}>
                    {STATUS_LABEL[reserva.status]}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.meta}>
              Assentos: {reserva.assentos.join(', ')}
            </Text>
            <Text style={styles.meta}>
              Passageiros:{' '}
              {reserva.passageiros.map((p) => p.nome).filter(Boolean).join(', ') ||
                '—'}
            </Text>

            {editingId === reserva.id ? (
              <View style={styles.editContainer}>
                <Text style={styles.editTitle}>Remarcar viagem</Text>
                <TextInput
                  style={styles.editInput}
                  placeholder="Nova data (DD/MM)"
                  placeholderTextColor={Palette.textMuted}
                  value={novaData}
                  onChangeText={setNovaData}
                />
                <TextInput
                  style={styles.editInput}
                  placeholder="Nova hora (HH:MM)"
                  placeholderTextColor={Palette.textMuted}
                  value={novaHora}
                  onChangeText={setNovaHora}
                />
                <View style={styles.editActions}>
                  <PrimaryButton
                    title="Cancelar"
                    variant="outline"
                    onPress={() => {
                      setEditingId(null);
                      setNovaData('');
                      setNovaHora('');
                    }}
                    style={styles.editBtn}
                  />
                  <PrimaryButton
                    title="Guardar"
                    onPress={() =>
                      void remarcarReserva(reserva.id, novaData, novaHora)
                    }
                    style={styles.editBtn}
                  />
                </View>
              </View>
            ) : null}

            {reserva.status !== 'cancelada' ? (
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionCancel]}
                  onPress={() => handleCancelar(reserva.id)}
                >
                  <Text style={styles.actionBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionReschedule]}
                  onPress={() => handleRemarcar(reserva.id)}
                >
                  <Text style={styles.actionBtnText}>Remarcar</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  container: {
    flex: 1,
  },
  scroll: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  title: {
    ...Typography.title,
    fontSize: 22,
    color: Palette.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    color: Palette.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  info: {
    color: Palette.textMuted,
    marginBottom: Spacing.lg,
  },
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadow.card,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardMain: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  agencia: {
    fontSize: 17,
    fontWeight: '800',
    color: Brand.primaryDark,
  },
  route: {
    marginTop: Spacing.xs,
    fontWeight: '600',
    color: Palette.text,
  },
  detail: {
    marginTop: 2,
    fontSize: 12,
    color: Palette.textSecondary,
  },
  right: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: Brand.primary,
  },
  statusBadge: {
    marginTop: Spacing.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  statusAtiva: {
    backgroundColor: Brand.accentLight,
  },
  statusCancelada: {
    backgroundColor: Brand.primaryLight,
  },
  statusRemarcada: {
    backgroundColor: '#FFF3E0',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.text,
  },
  meta: {
    marginTop: Spacing.sm,
    fontSize: 12,
    color: Palette.textSecondary,
  },
  editContainer: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  editTitle: {
    fontWeight: '700',
    marginBottom: Spacing.md,
    color: Palette.text,
  },
  editInput: {
    height: 48,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Palette.surfaceMuted,
    color: Palette.text,
  },
  editActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  editBtn: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  actionBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  actionCancel: {
    backgroundColor: Palette.textSecondary,
  },
  actionReschedule: {
    backgroundColor: Brand.primary,
  },
  actionBtnText: {
    color: Brand.white,
    fontWeight: '700',
    fontSize: 13,
  },
});
