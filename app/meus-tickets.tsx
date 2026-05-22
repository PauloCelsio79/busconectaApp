import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Image,
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
import { ScreenHeader } from '@/components/ui/screen-header';
import { Brand, Palette, Radius, Shadow, Spacing } from '@/constants/theme';

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
  };
  assentos: number[];
  passageiros: Passageiro[];
  status: 'ativa' | 'cancelada' | 'remarcada';
  criadaEm: string;
}

function param(value?: string | string[]) {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export default function MeusTicketsScreen() {
  const [reservas, setReservas] = useState<ReservaSalva[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [ticketAberto, setTicketAberto] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const currentUserEmail = await AsyncStorage.getItem('currentUserEmail');
      const json = await AsyncStorage.getItem('reservas');
      const todas: ReservaSalva[] = json ? JSON.parse(json) : [];

      setReservas(
        todas.filter(
          (r) =>
            r.userEmail === currentUserEmail &&
            r.status !== 'cancelada'
        )
      );
    } catch {
      // silencioso — empty state cobre
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <FocusedStatusBar iconStyle="dark" backgroundColor={Palette.surface} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void carregar();
            }}
            tintColor={Brand.primary}
          />
        }
      >
        <ScreenHeader
          title="Meus bilhetes"
          subtitle="Apresente o QR no embarque"
          onBack={() => router.back()}
        />

        {loading && !refreshing ? (
          <Text style={styles.info}>A carregar bilhetes...</Text>
        ) : null}

        {!loading && reservas.length === 0 ? (
          <EmptyState
            icon="🎫"
            title="Nenhum bilhete ativo"
            message="Após confirmar uma reserva, o seu bilhete digital aparecerá aqui."
            actionLabel="Pesquisar viagens"
            onAction={() => router.push('/dashboard')}
          />
        ) : null}

        {reservas.map((r) => {
          const isOpen = ticketAberto === r.id;
          const qrCode = `TICKET-${r.id}`;

          return (
            <TouchableOpacity
              key={r.id}
              activeOpacity={0.92}
              style={styles.card}
              onPress={() =>
                setTicketAberto((prev) => (prev === r.id ? null : r.id))
              }
              accessibilityRole="button"
              accessibilityLabel={`Bilhete ${param(r.viagem.origem)} para ${param(r.viagem.destino)}`}
              accessibilityState={{ expanded: isOpen }}
            >
              <View style={styles.row}>
                <View style={styles.cardMain}>
                  <Text style={styles.agencia}>{param(r.viagem.agencia)}</Text>
                  <Text style={styles.route}>
                    {param(r.viagem.origem)} → {param(r.viagem.destino)}
                  </Text>
                  <Text style={styles.detail}>
                    {param(r.viagem.data) ? `${param(r.viagem.data)} • ` : ''}
                    {param(r.viagem.hora)}
                  </Text>
                  <Text style={styles.tapHint}>
                    {isOpen ? 'Toque para ocultar QR' : 'Toque para mostrar QR'}
                  </Text>
                </View>
                <View style={styles.right}>
                  <Text style={styles.price}>{param(r.viagem.preco)} Kz</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{r.status.toUpperCase()}</Text>
                  </View>
                </View>
              </View>

              {isOpen ? (
                <View style={styles.qrContainer}>
                  <View style={styles.qrBox}>
                    <Text style={styles.qrLabel}>QR DO BILHETE</Text>
                    <Image
                      source={require('../assets/images/qr-code.jpg')}
                      style={styles.qrImage}
                      resizeMode="contain"
                      accessibilityLabel="Código QR do bilhete"
                    />
                    <Text style={styles.qrCode}>{qrCode}</Text>
                  </View>
                  <Text style={styles.qrHint}>
                    Apresente este código no terminal de embarque.
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
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
  tapHint: {
    marginTop: Spacing.sm,
    fontSize: 12,
    color: Brand.primary,
    fontWeight: '600',
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
    backgroundColor: Brand.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: Brand.accent,
  },
  qrContainer: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  qrBox: {
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Palette.surfaceMuted,
  },
  qrLabel: {
    fontSize: 12,
    color: Palette.textSecondary,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  qrImage: {
    width: 160,
    height: 160,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
  },
  qrCode: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: Palette.text,
  },
  qrHint: {
    marginTop: Spacing.sm,
    fontSize: 12,
    color: Palette.textMuted,
    textAlign: 'center',
  },
});
