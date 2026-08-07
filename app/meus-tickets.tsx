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
import { useAuth } from '@/contexts/AuthContext';
import { listarReservas } from '@/lib/api/reservas';
import { enriquecerPassageirosBilhete } from '@/lib/bilhete-storage';
import {
    buildBilheteQrPayload,
    isBilheteAtivo,
    mapApiReservasToApp,
    type ReservaApp,
} from '@/lib/mappers/reserva';

export default function MeusTicketsScreen() {
  const { isAuthenticated } = useAuth();
  const [reservas, setReservas] = useState<ReservaApp[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [ticketAberto, setTicketAberto] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const raw = await listarReservas();
      const mapeadas = mapApiReservasToApp(raw).filter(isBilheteAtivo);
      const comPassageiros = await Promise.all(
        mapeadas.map(async (r) => ({
          ...r,
          passageiros: await enriquecerPassageirosBilhete(r.id, r.codigo, r.passageiros),
        }))
      );
      setReservas(comPassageiros);
    } catch {
      setReservas([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

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
          const qrCode = buildBilheteQrPayload(r);

          return (
            <TouchableOpacity
              key={r.id}
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => setTicketAberto(isOpen ? null : r.id)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.route}>
                  {r.origem} → {r.destino}
                </Text>
                <Text style={styles.date}>
                  {r.data} · {r.hora}
                </Text>
              </View>

              {isOpen ? (
                <View style={styles.ticketBody}>
                  <Image
                    source={{
                      uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode)}`,
                    }}
                    style={styles.qr}
                    accessibilityLabel="Código QR do bilhete"
                  />
                  <Text style={styles.qrHint} numberOfLines={4}>
                    {r.codigo ? `TICKET-${r.codigo}` : `TICKET-${r.id}`}
                  </Text>

                  {r.passageiros.length > 0 ? (
                    <View style={styles.passengersBlock}>
                      <Text style={styles.passengersTitle}>Passageiros</Text>
                      {r.passageiros.map((p) => (
                        <Text key={`${r.id}-${p.nome}-${p.assento ?? ''}`} style={styles.passengerName}>
                          {p.nome}
                          {p.assento ? ` · Assento ${p.assento}` : ''}
                        </Text>
                      ))}
                    </View>
                  ) : null}

                  <Text style={styles.meta}>
                    {r.agencia} 
                  </Text>
                  <Text style={styles.price}>{r.preco}</Text>
                </View>
              ) : (
                <Text style={styles.tapHint}>Toque para ver o QR</Text>
              )}
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
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadow.card,
  },
  cardHeader: {
    marginBottom: Spacing.sm,
  },
  route: {
    fontSize: 17,
    fontWeight: '800',
    color: Palette.text,
  },
  date: {
    fontSize: 13,
    color: Palette.textSecondary,
    marginTop: 4,
  },
  tapHint: {
    fontSize: 13,
    color: Brand.primary,
    fontWeight: '600',
  },
  ticketBody: {
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    marginTop: Spacing.sm,
  },
  qr: {
    width: 180,
    height: 180,
    marginBottom: Spacing.md,
  },
  qrHint: {
    fontSize: 12,
    color: Palette.textMuted,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  passengersBlock: {
    width: '100%',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  passengersTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.text,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  passengerName: {
    fontSize: 14,
    color: Palette.textSecondary,
    textAlign: 'center',
    marginBottom: 2,
  },
  meta: {
    fontSize: 13,
    color: Palette.textSecondary,
    textAlign: 'center',
  },
  price: {
    marginTop: Spacing.sm,
    fontSize: 16,
    fontWeight: '800',
    color: Brand.primary,
  },
});
