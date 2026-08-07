import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import {
    SafeAreaView,
    useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/empty-state';
import { FocusedStatusBar } from '@/components/ui/focused-status-bar';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TerminalMapSlot, type TerminalMapCoords } from '@/components/ui/terminal-map-slot';
import { Brand, Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { ApiError } from '@/lib/api/client';
import { pesquisarViagens } from '@/lib/api/viagens';
import { mapApiViagensToViagens } from '@/lib/mappers/viagem';
import type { Amenidades, Viagem } from '@/lib/types/viagem';
import { ddmmToIso } from '@/lib/utils/date';
import { formatPrecoKz } from '@/lib/utils/format';


const DIAS_SEMANA_CHIP = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES_CURTO = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

type SortOption = 'cedo' | 'barato' | 'rapido';

type OpcaoOrdenacao = { id: SortOption; label: string };

const OPCOES_ORDENACAO: OpcaoOrdenacao[] = [
  { id: 'cedo', label: 'Mais cedo' },
  { id: 'barato', label: 'Mais barato' },
  { id: 'rapido', label: 'Mais rápido' },
];

function normalizarCidade(valor: string): string {
  return valor.trim().toLowerCase();
}

function parseDataDDMM(valor: string): Date | null {
  const parts = valor.split('/').map((p) => Number(p.trim()));
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const [dia, mes] = parts;
  const ano = new Date().getFullYear();
  const date = new Date(ano, mes - 1, dia);
  if (date.getDate() !== dia || date.getMonth() !== mes - 1) return null;
  return date;
}

function formatarDataDDMM(date: Date): string {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatarChipData(date: Date): { diaSemana: string; dataCurta: string } {
  return {
    diaSemana: DIAS_SEMANA_CHIP[date.getDay()],
    dataCurta: `${date.getDate()}/${MESES_CURTO[date.getMonth()]}`,
  };
}

function dataChegadaItinerario(
  dataPartida: string,
  horaPartida: string,
  horaChegada: string
): string {
  if (parseHoraMinutos(horaChegada) <= parseHoraMinutos(horaPartida)) {
    const parsed = parseDataDDMM(dataPartida);
    if (parsed) {
      const next = new Date(parsed);
      next.setDate(next.getDate() + 1);
      return formatarDataDDMM(next);
    }
  }
  return dataPartida;
}

function gerarDatasProximas(dataBase: Date, quantidade = 7): Date[] {
  return Array.from({ length: quantidade }, (_, i) => {
    const d = new Date(dataBase);
    d.setDate(dataBase.getDate() + i);
    return d;
  });
}

function formatarPreco(valor: number): string {
  return valor.toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseHoraMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function parseDuracaoMinutos(duracao: string): number {
  const hMatch = duracao.match(/(\d+)\s*h/);
  const mMatch = duracao.match(/(\d+)\s*min/);
  const horas = hMatch ? Number(hMatch[1]) : 0;
  const mins = mMatch ? Number(mMatch[1]) : 0;
  if (!hMatch && !mMatch) {
    const onlyH = duracao.match(/^(\d+)h/);
    if (onlyH) return Number(onlyH[1]) * 60;
  }
  return horas * 60 + mins;
}

function cidadeCoincide(pesquisa: string, cidade: string): boolean {
  const p = normalizarCidade(pesquisa);
  const c = normalizarCidade(cidade);
  return c.includes(p) || p.includes(c);
}

function filtrarViagens(viagens: Viagem[], origem?: string, destino?: string): Viagem[] {
  const origemNorm = origem?.trim() ?? '';
  const destinoNorm = destino?.trim() ?? '';

  if (!origemNorm && !destinoNorm) return viagens;

  const filtradas = viagens.filter((v) => {
    const matchOrigem = !origemNorm || cidadeCoincide(origemNorm, v.origem);
    const matchDestino = !destinoNorm || cidadeCoincide(destinoNorm, v.destino);
    return matchOrigem && matchDestino;
  });

  return filtradas;
}

function ordenarViagens(viagens: Viagem[], criterio: SortOption): Viagem[] {
  const copia = [...viagens];
  switch (criterio) {
    case 'barato':
      return copia.sort((a, b) => a.preco - b.preco);
    case 'rapido':
      return copia.sort((a, b) => parseDuracaoMinutos(a.duracao) - parseDuracaoMinutos(b.duracao));
    case 'cedo':
    default:
      return copia.sort((a, b) => parseHoraMinutos(a.horaPartida) - parseHoraMinutos(b.horaPartida));
  }
}

export default function Resultados() {
  const params = useLocalSearchParams<{
    origem?: string;
    destino?: string;
    dataIda?: string;
    dataRegresso?: string;
  }>();

  const origem = params.origem?.trim() || 'Origem';
  const destino = params.destino?.trim() || 'Destino';
  const dataIdaParam = params.dataIda?.trim() ?? '';

  const dataBase = useMemo(
    () => parseDataDDMM(dataIdaParam) ?? new Date(),
    [dataIdaParam]
  );

  const datasDisponiveis = useMemo(() => gerarDatasProximas(dataBase, 7), [dataBase]);

  const [dataSelecionada, setDataSelecionada] = useState(0);
  const [viagemExpandida, setViagemExpandida] = useState<number | null>(null);
  const [ordenacao, setOrdenacao] = useState<SortOption>('cedo');
  const [sortModalAberto, setSortModalAberto] = useState(false);
  const [filtrosModalAberto, setFiltrosModalAberto] = useState(false);
  const [filtroAmenidades, setFiltroAmenidades] = useState(false);
  const [viagens, setViagens] = useState<Viagem[]>([]);
  const [loadingViagens, setLoadingViagens] = useState(true);
  const [apiError, setApiError] = useState('');

  const dataChipSelecionada = datasDisponiveis[dataSelecionada];
  const dataViagemParam = dataChipSelecionada
    ? formatarDataDDMM(dataChipSelecionada)
    : dataIdaParam;

  const carregarViagens = useCallback(async () => {
    setLoadingViagens(true);
    setApiError('');
    try {
      const iso = ddmmToIso(dataViagemParam);
      if (!iso) {
        setApiError('Data de viagem inválida.');
        setViagens([]);
        return;
      }
      const raw = await pesquisarViagens({
        origem: params.origem?.trim() ?? '',
        destino: params.destino?.trim() ?? '',
        data: iso,
      });
      setViagens(mapApiViagensToViagens(raw));
    } catch (err) {
      setApiError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível carregar viagens.'
      );
      setViagens([]);
    } finally {
      setLoadingViagens(false);
    }
  }, [params.origem, params.destino, dataViagemParam]);

  useEffect(() => {
    void carregarViagens();
  }, [carregarViagens]);

  const viagensFiltradas = useMemo(() => {
    let lista = filtrarViagens(viagens, params.origem, params.destino);
    if (filtroAmenidades) {
      lista = lista.filter(
        (v) => v.amenities.wifi && v.amenities.arCondicionado
      );
    }
    return ordenarViagens(lista, ordenacao);
  }, [viagens, params.origem, params.destino, ordenacao, filtroAmenidades]);

  const labelOrdenacao =
    OPCOES_ORDENACAO.find((o) => o.id === ordenacao)?.label ?? 'Mais cedo';

  function toggleExpand(id: number) {
    setViagemExpandida((atual) => (atual === id ? null : id));
  }

  function reservar(viagem: Viagem) {
    router.push({
      pathname: '/reserva',
      params: {
        viagemId: String(viagem.id),
        agencia: viagem.agencia,
        origem: viagem.origem,
        destino: viagem.destino,
        data: dataViagemParam,
        hora: viagem.horaPartida,
        horaChegada: viagem.horaChegada,
        preco: formatPrecoKz(viagem.preco),
        duracao: viagem.duracao,
        embarque: viagem.embarque,
        desembarque: viagem.desembarque,
      },
    });
  }

  const menorPreco = useMemo(() => {
    if (viagensFiltradas.length === 0) return 0;
    return Math.min(...viagensFiltradas.map((v) => v.preco));
  }, [viagensFiltradas]);

  const dataChip = dataChipSelecionada
    ? formatarChipData(dataChipSelecionada)
    : { diaSemana: '—', dataCurta: '—' };

  const contagemLabel =
    viagensFiltradas.length === 1
      ? '1 viagem'
      : `${viagensFiltradas.length} viagens`;

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.page}>
      <FocusedStatusBar iconStyle="dark" backgroundColor={Palette.surface} />

      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.headerCard}>
          <ScreenHeader
            title={`${origem} → ${destino}`}
            subtitle={`${contagemLabel} · ${dataChip.dataCurta}`}
          />
        </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateStrip}
      >
        <Pressable
          style={({ pressed }) => [
            styles.filtrosChip,
            pressed && styles.chipPressed,
            filtroAmenidades && styles.filtrosChipActive,
          ]}
          onPress={() => setFiltrosModalAberto(true)}
          accessibilityRole="button"
          accessibilityLabel="Abrir filtros"
        >
          <Text
            style={[
              styles.filtrosChipTitle,
              filtroAmenidades && styles.filtrosChipTitleActive,
            ]}
          >
            Filtros
          </Text>
          <MaterialIcons
            name="tune"
            size={22}
            color={filtroAmenidades ? Brand.white : Palette.textSecondary}
          />
        </Pressable>

        {datasDisponiveis.map((date, index) => {
          const chip = formatarChipData(date);
          const ativo = dataSelecionada === index;
          return (
            <Pressable
              key={date.toISOString()}
              style={({ pressed }) => [
                styles.dateChip,
                ativo && styles.dateChipActive,
                pressed && !ativo && styles.chipPressed,
              ]}
              onPress={() => setDataSelecionada(index)}
              accessibilityRole="button"
              accessibilityState={{ selected: ativo }}
              accessibilityLabel={`${chip.diaSemana} ${chip.dataCurta}`}
            >
              <Text style={[styles.dateChipDay, ativo && styles.dateChipTextActive]}>
                {chip.diaSemana}
              </Text>
              <Text style={[styles.dateChipDate, ativo && styles.dateChipTextActive]}>
                {chip.dataCurta}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

        <View style={styles.toolbar}>
        <Text style={styles.toolbarHint}>Expanda para ver itinerário e reservar</Text>
        <Pressable
          style={({ pressed }) => [styles.sortButton, pressed && styles.chipPressed]}
          onPress={() => setSortModalAberto(true)}
          accessibilityRole="button"
          accessibilityLabel={`Ordenar por ${labelOrdenacao}`}
        >
          <Text style={styles.sortLabel}>{labelOrdenacao}</Text>
          <MaterialIcons name="keyboard-arrow-down" size={20} color={Palette.text} />
        </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.listScroll}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Spacing.xxl + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {loadingViagens ? (
          <Text style={styles.loadingText}>A pesquisar viagens...</Text>
        ) : apiError ? (
          <EmptyState
            icon="⚠️"
            title="Erro na pesquisa"
            message={apiError}
            actionLabel="Tentar novamente"
            onAction={() => void carregarViagens()}
          />
        ) : viagensFiltradas.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="Nenhuma viagem encontrada"
            message="Não há autocarros para esta rota ou filtros aplicados. Altere a pesquisa ou remova os filtros."
            actionLabel="Nova pesquisa"
            onAction={() => router.back()}
          />
        ) : (
          viagensFiltradas.map((viagem) => (
            <TripCard
              key={viagem.id}
              viagem={viagem}
              expandida={viagemExpandida === viagem.id}
              melhorPreco={viagem.preco === menorPreco}
              dataPartida={dataViagemParam}
              onToggleExpand={() => toggleExpand(viagem.id)}
              onReservar={() => reservar(viagem)}
            />
          ))
        )}
      </ScrollView>

      {/* Modal ordenação */}
      <Modal
        visible={sortModalAberto}
        transparent
        animationType="fade"
        onRequestClose={() => setSortModalAberto(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSortModalAberto(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <Text style={styles.modalTitle}>Ordenar por</Text>
            {OPCOES_ORDENACAO.map((opcao) => (
              <Pressable
                key={opcao.id}
                style={({ pressed }) => [
                  styles.modalOption,
                  ordenacao === opcao.id && styles.modalOptionActive,
                  pressed && styles.chipPressed,
                ]}
                onPress={() => {
                  setOrdenacao(opcao.id);
                  setSortModalAberto(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    ordenacao === opcao.id && styles.modalOptionTextActive,
                  ]}
                >
                  {opcao.label}
                </Text>
                {ordenacao === opcao.id ? (
                  <MaterialIcons name="check" size={20} color={Brand.primary} />
                ) : null}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal filtros */}
      <Modal
        visible={filtrosModalAberto}
        transparent
        animationType="fade"
        onRequestClose={() => setFiltrosModalAberto(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setFiltrosModalAberto(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <Text style={styles.modalTitle}>Filtros</Text>
            <Pressable
              style={styles.filterToggleRow}
              onPress={() => setFiltroAmenidades((v) => !v)}
              accessibilityRole="switch"
              accessibilityState={{ checked: filtroAmenidades }}
            >
              <Text style={styles.filterToggleLabel}>Wi-Fi e ar condicionado</Text>
              <View style={[styles.filterSwitch, filtroAmenidades && styles.filterSwitchOn]}>
                <View style={[styles.filterKnob, filtroAmenidades && styles.filterKnobOn]} />
              </View>
            </Pressable>
            <PrimaryButton
              title="Aplicar"
              onPress={() => setFiltrosModalAberto(false)}
              style={styles.modalApplyBtn}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

type TripCardProps = {
  viagem: Viagem;
  expandida: boolean;
  melhorPreco: boolean;
  dataPartida: string;
  onToggleExpand: () => void;
  onReservar: () => void;
};

function TripCard({
  viagem,
  expandida,
  melhorPreco,
  dataPartida,
  onToggleExpand,
  onReservar,
}: TripCardProps) {
  const poucosLugares = viagem.lugaresRestantes <= 3;
  const dataChegada = dataChegadaItinerario(
    dataPartida,
    viagem.horaPartida,
    viagem.horaChegada
  );

  return (
    <View style={[styles.card, expandida && styles.cardExpanded]}>
      <Pressable
        style={({ pressed }) => [styles.cardBody, pressed && styles.cardBodyPressed]}
        onPress={onToggleExpand}
        accessibilityRole="button"
        accessibilityLabel={`${viagem.agencia}, ${viagem.horaPartida} a ${viagem.horaChegada}, ${formatarPreco(viagem.preco)} Kz`}
        accessibilityHint={expandida ? 'Toque para ocultar detalhes' : 'Toque para ver itinerário'}
        accessibilityState={{ expanded: expandida }}
      >
        <View style={styles.cardTopRow}>
          <View style={styles.cardBrand}>
            <View style={[styles.logoBox, { backgroundColor: viagem.logoCor }]}>
              <Text style={styles.logoText}>{viagem.logoIniciais}</Text>
            </View>
            <View style={styles.cardBrandText}>
              <Text style={styles.companhiaNome} numberOfLines={1}>
                {viagem.agencia}
              </Text>
              <Text style={styles.companhiaSub} numberOfLines={1}>
                {viagem.origem} → {viagem.destino}
              </Text>
            </View>
          </View>
          <View style={styles.cardPriceBlock}>
            <Text style={styles.precoValor}>{formatarPreco(viagem.preco)}</Text>
            <Text style={styles.precoMoeda}>Kz</Text>
          </View>
        </View>

        <View style={styles.badgesRow}>
          {melhorPreco ? (
            <View style={styles.badgeMelhor}>
              <MaterialIcons name="star" size={12} color={Brand.accent} />
              <Text style={styles.badgeMelhorText}>Melhor preço</Text>
            </View>
          ) : null}
          {poucosLugares ? (
            <View style={styles.badgeUrgente}>
              <Text style={styles.badgeUrgenteText}>
                {viagem.lugaresRestantes} lugares restantes
              </Text>
            </View>
          ) : null}
          <View style={styles.badgeDuracao}>
            <MaterialIcons name="timelapse" size={12} color={Palette.textSecondary} />
            <Text style={styles.badgeDuracaoText}>{viagem.duracao}</Text>
          </View>
        </View>

        <JourneyStrip
          horaPartida={viagem.horaPartida}
          terminalPartida={viagem.embarque}
          horaChegada={viagem.horaChegada}
          terminalChegada={viagem.desembarque}
        />

        <AmenitiesRow amenities={viagem.amenities} />
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.expandFooter,
          expandida && styles.expandFooterActive,
          pressed && styles.chipPressed,
        ]}
        onPress={onToggleExpand}
        accessibilityRole="button"
        accessibilityLabel={expandida ? 'Ocultar detalhes' : 'Ver detalhes e itinerário'}
        accessibilityState={{ expanded: expandida }}
      >
        <Text style={styles.expandFooterText}>
          {expandida ? 'Ocultar detalhes' : 'Ver detalhes'}
        </Text>
        <MaterialIcons
          name={expandida ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
          size={20}
          color={Brand.primary}
        />
      </Pressable>

      {expandida ? (
        <View style={styles.itinerarySection}>
          <View style={styles.itineraryHeader}>
            <Text style={styles.itineraryTitle}>Itinerário</Text>
            <Text style={styles.itineraryDuration}>{viagem.duracao}</Text>
          </View>

          <ItineraryStop
            data={dataPartida}
            hora={viagem.horaPartida}
            tipo="Embarque"
            terminal={viagem.embarque}
            local={viagem.embarqueEndereco}
            coordenadas={viagem.embarqueCoords}
            isFirst
          />
          <ItineraryStop
            data={dataChegada}
            hora={viagem.horaChegada}
            tipo="Desembarque"
            terminal={viagem.desembarque}
            local={viagem.desembarqueEndereco}
            coordenadas={viagem.desembarqueCoords}
            isFirst={false}
          />

          <View style={styles.itineraryNoteBox}>
            <MaterialIcons name="info-outline" size={16} color={Palette.textSecondary} />
            <Text style={styles.itineraryNote}>
              Embarque com documento original (BI ou passaporte).
            </Text>
          </View>

          <PrimaryButton
            title="Efectuar Reserva"
            onPress={onReservar}
            style={styles.reservarBtn}
            accessibilityLabel={`Efectuar reserva ${viagem.agencia}`}
          />
        </View>
      ) : null}
    </View>
  );
}

const AMENITY_LABELS: Record<keyof Amenidades, string> = {
  tomada: 'Tomada',
  wifi: 'Wi-Fi',
  arCondicionado: 'Ar cond.',
  entretenimento: 'TV',
};

function AmenitiesRow({ amenities }: { amenities: Amenidades }) {
  const items: { key: keyof Amenidades; icon: keyof typeof MaterialIcons.glyphMap }[] = [
    { key: 'tomada', icon: 'power' },
    { key: 'wifi', icon: 'wifi' },
    { key: 'arCondicionado', icon: 'ac-unit' },
    { key: 'entretenimento', icon: 'live-tv' },
  ];
  const ativas = items.filter(({ key }) => amenities[key]);

  if (ativas.length === 0) return null;

  return (
    <View style={styles.amenitiesRow}>
      {ativas.map(({ key, icon }) => (
        <View key={key} style={styles.amenityChip} accessibilityLabel={AMENITY_LABELS[key]}>
          <MaterialIcons name={icon} size={14} color={Brand.primary} />
          <Text style={styles.amenityChipText}>{AMENITY_LABELS[key]}</Text>
        </View>
      ))}
    </View>
  );
}

type JourneyStripProps = {
  horaPartida: string;
  terminalPartida: string;
  horaChegada: string;
  terminalChegada: string;
};

function JourneyStrip({
  horaPartida,
  terminalPartida,
  horaChegada,
  terminalChegada,
}: JourneyStripProps) {
  return (
    <View style={styles.journeyStrip}>
      <View style={styles.journeyEnd}>
        <Text style={styles.journeyHora}>{horaPartida}</Text>
        <Text style={styles.journeyTerminal} numberOfLines={1}>
          {terminalPartida}
        </Text>
      </View>

      <View style={styles.journeyMiddle}>
        <View style={styles.journeyLine} />
        <MaterialIcons name="directions-bus" size={18} color={Brand.primary} />
        <View style={styles.journeyLine} />
      </View>

      <View style={[styles.journeyEnd, styles.journeyEndRight]}>
        <Text style={styles.journeyHora}>{horaChegada}</Text>
        <Text style={styles.journeyTerminal} numberOfLines={1}>
          {terminalChegada}
        </Text>
      </View>
    </View>
  );
}

type ItineraryStopProps = {
  data: string;
  hora: string;
  tipo: 'Embarque' | 'Desembarque';
  terminal: string;
  local: string;
  coordenadas?: TerminalMapCoords;
  isFirst: boolean;
};

function ItineraryStop({
  data,
  hora,
  tipo,
  terminal,
  local,
  coordenadas,
  isFirst,
}: ItineraryStopProps) {
  return (
    <View style={styles.itineraryStop}>
      <View style={styles.itineraryStopLeft}>
        <Text style={styles.itineraryStopDate}>{data}</Text>
        <Text style={styles.itineraryStopHora}>{hora}</Text>
      </View>

      <View style={styles.itineraryStopTrack}>
        {isFirst ? (
          <View style={styles.itineraryDot} />
        ) : (
          <MaterialIcons name="place" size={18} color={Brand.primary} />
        )}
        {isFirst ? <View style={styles.itineraryLine} /> : null}
      </View>

      <View style={styles.itineraryStopRight}>
        <Text style={styles.itineraryStopTipo}>{tipo}:</Text>
        <Text style={styles.itineraryStopTerminal}>{terminal},</Text>
        <Text style={styles.itineraryStopLocal}>{local}</Text>
        <TerminalMapSlot titulo={terminal} endereco={local} coordenadas={coordenadas} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  headerSafe: {
    backgroundColor: Palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  headerCard: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  dateStrip: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
    alignItems: 'center',
  },
  filtrosChip: {
    width: 58,
    height: 58,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xs,
  },
  filtrosChipActive: {
    backgroundColor: Brand.primary,
    borderColor: Brand.primary,
  },
  filtrosChipTitle: {
    ...Typography.caption,
    fontWeight: '700',
    color: Palette.textSecondary,
    marginBottom: Spacing.xs,
  },
  filtrosChipTitleActive: {
    color: Brand.white,
  },
  dateChip: {
    minWidth: 58,
    height: 58,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  dateChipActive: {
    backgroundColor: Brand.primary,
    borderColor: Brand.primary,
  },
  dateChipDay: {
    ...Typography.caption,
    fontWeight: '600',
    color: Palette.text,
  },
  dateChipDate: {
    ...Typography.caption,
    color: Palette.textSecondary,
    marginTop: 2,
  },
  dateChipTextActive: {
    color: Brand.white,
  },
  chipPressed: {
    opacity: 0.85,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  toolbarHint: {
    flex: 1,
    fontSize: 11,
    color: Palette.textMuted,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surfaceMuted,
  },
  sortLabel: {
    fontSize: 13,
    color: Palette.text,
    fontWeight: '600',
  },
  listScroll: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  loadingText: {
    textAlign: 'center',
    color: Palette.textSecondary,
    fontSize: 15,
    paddingVertical: Spacing.xxl,
  },
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.border,
    overflow: 'hidden',
    ...Shadow.card,
  },
  cardExpanded: {
    borderColor: Brand.primary,
  },
  cardBody: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  cardBodyPressed: {
    backgroundColor: Palette.surfaceMuted,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  cardBrand: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minWidth: 0,
  },
  cardBrandText: {
    flex: 1,
    minWidth: 0,
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: Brand.white,
    fontWeight: '800',
    fontSize: 13,
  },
  companhiaNome: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.text,
  },
  companhiaSub: {
    fontSize: 12,
    color: Palette.textMuted,
    marginTop: 2,
  },
  cardPriceBlock: {
    alignItems: 'flex-end',
  },
  precoValor: {
    fontSize: 18,
    fontWeight: '800',
    color: Brand.primary,
    lineHeight: 22,
  },
  precoMoeda: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.textMuted,
    marginTop: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    alignItems: 'center',
  },
  badgeMelhor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Brand.accentLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  badgeMelhorText: {
    fontSize: 11,
    fontWeight: '700',
    color: Brand.accent,
  },
  badgeUrgente: {
    backgroundColor: Brand.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  badgeUrgenteText: {
    fontSize: 11,
    fontWeight: '700',
    color: Brand.primary,
  },
  badgeDuracao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.surfaceMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  badgeDuracaoText: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  journeyStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  journeyEnd: {
    flex: 1,
    minWidth: 0,
  },
  journeyEndRight: {
    alignItems: 'flex-end',
  },
  journeyHora: {
    fontSize: 17,
    fontWeight: '800',
    color: Palette.text,
  },
  journeyTerminal: {
    fontSize: 11,
    color: Palette.textSecondary,
    marginTop: 2,
  },
  journeyMiddle: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 56,
    gap: 2,
  },
  journeyLine: {
    flex: 1,
    height: 2,
    backgroundColor: Palette.border,
    borderRadius: 1,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Brand.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  amenityChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Brand.primaryDark,
  },
  expandFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Brand.primaryLight,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  expandFooterActive: {
    backgroundColor: '#F0D0D6',
  },
  expandFooterText: {
    fontSize: 14,
    fontWeight: '600',
    color: Brand.primary,
  },
  itinerarySection: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    backgroundColor: Palette.surfaceMuted,
  },
  itineraryHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  itineraryTitle: {
    ...Typography.body,
    fontWeight: '700',
    color: Palette.text,
  },
  itineraryDuration: {
    ...Typography.caption,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  itineraryNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Palette.surface,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  itineraryStop: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  itineraryStopLeft: {
    width: 48,
    alignItems: 'flex-end',
    paddingRight: Spacing.sm,
  },
  itineraryStopDate: {
    ...Typography.caption,
    fontWeight: '700',
    color: Palette.text,
  },
  itineraryStopHora: {
    ...Typography.caption,
    color: Palette.textSecondary,
  },
  itineraryStopTrack: {
    width: 24,
    alignItems: 'center',
  },
  itineraryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Palette.textMuted,
  },
  itineraryLine: {
    flex: 1,
    width: 2,
    backgroundColor: Palette.border,
    marginTop: 4,
  },
  itineraryStopRight: {
    flex: 1,
    paddingLeft: Spacing.sm,
  },
  itineraryStopTipo: {
    ...Typography.caption,
    fontWeight: '700',
    color: Palette.text,
    marginBottom: 2,
  },
  itineraryStopTerminal: {
    ...Typography.caption,
    fontWeight: '600',
    color: Palette.text,
    lineHeight: 18,
  },
  itineraryStopLocal: {
    ...Typography.caption,
    color: Palette.textSecondary,
    lineHeight: 18,
    marginBottom: 2,
  },
  itineraryNote: {
    flex: 1,
    ...Typography.caption,
    color: Palette.textSecondary,
    lineHeight: 18,
  },
  reservarBtn: {
    marginTop: Spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Palette.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  modalTitle: {
    ...Typography.title,
    fontSize: 18,
    color: Palette.text,
    marginBottom: Spacing.lg,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  modalOptionActive: {
    backgroundColor: Brand.primaryLight,
    marginHorizontal: -Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
  },
  modalOptionText: {
    ...Typography.body,
    color: Palette.text,
  },
  modalOptionTextActive: {
    fontWeight: '700',
    color: Brand.primary,
  },
  filterToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  filterToggleLabel: {
    ...Typography.body,
    color: Palette.text,
    flex: 1,
    marginRight: Spacing.md,
  },
  filterSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.border,
    padding: 2,
    justifyContent: 'center',
  },
  filterSwitchOn: {
    backgroundColor: Brand.primary,
  },
  filterKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Brand.white,
  },
  filterKnobOn: {
    alignSelf: 'flex-end',
  },
  modalApplyBtn: {
    marginTop: Spacing.sm,
  },
});
