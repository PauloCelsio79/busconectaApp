import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/empty-state';
import { FocusedStatusBar } from '@/components/ui/focused-status-bar';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api/client';
import { cancelarReserva, listarReservas } from '@/lib/api/reservas';
import {
  mapApiReservasToApp,
  type ReservaApp,
  type ReservaStatusApp,
} from '@/lib/mappers/reserva';
import { Brand, Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';

const STATUS_LABEL: Record<ReservaStatusApp, string> = {
  ativa: 'Ativa',
  cancelada: 'Cancelada',
  remarcada: 'Remarcada',
};

export default function MinhasViagensScreen() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [reservas, setReservas] = useState<ReservaApp[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');

  const carregarReservas = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setLoadError('');
    try {
      const raw = await listarReservas();
      setReservas(mapApiReservasToApp(raw));
    } catch (err) {
      setLoadError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível carregar as suas reservas.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      if (!authLoading && isAuthenticated) {
        void carregarReservas();
      }
    }, [carregarReservas, authLoading, isAuthenticated])
  );

  if (!authLoading && !isAuthenticated) {
    return <Redirect href="/" />;
  }

  async function handleCancelar(id: string) {
    Alert.alert(
      'Cancelar viagem',
      'Tem a certeza que deseja cancelar esta reserva?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelarReserva(Number(id));
              await carregarReservas();
            } catch (err) {
              Alert.alert(
                'Erro',
                err instanceof ApiError
                  ? err.message
                  : 'Não foi possível cancelar a reserva.'
              );
            }
          },
        },
      ]
    );
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
          Consulte ou cancele as suas reservas.
        </Text>

        {loading && !refreshing ? (
          <Text style={styles.info}>A carregar reservas...</Text>
        ) : null}

        {loadError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{loadError}</Text>
            <PrimaryButton
              title="Tentar novamente"
              onPress={() => void carregarReservas()}
              variant="outline"
            />
          </View>
        ) : null}

        {!loading && !loadError && reservas.length === 0 ? (
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
                <Text style={styles.agencia}>{reserva.agencia}</Text>
                {reserva.codigo ? (
                  <Text style={styles.codigo}>Ref. {reserva.codigo}</Text>
                ) : null}
                <Text style={styles.route}>
                  {reserva.origem} → {reserva.destino}
                </Text>
                <Text style={styles.detail}>
                  {reserva.data ? `${reserva.data} • ` : ''}
                  {reserva.hora} • {reserva.duracao}
                </Text>
                <Text style={styles.detail}>Embarque: {reserva.embarque}</Text>
              </View>
              <View style={styles.right}>
                <Text style={styles.price}>{reserva.preco}</Text>
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
              Assentos:{' '}
              {reserva.assentos.length > 0
                ? reserva.assentos.join(', ')
                : '—'}
            </Text>

            {reserva.status !== 'cancelada' ? (
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => handleCancelar(reserva.id)}
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
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
    fontSize: 24,
    color: Palette.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    color: Palette.textSecondary,
    marginBottom: Spacing.xl,
  },
  info: {
    color: Palette.textMuted,
    marginBottom: Spacing.lg,
  },
  errorBox: {
    backgroundColor: Brand.primaryLight,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  errorText: {
    color: Brand.primary,
    fontWeight: '600',
  },
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
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
    fontSize: 16,
    fontWeight: '800',
    color: Palette.text,
    marginBottom: 2,
  },
  codigo: {
    fontSize: 11,
    color: Brand.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  route: {
    fontSize: 15,
    fontWeight: '700',
    color: Brand.primary,
    marginBottom: Spacing.xs,
  },
  detail: {
    fontSize: 13,
    color: Palette.textSecondary,
    marginBottom: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
    color: Brand.primary,
    marginBottom: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: Palette.surfaceMuted,
  },
  statusAtiva: {
    backgroundColor: Brand.accentLight,
  },
  statusCancelada: {
    backgroundColor: Palette.surfaceMuted,
  },
  statusRemarcada: {
    backgroundColor: Brand.primaryLight,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.text,
  },
  meta: {
    marginTop: Spacing.md,
    fontSize: 12,
    color: Palette.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  cancelBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.primary,
  },
  cancelBtnText: {
    color: Brand.primary,
    fontWeight: '700',
    fontSize: 13,
  },
});
