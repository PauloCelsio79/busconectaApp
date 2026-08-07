import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppTextInput } from '@/components/ui/app-text-input';
import { FocusedStatusBar } from '@/components/ui/focused-status-bar';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionTitle } from '@/components/ui/section-title';
import { StepIndicator } from '@/components/ui/step-indicator';
import { Brand, Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { ApiError } from '@/lib/api/client';
import { confirmarPagamento, criarReserva } from '@/lib/api/reservas';
import { obterAssentos } from '@/lib/api/viagens';
import { guardarPassageirosBilhete } from '@/lib/bilhete-storage';
import { assentoNumero, assentoOcupado } from '@/lib/mappers/viagem';
import type { ApiAssento } from '@/lib/types/api';
import { formatPreco, parsePreco } from '@/lib/utils/format';

const ASSENTOS_POR_FILA = 4;
const TOTAL_ASSENTOS_FALLBACK = 30;

function param(value?: string | string[]) {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

function newPassengerId() {
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

interface Passageiro {
  id: string;
  nome: string;
  bilhete: string;
  nascimento?: string;
  nacionalidade: 'Nacional' | 'Estrangeiro';
  incluido: boolean;
}

const MAX_PASSAGEIROS = 10;

export default function Reserva() {
  const params = useLocalSearchParams();
  const viagemId = Number(param(params.viagemId));
  const agencia = param(params.agencia);
  const origem = param(params.origem);
  const destino = param(params.destino);
  const data = param(params.data);
  const hora = param(params.hora);
  const horaChegada = param(params.horaChegada);
  const preco = param(params.preco);
  const duracao = param(params.duracao);
  const embarque = param(params.embarque);
  const desembarque = param(params.desembarque);

  const [passageiros, setPassageiros] = useState<Passageiro[]>([]);
  const [assentosApi, setAssentosApi] = useState<ApiAssento[]>([]);
  const [assentosLoading, setAssentosLoading] = useState(true);
  /** IDs dos assentos na API */
  const [assentosSelecionados, setAssentosSelecionados] = useState<number[]>([]);
  const [pagamento, setPagamento] = useState<'referencia' | 'transferencia'>('referencia');
  const [processando, setProcessando] = useState(false);
  const [pago, setPago] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [editingPassengerId, setEditingPassengerId] = useState<string | null>(null);
  const [modalNome, setModalNome] = useState('');
  const [modalBI, setModalBI] = useState('');
  const [modalNascimento, setModalNascimento] = useState('');
  const [modalNacionalidade, setModalNacionalidade] = useState<'Nacional' | 'Estrangeiro'>('Nacional');
  const [passengerError, setPassengerError] = useState('');
  const [seatHint, setSeatHint] = useState('');
  const [saveError, setSaveError] = useState('');
  const [stepAtual, setStepAtual] = useState(1);
  const [showBirthDatePicker, setShowBirthDatePicker] = useState(false);
  const [birthCalendarMonth, setBirthCalendarMonth] = useState(new Date().getMonth());
  const [birthCalendarYear, setBirthCalendarYear] = useState(new Date().getFullYear());

  const assentosPorNumero = useMemo(() => {
    const map = new Map<number, ApiAssento>();
    for (const a of assentosApi) {
      const n = assentoNumero(a);
      if (n > 0) map.set(n, a);
    }
    return map;
  }, [assentosApi]);

  const totalAssentosLayout = useMemo(() => {
    if (assentosApi.length === 0) return TOTAL_ASSENTOS_FALLBACK;
    const max = Math.max(...assentosApi.map(assentoNumero));
    return Math.max(max, TOTAL_ASSENTOS_FALLBACK);
  }, [assentosApi]);

  const filasAssentos = Math.ceil(totalAssentosLayout / ASSENTOS_POR_FILA);

  const precoUnitario = parsePreco(preco);

  const numerosSelecionadosPorPassageiro = useMemo(
    () =>
      assentosSelecionados
        .map((id) => assentosApi.find((a) => a.id === id))
        .filter(Boolean)
        .map((a) => assentoNumero(a!)),
    [assentosSelecionados, assentosApi]
  );

  const numerosSelecionados = useMemo(
    () => [...numerosSelecionadosPorPassageiro].sort((a, b) => a - b),
    [numerosSelecionadosPorPassageiro]
  );

  const carregarAssentos = useCallback(async () => {
    if (!viagemId) {
      setAssentosLoading(false);
      setSeatHint('Identificador da viagem em falta.');
      return;
    }
    setAssentosLoading(true);
    try {
      const lista = await obterAssentos(viagemId);
      setAssentosApi(lista);
      if (lista.length === 0) {
        setSeatHint('Nenhum assento disponível para esta viagem.');
      }
    } catch (err) {
      setSeatHint(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível carregar os assentos.'
      );
    } finally {
      setAssentosLoading(false);
    }
  }, [viagemId]);

  useEffect(() => {
    void carregarAssentos();
  }, [carregarAssentos]);
  const passageirosIncluidos = useMemo(
    () => passageiros.filter((p) => p.incluido && p.nome.trim() && p.bilhete.trim()),
    [passageiros]
  );
  const numPassageiros = passageirosIncluidos.length;
  const totalPreco = precoUnitario * numPassageiros;
  const totalFormatado = formatPreco(totalPreco);

  const assentosCompletos =
    numPassageiros > 0 && assentosSelecionados.length === numPassageiros;
  const passageiroPreenchido = numPassageiros > 0;

  useEffect(() => {
    setAssentosSelecionados((prev) =>
      prev.length > numPassageiros ? prev.slice(0, numPassageiros) : prev
    );
  }, [numPassageiros]);

  const steps = useMemo(
    () => [
      { label: 'Passageiros', done: stepAtual > 1 },
      { label: 'Assento', done: stepAtual > 2 },
      { label: 'Pagamento', done: pago },
    ],
    [stepAtual, pago]
  );

  function podeAvancarStep() {
    if (stepAtual === 1) return passageiroPreenchido;
    if (stepAtual === 2) return assentosCompletos;
    return true;
  }

  function avancarStep() {
    if (!podeAvancarStep()) {
      if (stepAtual === 1) {
        setPassengerError('Adicione pelo menos um passageiro.');
      } else if (stepAtual === 2) {
        setSeatHint(`Selecione ${numPassageiros} assento(s) — um por passageiro.`);
      }
      return;
    }
    setPassengerError('');
    setSeatHint('');
    setStepAtual((s) => Math.min(s + 1, 3));
  }

  function voltarStep() {
    setStepAtual((s) => Math.max(s - 1, 1));
  }

  function toggleAssento(numero: number) {
    setSeatHint('');

    const assento = assentosPorNumero.get(numero);
    if (!assento) {
      setSeatHint(`Assento ${numero} não disponível nesta viagem.`);
      return;
    }

    if (assentoOcupado(assento)) {
      setSeatHint(`Assento ${numero} já está ocupado.`);
      return;
    }

    if (assentosSelecionados.includes(assento.id)) {
      setAssentosSelecionados(assentosSelecionados.filter((id) => id !== assento.id));
      setSeatHint(`Assento ${numero} desmarcado.`);
      return;
    }

    if (numPassageiros === 0) {
      setSeatHint('Adicione e selecione pelo menos um passageiro.');
      return;
    }

    if (assentosSelecionados.length >= numPassageiros) {
      setSeatHint(`Selecione apenas ${numPassageiros} assento(s) — um por passageiro.`);
      return;
    }

    setAssentosSelecionados([...assentosSelecionados, assento.id]);
    setSeatHint(`Assento ${numero} selecionado.`);
  }

  async function efetuarPagamento() {
    if (!viagemId) {
      setSaveError('Viagem inválida. Volte aos resultados e tente novamente.');
      return;
    }
    if (!passageiroPreenchido) {
      setSeatHint('Adicione os dados do passageiro primeiro.');
      return;
    }
    if (!assentosCompletos) {
      setSeatHint('Selecione um assento para continuar.');
      return;
    }

    setSeatHint('');
    setSaveError('');
    setProcessando(true);
    setSaving(true);

    try {
      const referencia = `REF-${Date.now()}`;
      const metodo =
        pagamento === 'referencia' ? 'multicaixa' : ('transferencia' as const);

      const reserva = await criarReserva({
        viagem_id: viagemId,
        assento_ids: assentosSelecionados,
        passageiros: passageirosIncluidos.map((p) => ({
          nome: p.nome,
          bi: p.bilhete,
          nacionalidade: p.nacionalidade,
        })),
        metodo_pagamento: metodo,
        referencia_pagamento: referencia,
      });

      await confirmarPagamento(reserva.id, referencia);

      const passageirosBilhete = passageirosIncluidos.map((p, index) => {
        const assentoId = assentosSelecionados[index];
        const assento = assentosApi.find((a) => a.id === assentoId);
        return {
          nome: p.nome,
          assento: assento ? assentoNumero(assento) : undefined,
        };
      });
      const chaves = [String(reserva.id)];
      if (reserva.codigo_reserva) chaves.push(reserva.codigo_reserva);
      await guardarPassageirosBilhete(chaves, passageirosBilhete);

      setPago(true);
    } catch (err) {
      setSaveError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível concluir o pagamento. Tente novamente.'
      );
    } finally {
      setProcessando(false);
      setSaving(false);
    }
  }

  function resetModalFields() {
    setModalNome('');
    setModalBI('');
    setModalNascimento('');
    setModalNacionalidade('Nacional');
    setPassengerError('');
  }

  function openPassengerModal(passengerId?: string) {
    if (passengerId) {
      const p = passageiros.find((item) => item.id === passengerId);
      if (!p) return;
      setEditingPassengerId(passengerId);
      setModalNome(p.nome);
      setModalBI(p.bilhete);
      setModalNascimento(p.nascimento ?? '');
      setModalNacionalidade(p.nacionalidade);
    } else {
      if (passageiros.length >= MAX_PASSAGEIROS) {
        setSeatHint(`Máximo de ${MAX_PASSAGEIROS} passageiros por reserva.`);
        return;
      }
      setEditingPassengerId(null);
      resetModalFields();
    }
    setPassengerError('');
    setShowPassengerModal(true);
  }

  function closePassengerModal() {
    setShowPassengerModal(false);
    setEditingPassengerId(null);
    resetModalFields();
  }

  const NOME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿÃãÕõÇçÁáÉéÍíÓóÚúÂâÊêÔô\s'-]+$/;

  function sanitizeNome(text: string) {
    return text.replace(/[^A-Za-zÀ-ÖØ-öø-ÿÃãÕõÇçÁáÉéÍíÓóÚúÂâÊêÔô\s'-]/g, '');
  }

  const birthMonthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];

  function openBirthDatePicker() {
    const today = new Date();
    setBirthCalendarMonth(today.getMonth());
    setBirthCalendarYear(today.getFullYear() - 20);
    setShowBirthDatePicker(true);
  }

  function handleBirthDateSelect(day: number) {
    const dd = String(day).padStart(2, '0');
    const mm = String(birthCalendarMonth + 1).padStart(2, '0');
    const yyyy = String(birthCalendarYear);
    setModalNascimento(`${dd}/${mm}/${yyyy}`);
    setShowBirthDatePicker(false);
  }

  const birthMonthDays = new Date(birthCalendarYear, birthCalendarMonth + 1, 0).getDate();
  const birthFirstWeekday = (new Date(birthCalendarYear, birthCalendarMonth, 1).getDay() + 6) % 7;
  const birthWeekdays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  function handleSavePassenger() {
    if (!modalNome.trim() || !modalBI.trim()) {
      setPassengerError(
        modalNacionalidade === 'Nacional'
          ? 'Informe nome completo e número do BI.'
          : 'Informe nome completo e número do passaporte.'
      );
      return;
    }
    if (!NOME_REGEX.test(modalNome.trim())) {
      setPassengerError('O nome contém caracteres inválidos. Use apenas letras e espaços.');
      return;
    }
    setPassengerError('');

    const dados: Passageiro = {
      id: editingPassengerId ?? newPassengerId(),
      nome: modalNome.trim(),
      bilhete: modalBI.trim(),
      nascimento: modalNascimento.trim() || undefined,
      nacionalidade: modalNacionalidade,
      incluido: true,
    };

    if (editingPassengerId) {
      setPassageiros((prev) =>
        prev.map((p) => (p.id === editingPassengerId ? { ...dados, incluido: p.incluido } : p))
      );
    } else {
      setPassageiros((prev) => [...prev, dados]);
    }

    closePassengerModal();
    setSeatHint('');
  }

  function togglePassageiroIncluido(id: string) {
    setPassageiros((prev) =>
      prev.map((p) => (p.id === id ? { ...p, incluido: !p.incluido } : p))
    );
    setSeatHint('');
  }

  function excluirPassageiro(id: string) {
    const p = passageiros.find((item) => item.id === id);
    Alert.alert(
      'Remover passageiro',
      `Deseja excluir ${p?.nome ?? 'este passageiro'} da reserva?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            setPassageiros((prev) => prev.filter((item) => item.id !== id));
            setSeatHint('');
          },
        },
      ]
    );
  }

  function documentoLabel(p: Passageiro) {
    const tipo = p.nacionalidade === 'Nacional' ? 'Nativo' : 'Estrangeiro';
    const doc = p.nacionalidade === 'Nacional' ? 'BI' : 'Passaporte';
    return `${tipo} | ${doc}: ${p.bilhete}`;
  }

  function renderAssento(numero: number) {
    const assento = assentosPorNumero.get(numero);
    const ocupado = assento ? assentoOcupado(assento) : false;
    const selecionado = assento ? assentosSelecionados.includes(assento.id) : false;
    const indisponivel = !assento;
    const bloqueado = numPassageiros === 0 || assentosLoading || indisponivel;

    return (
      <Pressable
        key={numero}
        style={[
          styles.seat,
          ocupado && styles.seatOccupied,
          selecionado && styles.seatSelected,
          bloqueado && styles.seatDisabled,
        ]}
        onPress={() => toggleAssento(numero)}
        disabled={ocupado || bloqueado}
        accessibilityRole="button"
        accessibilityLabel={`Assento ${numero}${
          indisponivel
            ? ', indisponível'
            : ocupado
              ? ', ocupado'
              : selecionado
                ? ', selecionado'
                : ', disponível'
        }`}
        accessibilityState={{ selected: selecionado, disabled: ocupado }}
      >
        <Text
          style={[
            styles.seatText,
            (ocupado || selecionado) && styles.seatTextActive,
          ]}
        >
          {numero}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.page}>
      <FocusedStatusBar iconStyle="dark" backgroundColor={Palette.surface} />
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.headerCard}>
          <ScreenHeader
            title="Confirmar reserva"
            subtitle={data || 'Data não definida'}
          />
          <StepIndicator steps={steps} />

          <View style={styles.routePill}>
            <Text style={styles.routePillLabel}>Viagem selecionada</Text>
            <Text style={styles.routePillValue}>
              {origem} → {destino} · {data || '—'}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View style={styles.summaryLeft}>
              {agencia ? (
                <View style={styles.agencyBadge}>
                  <Text style={styles.agencyBadgeText}>{agencia}</Text>
                </View>
              ) : null}
              <Text style={styles.summaryLabel}>Viagem de ida</Text>
              <Text style={styles.summaryRoute}>
                {origem} → {destino}
              </Text>
            </View>
            <View style={styles.priceBlock}>
              <Text style={styles.priceLabel}>
                {numPassageiros > 0
                  ? `${preco} Kz × ${numPassageiros}`
                  : 'Por passageiro'}
              </Text>
              <Text style={styles.summaryPrice}>
                {numPassageiros > 0 ? `${totalFormatado} Kz` : `${preco || '0'}`}
              </Text>
            </View>
          </View>

          <View style={styles.summaryTimeline}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryTime}>{hora || '—'}</Text>
              <Text style={styles.summaryMeta}>Embarque</Text>
              <Text style={styles.summaryPlace} numberOfLines={2}>
                {embarque}
              </Text>
            </View>
            <View style={styles.summaryCenter}>
              <Text style={styles.summaryDuration}>{duracao}</Text>
            </View>
            <View style={[styles.summaryCol, styles.summaryColEnd]}>
              <Text style={styles.summaryTime}>{horaChegada || hora || '—'}</Text>
              <Text style={styles.summaryMeta}>Chegada</Text>
              <Text style={styles.summaryPlace} numberOfLines={2}>
                {desembarque || '—'}
              </Text>
            </View>
          </View>
        </View>

        {stepAtual === 1 && (
        <View style={styles.block}>
          <SectionTitle
            title="Adicionar passageiro"
            hint={numPassageiros > 0 ? `${numPassageiros} na reserva` : 'Passo 1 de 3'}
          />

          <View style={styles.passengerCard}>
          {passageiros.length === 0 ? (
            <Text style={styles.passengerEmpty}>
              Nenhum passageiro adicionado. Toque em «Informe mais passageiros» para começar.
            </Text>
          ) : (
            passageiros.map((p, index) => (
              <View
                key={p.id}
                style={[
                  styles.passengerRow,
                  index === passageiros.length - 1 && styles.passengerRowLast,
                ]}
              >
                <Pressable
                  style={[styles.checkbox, p.incluido && styles.checkboxChecked]}
                  onPress={() => togglePassageiroIncluido(p.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: p.incluido }}
                  accessibilityLabel={`Incluir ${p.nome} na reserva`}
                >
                  {p.incluido ? <Text style={styles.checkboxMark}>✓</Text> : null}
                </Pressable>

                <View style={styles.passengerRowBody}>
                  <Text style={styles.passengerName}>{p.nome}</Text>
                  <Text style={styles.passengerDoc}>{documentoLabel(p)}</Text>
                </View>

                <View style={styles.passengerActions}>
                  <Pressable
                    style={styles.editBtn}
                    onPress={() => openPassengerModal(p.id)}
                    accessibilityLabel={`Editar ${p.nome}`}
                  >
                    <Text style={styles.editBtnIcon}>✎</Text>
                    <Text style={styles.editBtnText}>Editar</Text>
                  </Pressable>
                  <Pressable
                    style={styles.deleteBtn}
                    onPress={() => excluirPassageiro(p.id)}
                    accessibilityLabel={`Excluir ${p.nome}`}
                  >
                    <Text style={styles.deleteBtnText}>×</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}

          <Pressable
            style={({ pressed }) => [
              styles.addMoreRow,
              pressed && styles.cardPressed,
            ]}
            onPress={() => openPassengerModal()}
            accessibilityRole="button"
            accessibilityLabel="Adicionar mais passageiros"
          >
            
            <Text style={styles.addMoreText}>👤+ Informe mais passageiros</Text>
            <Text style={styles.addMoreArrow}>›</Text>
          </Pressable>
          </View>

          {numPassageiros > 0 ? (
            <View style={styles.totalBanner}>
              <View>
                <Text style={styles.totalBannerLabel}>Total estimado</Text>
                <Text style={styles.totalBannerDetail}>
                  {numPassageiros === 1 ? 'passageiro' : 'passageiros'}
                </Text>
              </View>
              <Text style={styles.totalBannerValue}>{totalFormatado} Kz</Text>
            </View>
          ) : null}

          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerText}>
              Menores de 5 anos estão isentos de pagamento de bilhete.
            </Text>
          </View>
        </View>
        )}

        {stepAtual === 2 && (
        <View style={styles.block}>
          <SectionTitle
            title="Escolher assento"
            hint={
              numPassageiros > 0
                ? `${assentosSelecionados.length}/${numPassageiros} assento(s)`
                : 'Adicione passageiros primeiro'
            }
          />
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendFree]} />
              <Text style={styles.legendLabel}>Livre</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendBusy]} />
              <Text style={styles.legendLabel}>Ocupado</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendPick]} />
              <Text style={styles.legendLabel}>Seu</Text>
            </View>
          </View>

          <View style={styles.busFront}>
            <Text style={styles.busFrontText}>Frente do autocarro</Text>
          </View>

          {assentosLoading ? (
            <Text style={styles.seatSummary}>A carregar mapa de assentos...</Text>
          ) : assentosApi.length === 0 ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>
                Não foi possível carregar os assentos desta viagem. Tente voltar e selecionar novamente.
              </Text>
              <PrimaryButton
                title="Tentar novamente"
                onPress={() => void carregarAssentos()}
                variant="outline"
                style={{ marginTop: Spacing.md }}
              />
            </View>
          ) : null}

          <View style={styles.busLayout}>
            {Array.from({ length: filasAssentos }).map((_, fila) => {
              const base = fila * ASSENTOS_POR_FILA + 1;
              return (
                <View key={fila} style={styles.busRow}>
                  <View style={styles.busSide}>
                    {renderAssento(base)}
                    {renderAssento(base + 1)}
                  </View>
                  <View style={styles.aisle} />
                  <View style={styles.busSide}>
                    {renderAssento(base + 2)}
                    {renderAssento(base + 3)}
                  </View>
                </View>
              );
            })}
          </View>

          <Text style={styles.seatSummary}>
            {numPassageiros === 0
              ? 'Selecione passageiros acima para escolher assentos'
              : numerosSelecionados.length > 0
                ? `Assentos (${numerosSelecionados.length}/${numPassageiros}): ${numerosSelecionados.join(', ')}`
                : `Selecione ${numPassageiros} assento(s) — um por passageiro`}
          </Text>

          {passageirosIncluidos.length > 0 && numerosSelecionados.length > 0 ? (
            <View style={styles.seatAssignList}>
              {passageirosIncluidos.map((p, index) => (
                <Text key={p.id} style={styles.seatAssignItem}>
                  {p.nome.split(' ')[0]}: assento{' '}
                  {numerosSelecionadosPorPassageiro[index] ?? '—'}
                </Text>
              ))}
            </View>
          ) : null}

          {seatHint ? <Text style={styles.seatHint}>{seatHint}</Text> : null}
        </View>
        )}

        {stepAtual === 3 && (
        <View style={styles.block}>
          <SectionTitle title="Pagamento" hint="Passo 3 de 3" />
          <Pressable
            style={[
              styles.payOption,
              pagamento === 'referencia' && styles.payOptionActive,
            ]}
            onPress={() => setPagamento('referencia')}
          >
            <View style={styles.payOptionHeader}>
              <Text style={styles.payOptionTitle}>Pagamento por referência</Text>
              <View style={styles.recommendedTag}>
                <Text style={styles.recommendedText}>Recomendado</Text>
              </View>
            </View>
            <Text style={styles.payOptionDesc}>
              Receba a referência Multicaixa e pague no ATM ou app bancário.
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.payOption,
              pagamento === 'transferencia' && styles.payOptionActive,
            ]}
            onPress={() => setPagamento('transferencia')}
          >
            <Text style={styles.payOptionTitle}>Afrimoney</Text>
            <Text style={styles.payOptionDesc}>
              Pagamento rápido pela carteira móvel Afrimoney.
            </Text>
          </Pressable>
        </View>
        )}

        {saveError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{saveError}</Text>
          </View>
        ) : null}

        {pago ? (
          <View style={styles.successCard}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successTitle}>Reserva confirmada!</Text>
            <Text style={styles.successMessage}>
              Bilhete guardado. Consulte em Minhas viagens ou mostre o QR no embarque.
            </Text>
            <PrimaryButton
              title="Ver minhas viagens"
              onPress={() => router.replace('/minhas-viagens')}
              style={styles.successBtn}
            />
            <PrimaryButton
              title="Abrir bilhete (QR)"
              onPress={() => router.push('/meus-tickets')}
              variant="outline"
            />
          </View>
        ) : null}
      </ScrollView>

      {!pago ? (
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <View style={styles.footerInner}>
            <View style={styles.footerTotal}>
              <Text style={styles.footerLabel}>
                {numPassageiros > 0
                  ? `Total · ${numPassageiros} passageiro(s)`
                  : 'Total a pagar'}
              </Text>
              <Text style={styles.footerPrice}>
                {numPassageiros > 0 ? `${totalFormatado} Kz` : `${preco || '0'} Kz`}
              </Text>
            </View>
            <View style={styles.footerActions}>
              {stepAtual > 1 ? (
                <Pressable
                  style={styles.footerBackBtn}
                  onPress={voltarStep}
                  accessibilityRole="button"
                  accessibilityLabel="Voltar ao passo anterior"
                >
                  <Text style={styles.footerBackIcon}>←</Text>
                </Pressable>
              ) : null}
              <PrimaryButton
                title={
                  stepAtual === 3
                    ? processando || saving
                      ? 'A processar...'
                      : 'Pagar agora'
                    : 'Continuar'
                }
                onPress={stepAtual === 3 ? efetuarPagamento : avancarStep}
                loading={processando || saving}
                disabled={
                  stepAtual === 1
                    ? !passageiroPreenchido
                    : stepAtual === 2
                      ? !assentosCompletos
                      : false
                }
                style={styles.footerNextBtn}
              />
            </View>
          </View>
        </SafeAreaView>
      ) : null}

      <Modal visible={showPassengerModal} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.modalKeyboard}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
        <Pressable style={styles.modalOverlay} onPress={closePassengerModal}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>
                {editingPassengerId ? 'Editar passageiro' : 'Novo passageiro'}
              </Text>
              <TouchableOpacity
                onPress={closePassengerModal}
                accessibilityLabel="Fechar"
                hitSlop={12}
              >
                <Text style={styles.modalClose}>×</Text>
              </TouchableOpacity>
            </View>

            {passengerError ? (
              <View style={styles.modalErrorBox}>
                <Text style={styles.modalErrorText}>{passengerError}</Text>
              </View>
            ) : null}

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <AppTextInput
                label="Nome completo"
                placeholder="Como no documento"
                value={modalNome}
                onChangeText={(v) => setModalNome(sanitizeNome(v))}
                autoCapitalize="words"
              />
              <AppTextInput
                label={
                  modalNacionalidade === 'Nacional'
                    ? 'Bilhete de identidade'
                    : 'Passaporte'
                }
                placeholder={
                  modalNacionalidade === 'Nacional'
                    ? 'Número do BI'
                    : 'Número do passaporte'
                }
                value={modalBI}
                onChangeText={setModalBI}
              />
              <View style={styles.modalRow}>
                <View style={styles.modalCol}>
                  <Text style={styles.modalFieldLabel}>Nascimento</Text>
                  <Pressable
                    style={styles.nationalityChip}
                    onPress={openBirthDatePicker}
                  >
                    <Text style={modalNascimento ? styles.nationalityText : styles.birthPlaceholder}>
                      {modalNascimento || 'DD/MM/AAAA'}
                    </Text>
                    <Text style={styles.nationalityArrow}>📅</Text>
                  </Pressable>
                </View>
                <View style={styles.modalCol}>
                  <Text style={styles.modalFieldLabel}>Nacionalidade</Text>
                  <Pressable
                    style={styles.nationalityChip}
                    onPress={() =>
                      setModalNacionalidade(
                        modalNacionalidade === 'Nacional' ? 'Estrangeiro' : 'Nacional'
                      )
                    }
                  >
                    <Text style={styles.nationalityText}>{modalNacionalidade}</Text>
                    <Text style={styles.nationalityArrow}>⇅</Text>
                  </Pressable>
                </View>
              </View>
              <PrimaryButton
                title={editingPassengerId ? 'Guardar alterações' : 'Adicionar passageiro'}
                onPress={handleSavePassenger}
              />
            </ScrollView>

            <Modal visible={showBirthDatePicker} transparent animationType="fade">
              <Pressable style={styles.birthOverlay} onPress={() => setShowBirthDatePicker(false)}>
                <Pressable style={styles.birthContainer} onPress={() => {}}>
                  <Text style={styles.birthTitle}>Data de nascimento</Text>
                  <View style={styles.birthMonthRow}>
                    <TouchableOpacity
                      style={styles.birthMonthBtn}
                      onPress={() => {
                        setBirthCalendarMonth((m) => {
                          if (m === 0) { setBirthCalendarYear((y) => y - 1); return 11; }
                          return m - 1;
                        });
                      }}
                    >
                      <Text style={styles.birthMonthBtnText}>‹</Text>
                    </TouchableOpacity>
                    <Text style={styles.birthMonthName}>
                      {birthMonthNames[birthCalendarMonth]} {birthCalendarYear}
                    </Text>
                    <TouchableOpacity
                      style={styles.birthMonthBtn}
                      onPress={() => {
                        const now = new Date();
                        if (birthCalendarYear > now.getFullYear() || (birthCalendarYear === now.getFullYear() && birthCalendarMonth >= now.getMonth())) return;
                        setBirthCalendarMonth((m) => {
                          if (m === 11) { setBirthCalendarYear((y) => y + 1); return 0; }
                          return m + 1;
                        });
                      }}
                    >
                      <Text style={styles.birthMonthBtnText}>›</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.birthWeekRow}>
                    {birthWeekdays.map((d) => (
                      <Text key={d} style={styles.birthWeekLabel}>{d}</Text>
                    ))}
                  </View>
                  <View style={styles.birthDaysGrid}>
                    {Array.from({ length: birthFirstWeekday }).map((_, i) => (
                      <View key={`e-${i}`} style={styles.birthDayCell} />
                    ))}
                    {Array.from({ length: birthMonthDays }).map((_, i) => {
                      const day = i + 1;
                      const thisDate = new Date(birthCalendarYear, birthCalendarMonth, day);
                      const isFuture = thisDate > new Date();
                      return (
                        <View key={day} style={styles.birthDayCell}>
                          <TouchableOpacity
                            style={[styles.birthDayBtn, isFuture && styles.birthDayDisabled]}
                            disabled={isFuture}
                            onPress={() => handleBirthDateSelect(day)}
                          >
                            <Text style={[styles.birthDayText, isFuture && styles.birthDayTextDisabled]}>
                              {day}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                </Pressable>
              </Pressable>
            </Modal>
          </Pressable>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>
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
    paddingBottom: Spacing.lg,
  },
  routePill: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: Brand.primary,
  },
  routePillLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Brand.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  routePillValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.text,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 140,
  },
  summaryCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadow.card,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  summaryLeft: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  agencyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Brand.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    marginBottom: Spacing.sm,
  },
  agencyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Brand.primaryDark,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Brand.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryRoute: {
    ...Typography.title,
    fontSize: 18,
    color: Palette.text,
    marginTop: Spacing.xs,
  },
  priceBlock: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 11,
    color: Palette.textMuted,
  },
  summaryPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: Brand.primary,
  },
  summaryTimeline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  summaryCol: {
    flex: 1,
  },
  summaryColEnd: {
    alignItems: 'flex-end',
  },
  summaryTime: {
    fontSize: 18,
    fontWeight: '800',
    color: Palette.text,
  },
  summaryMeta: {
    fontSize: 11,
    fontWeight: '700',
    color: Brand.primary,
    marginTop: 2,
  },
  summaryPlace: {
    fontSize: 11,
    color: Palette.textSecondary,
    marginTop: Spacing.xs,
  },
  summaryCenter: {
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 72,
  },
  summaryDuration: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.primaryDark,
    backgroundColor: Palette.surfaceMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  block: {
    marginBottom: Spacing.xl,
  },
  passengerCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  passengerEmpty: {
    fontSize: 13,
    color: Palette.textMuted,
    marginBottom: Spacing.lg,
    lineHeight: 20,
    paddingVertical: Spacing.sm,
  },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  passengerRowLast: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: Spacing.sm,
  },
  totalBanner: {
    backgroundColor: Brand.primaryLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Brand.primary,
  },
  totalBannerLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.primaryDark,
    marginBottom: 2,
  },
  totalBannerDetail: {
    fontSize: 12,
    color: Palette.textSecondary,
  },
  totalBannerValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Brand.primary,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Brand.primary,
    marginRight: Spacing.md,
    backgroundColor: Brand.white,
  },
  checkboxChecked: {
    backgroundColor: Brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxMark: {
    color: Brand.white,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 16,
  },
  passengerRowBody: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.text,
    marginBottom: 4,
  },
  passengerDoc: {
    fontSize: 13,
    color: Palette.textSecondary,
    lineHeight: 18,
  },
  passengerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  editBtnIcon: {
    fontSize: 14,
    color: Brand.primary,
    marginRight: 2,
  },
  editBtnText: {
    fontSize: 13,
    color: Palette.textSecondary,
    fontWeight: '600',
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Brand.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.xs,
  },
  deleteBtnText: {
    fontSize: 20,
    lineHeight: 22,
    color: Brand.primary,
    fontWeight: '700',
  },
  addMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  addMoreIcon: {
    fontSize: 18,
    color: Palette.textSecondary,
    marginRight: Spacing.md,
    width: 28,
  },
  addMoreText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: Brand.primary,
  },
  addMoreArrow: {
    fontSize: 22,
    color: Brand.primary,
    fontWeight: '300',
  },
  seatAssignList: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  seatAssignItem: {
    fontSize: 12,
    color: Palette.textSecondary,
    fontWeight: '600',
  },
  cardPressed: {
    opacity: 0.9,
  },
  infoBanner: {
    backgroundColor: Brand.primaryLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Brand.primary,
  },
  infoBannerText: {
    fontSize: 12,
    color: Brand.primaryDark,
    lineHeight: 18,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  legendFree: {
    backgroundColor: Palette.surfaceMuted,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  legendBusy: {
    backgroundColor: Palette.textSecondary,
  },
  legendPick: {
    backgroundColor: Palette.success,
  },
  legendLabel: {
    fontSize: 12,
    color: Palette.textSecondary,
  },
  busFront: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  busFrontText: {
    fontSize: 11,
    color: Palette.textMuted,
    fontWeight: '600',
  },
  busLayout: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadow.card,
  },
  busRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  busSide: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  aisle: {
    width: 28,
  },
  seat: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: Palette.surfaceMuted,
    borderWidth: 1,
    borderColor: Palette.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seatOccupied: {
    backgroundColor: Palette.textSecondary,
    borderColor: Palette.textSecondary,
    opacity: 0.7,
  },
  seatSelected: {
    backgroundColor: Palette.success,
    borderColor: Palette.success,
  },
  seatDisabled: {
    opacity: 0.4,
  },
  seatText: {
    fontWeight: '700',
    color: Palette.text,
    fontSize: 14,
  },
  seatTextActive: {
    color: Brand.white,
  },
  seatSummary: {
    marginTop: Spacing.md,
    fontSize: 13,
    color: Palette.textSecondary,
    textAlign: 'center',
  },
  seatHint: {
    marginTop: Spacing.sm,
    fontSize: 13,
    color: Brand.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  payOption: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  payOptionActive: {
    borderColor: Brand.primary,
    borderWidth: 2,
    backgroundColor: Brand.primaryLight,
  },
  payOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  payOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.text,
  },
  recommendedTag: {
    backgroundColor: Brand.accentLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '700',
    color: Brand.accent,
  },
  payOptionDesc: {
    fontSize: 12,
    color: Palette.textSecondary,
    lineHeight: 18,
  },
  errorBanner: {
    backgroundColor: Brand.primaryLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: Brand.primary,
  },
  errorBannerText: {
    color: Brand.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  successCard: {
    backgroundColor: Brand.accentLight,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Brand.accent,
    marginBottom: Spacing.xxl,
  },
  successIcon: {
    fontSize: 44,
    color: Brand.accent,
    marginBottom: Spacing.md,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Palette.text,
    marginBottom: Spacing.sm,
  },
  successMessage: {
    textAlign: 'center',
    color: Palette.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  successBtn: {
    alignSelf: 'stretch',
    marginBottom: Spacing.md,
  },
  footer: {
    backgroundColor: Palette.surface,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    ...Shadow.card,
  },
  footerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  footerTotal: {
    minWidth: 80,
  },
  footerLabel: {
    fontSize: 11,
    color: Palette.textMuted,
  },
  footerPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: Brand.primary,
  },
  footerActions: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  footerBackBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Palette.surface,
  },
  footerBackIcon: {
    fontSize: 22,
    color: Brand.primary,
    fontWeight: '700',
  },
  footerNextBtn: {
    flex: 1,
  },
  modalKeyboard: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalSheet: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    maxHeight: '88%',
  },
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    ...Typography.title,
    fontSize: 18,
    color: Palette.text,
  },
  modalClose: {
    fontSize: 28,
    color: Brand.primary,
    lineHeight: 28,
  },
  modalErrorBox: {
    backgroundColor: Brand.primaryLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  modalErrorText: {
    color: Brand.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  modalRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalCol: {
    flex: 1,
  },
  modalFieldLabel: {
    ...Typography.label,
    color: Palette.text,
    marginBottom: Spacing.sm,
  },
  nationalityChip: {
    height: 52,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surfaceMuted,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  nationalityText: {
    fontSize: 15,
    color: Palette.text,
    fontWeight: '600',
  },
  nationalityArrow: {
    color: Brand.primary,
    fontWeight: '700',
  },
  birthPlaceholder: {
    fontSize: 15,
    color: Palette.textMuted,
  },
  birthOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  birthContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
  },
  birthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#191919',
    marginBottom: 12,
  },
  birthMonthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  birthMonthBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F2',
  },
  birthMonthBtnText: {
    fontSize: 18,
    color: '#191919',
  },
  birthMonthName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#191919',
  },
  birthWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  birthWeekLabel: {
    width: 40,
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
  },
  birthDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  birthDayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  birthDayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
  },
  birthDayDisabled: {
    backgroundColor: '#F0F0F0',
  },
  birthDayText: {
    color: '#191919',
  },
  birthDayTextDisabled: {
    color: '#C1C1C1',
  },
});
