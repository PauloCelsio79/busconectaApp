import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FocusedStatusBar } from '@/components/ui/focused-status-bar';
import { LOCALIDADES_ANGOLA } from '@/constants/provincias';
import { Brand, Palette, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const { user, isLoading: authLoading, logout, isAuthenticated } = useAuth();
  const today = new Date();
  const currentYear = today.getFullYear();
  const todayStart = new Date(currentYear, today.getMonth(), today.getDate());

  const [origem, setOrigem] = useState('');
  const [destino, setDestino] = useState('');
  const [dataIda, setDataIda] = useState('');
  const [dataRegresso, setDataRegresso] = useState('');
  const [idaVolta, setIdaVolta] = useState(false);
  const [dateError, setDateError] = useState('');
  const [datePickerOpen, setDatePickerOpen] = useState<null | 'ida' | 'regresso'>(null);
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarYear, setCalendarYear] = useState(currentYear);
  const [menuOpen, setMenuOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [origemFocused, setOrigemFocused] = useState(false);
  const [destinoFocused, setDestinoFocused] = useState(false);

  const filtrarLocalidades = (texto: string) => {
    if (!texto.trim()) return LOCALIDADES_ANGOLA;
    const lower = texto.toLowerCase();
    return LOCALIDADES_ANGOLA.filter((p) => p.toLowerCase().includes(lower));
  };

  const origemSugestoes = origemFocused ? filtrarLocalidades(origem) : [];
  const destinoSugestoes = destinoFocused ? filtrarLocalidades(destino) : [];

  if (authLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/" />;
  }

  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  const weekdayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  const formatDayMonth = (day: number, month: number) =>
    `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}`;

  const getClosestFutureDate = (day: number, month: number, floorDate: Date = todayStart) => {
    const maxYear = currentYear + 5;

    for (let year = currentYear; year <= maxYear; year += 1) {
      const date = new Date(year, month - 1, day);
      if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
      ) {
        continue;
      }

      if (date >= floorDate) {
        return date;
      }
    }

    return null;
  };

  const parseDateString = (value: string, minDate?: Date) => {
    const parts = value.split('/').map((item) => Number(item.trim()));
    if (parts.length !== 2) return null;

    const [day, month] = parts;
    if (!day || !month) return null;

    return getClosestFutureDate(day, month, minDate ?? todayStart);
  };

  const validateDate = (value: string, minDate?: Date) => {
    const date = parseDateString(value, minDate);
    const maxYear = currentYear + 5;

    if (!date) {
      return 'Use o formato DD/MM válido.';
    }

    if (date < todayStart) {
      return 'A data não pode ser anterior a hoje.';
    }

    if (date.getFullYear() > maxYear) {
      return `Ano inválido. Use até ${maxYear}.`;
    }

    if (minDate && date < minDate) {
      return 'A data de regresso deve ser igual ou posterior à data de ida.';
    }

    return '';
  };

  const openDatePicker = (field: 'ida' | 'regresso') => {
    const idaDate = parseDateString(dataIda);
    const baseMonth =
      field === 'regresso' && idaDate ? idaDate.getMonth() : today.getMonth();
    const baseYear =
      field === 'regresso' && idaDate ? idaDate.getFullYear() : today.getFullYear();

    setCalendarMonth(baseMonth);
    setCalendarYear(baseYear);
    setDatePickerOpen(field);
  };

  const selectedIdaDate = parseDateString(dataIda);

  const canSelectDay = (day: number) => {
    const date = new Date(calendarYear, calendarMonth, day);
    if (date < todayStart) {
      return false;
    }

    if (datePickerOpen === 'regresso' && selectedIdaDate && date < selectedIdaDate) {
      return false;
    }

    return true;
  };

  const handleDateSelect = (day: number) => {
    const value = formatDayMonth(day, calendarMonth);
    if (datePickerOpen === 'ida') {
      setDataIda(value);
      if (selectedIdaDate) {
        const regDate = parseDateString(dataRegresso);
        if (regDate && regDate < new Date(currentYear, calendarMonth, day)) {
          setDataRegresso('');
        }
      }
    } else {
      setDataRegresso(value);
    }

    setDateError('');
    setDatePickerOpen(null);
  };

  function swapOrigemDestino() {
    setOrigem(destino);
    setDestino(origem);
    setFormError('');
  }

  const handleSubmit = () => {
    setDateError('');
    setFormError('');

    if (!origem.trim() || !destino.trim()) {
      setFormError('Indique a origem e o destino da viagem.');
      return;
    }

    if (origem.trim().toLowerCase() === destino.trim().toLowerCase()) {
      setFormError('Origem e destino devem ser diferentes.');
      return;
    }

    const idaError = validateDate(dataIda);
    if (idaError) {
      setDateError(idaError);
      return;
    }

    if (idaVolta) {
      const idaDate = parseDateString(dataIda);
      const regressoError = validateDate(dataRegresso, idaDate ?? undefined);
      if (regressoError) {
        setDateError(regressoError);
        return;
      }
    }

    if (!dataIda) {
      setFormError('Selecione a data de ida.');
      return;
    }

    router.push({
      pathname: '/resultados',
      params: {
        origem,
        destino,
        dataIda,
        dataRegresso: idaVolta ? dataRegresso : undefined,
      },
    });
  };

  const firstWeekdayOffset = (new Date(calendarYear, calendarMonth, 1).getDay() + 6) % 7;
  const monthDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();

  return (
    <View style={styles.container}>
      <FocusedStatusBar
        iconStyle="light"
        backgroundColor={Brand.primaryDark}
      />
      <View style={styles.heroBackground} />

      <SafeAreaView style={styles.safeTop} edges={['top']}>
      <View style={styles.topButtons}>
        <TouchableOpacity
          style={styles.circleButton}
          onPress={() => setMenuOpen((prev) => !prev)}
        >
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.circleButton}
          onPress={() => router.push('/meus-tickets')}
          accessibilityLabel="Meus bilhetes"
        >
          <Text style={styles.ticketIcon}>🎫</Text>
        </TouchableOpacity>
      </View>
      </SafeAreaView>

      {menuOpen && (
        <Pressable style={styles.menuOverlay} onPress={() => setMenuOpen(false)}>
          <Pressable style={styles.menuPanel} onPress={() => {}}>
            <TouchableOpacity style={styles.menuCloseButton} onPress={() => setMenuOpen(false)}>
              <Text style={styles.menuCloseText}>×</Text>
            </TouchableOpacity>

            <View style={styles.menuHeader}>
              <Text style={styles.menuHeaderText}>Menu</Text>
            </View>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                router.push('/minhas-viagens');
              }}
            >
              <Text style={styles.menuIcon}>👤</Text>
              <Text style={styles.menuItemText}>Perfil</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                router.push('/minhas-viagens');
              }}
            >
              <Text style={styles.menuIcon}>🧳</Text>
              <Text style={styles.menuItemText}>Viagens</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
              }}
            >
              <Text style={styles.menuIcon}>🎉</Text>
              <Text style={styles.menuItemText}>Promoções</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
              }}
            >
              <Text style={styles.menuIcon}>🎧</Text>
              <Text style={styles.menuItemText}>Suporte</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemLogout]}
              onPress={async () => {
                setMenuOpen(false);
                await logout();
              }}
            >
              <Text style={styles.menuIcon}>⎋</Text>
              <Text style={styles.menuItemTextLogout}>Terminar sessão</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      )}

      <KeyboardAvoidingView
        style={styles.card}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {user?.nome ? (
          <Text style={styles.greeting}>Olá, {user.nome.split(' ')[0]} 👋</Text>
        ) : null}
        <View style={styles.brandingRow}>
          <Text style={styles.brandingTitle}>Bus</Text>
          <Text style={[styles.brandingTitle, styles.brandingAccent]}>Conecta</Text>
        </View>
        <Text style={styles.brandingSubtitle}>
          Viagem com <Text style={styles.highlight}>praticidade</Text>
        </Text>

        <ScrollView
          style={styles.formScroll}
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.routeRow}>
            <View style={[styles.routeInput, styles.autocompleteWrap]}>
              <TextInput
                style={[styles.input, { marginBottom: 0 }]}
                placeholder="Origem"
                placeholderTextColor={Palette.textMuted}
                value={origem}
                onChangeText={(v) => {
                  setOrigem(v);
                  setFormError('');
                  setOrigemFocused(true);
                }}
                onFocus={() => setOrigemFocused(true)}
                onBlur={() => setTimeout(() => setOrigemFocused(false), 150)}
                accessibilityLabel="Cidade de origem"
              />
              {origemSugestoes.length > 0 && origem.length > 0 && !LOCALIDADES_ANGOLA.includes(origem) ? (
                <View style={styles.suggestionsBox}>
                  <ScrollView
                    style={styles.suggestionsList}
                    keyboardShouldPersistTaps="always"
                    nestedScrollEnabled
                  >
                    {origemSugestoes.map((p) => (
                      <TouchableOpacity
                        key={p}
                        style={styles.suggestionItem}
                        onPress={() => {
                          setOrigem(p);
                          setOrigemFocused(false);
                        }}
                      >
                        <Text style={styles.suggestionText}>{p}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              ) : null}
            </View>
            <TouchableOpacity
              style={styles.swapButton}
              onPress={swapOrigemDestino}
              accessibilityLabel="Trocar origem e destino"
            >
              <Text style={styles.swapIcon}>⇅</Text>
            </TouchableOpacity>
            <View style={[styles.routeInput, styles.autocompleteWrap]}>
              <TextInput
                style={[styles.input, { marginBottom: 0 }]}
                placeholder="Destino"
                placeholderTextColor={Palette.textMuted}
                value={destino}
                onChangeText={(v) => {
                  setDestino(v);
                  setFormError('');
                  setDestinoFocused(true);
                }}
                onFocus={() => setDestinoFocused(true)}
                onBlur={() => setTimeout(() => setDestinoFocused(false), 150)}
                accessibilityLabel="Cidade de destino"
              />
              {destinoSugestoes.length > 0 && destino.length > 0 && !LOCALIDADES_ANGOLA.includes(destino) ? (
                <View style={styles.suggestionsBox}>
                  <ScrollView
                    style={styles.suggestionsList}
                    keyboardShouldPersistTaps="always"
                    nestedScrollEnabled
                  >
                    {destinoSugestoes.map((p) => (
                      <TouchableOpacity
                        key={p}
                        style={styles.suggestionItem}
                        onPress={() => {
                          setDestino(p);
                          setDestinoFocused(false);
                        }}
                      >
                        <Text style={styles.suggestionText}>{p}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              ) : null}
            </View>
          </View>

          <TouchableOpacity style={styles.inputButton} onPress={() => openDatePicker('ida')}>
            <Text style={[styles.inputText, dataIda ? styles.inputValue : styles.placeholderText]}>
              {dataIda || 'Data de ida'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => {
              setIdaVolta((prev) => {
                if (prev) {
                  setDataRegresso('');
                  setDateError('');
                }
                return !prev;
              });
            }}
          >
            <View style={[styles.checkbox, idaVolta && styles.checkboxChecked]} />
            <Text style={styles.checkboxLabel}>Viagem de ida e volta</Text>
          </TouchableOpacity>

          {idaVolta && (
            <TouchableOpacity style={styles.inputButton} onPress={() => openDatePicker('regresso')}>
              <Text
                style={[styles.inputText, dataRegresso ? styles.inputValue : styles.placeholderText]}
              >
                {dataRegresso || 'Data de regresso'}
              </Text>
            </TouchableOpacity>
          )}

          <Modal visible={datePickerOpen !== null} transparent animationType="fade">
            <Pressable style={styles.calendarOverlay} onPress={() => setDatePickerOpen(null)}>
              <Pressable style={styles.calendarContainer} onPress={() => {}}>
                <View style={styles.calendarHeader}>
                  <Text style={styles.calendarTitle}>Escolha dia e mês</Text>
                  <View style={styles.monthRow}>
                    <TouchableOpacity
                    disabled={
                      calendarYear ===
                        ((datePickerOpen === 'regresso' && selectedIdaDate)
                          ? selectedIdaDate.getFullYear()
                          : today.getFullYear()) &&
                      calendarMonth <=
                        ((datePickerOpen === 'regresso' && selectedIdaDate)
                          ? selectedIdaDate.getMonth()
                          : today.getMonth())
                    }
                    onPress={() => {
                      setCalendarMonth((prevMonth) => {
                        if (prevMonth === 0) {
                          setCalendarYear((prevYear) => Math.max(prevYear - 1, today.getFullYear()));
                          return 11;
                        }
                        return prevMonth - 1;
                      });
                    }}
                    style={styles.monthButton}
                  >
                    <Text style={styles.monthButtonText}>{'<'}</Text>
                  </TouchableOpacity>
                  <Text style={styles.monthName}>{monthNames[calendarMonth]}</Text>
                  <TouchableOpacity
                    disabled={
                      calendarYear >= currentYear + 5 && calendarMonth >= 11
                    }
                    onPress={() => {
                      setCalendarMonth((prevMonth) => {
                        if (prevMonth === 11) {
                          setCalendarYear((prevYear) => Math.min(prevYear + 1, currentYear + 5));
                          return 0;
                        }
                        return prevMonth + 1;
                      });
                    }}
                    style={styles.monthButton}
                  >
                    <Text style={styles.monthButtonText}>{'>'}</Text>
                  </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.weekdaysRow}>
                  {weekdayLabels.map((weekday) => (
                    <Text key={weekday} style={styles.weekdayLabel}>
                      {weekday}
                    </Text>
                  ))}
                </View>
                <View style={styles.daysGrid}>
                  {Array.from({ length: firstWeekdayOffset }).map((_, index) => (
                    <View key={`blank-${index}`} style={styles.dayCell} />
                  ))}
                  {Array.from({ length: monthDays }, (_, index) => {
                    const day = index + 1;
                    const enabled = canSelectDay(day);
                    return (
                      <TouchableOpacity
                        key={`day-${day}`}
                        style={[
                          styles.dayCell,
                          styles.dayButton,
                          enabled ? null : styles.dayButtonDisabled,
                        ]}
                        disabled={!enabled}
                        onPress={() => handleDateSelect(day)}
                      >
                        <Text style={[styles.dayText, enabled ? null : styles.dayTextDisabled]}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
            </Pressable>
          </Pressable>
          </Modal>

          {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
          {dateError ? <Text style={styles.errorText}>{dateError}</Text> : null}

          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit}
            accessibilityRole="button"
            accessibilityLabel="Pesquisar viagens"
          >
            <Text style={styles.buttonText}>Buscar viagens</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.primaryDark },
  safeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  greeting: {
    fontSize: 14,
    color: Palette.textSecondary,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  formScroll: {
    flex: 1,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    zIndex: 10,
  },
  routeInput: {
    flex: 1,
  },
  autocompleteWrap: {
    position: 'relative',
    zIndex: 5,
  },
  suggestionsBox: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    zIndex: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  suggestionsList: {
    maxHeight: 160,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
  },
  swapButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Brand.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Brand.primary,
  },
  swapIcon: {
    fontSize: 20,
    color: Brand.primary,
    fontWeight: '700',
  },
  ticketIcon: {
    fontSize: 20,
  },
  heroBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
    backgroundColor: Brand.primaryDark,
  },
  topButtons: {
    paddingHorizontal: 24,
    paddingTop: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  circleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    marginVertical: 1,
  },
  menuLine: {
    width: 22,
    height: 2,
    backgroundColor: '#fff',
    marginVertical: 2,
    borderRadius: 2,
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    zIndex: 20,
  },
  menuPanel: {
    width: '70%',
    maxWidth: 320,
    height: '100%',
    backgroundColor: '#fff',
    paddingTop: 40,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 12,
  },
  menuCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#F8F8F8',
  },
  menuCloseText: {
    fontSize: 24,
    color: '#C6082A',
    lineHeight: 24,
  },
  menuHeader: {
    marginBottom: 28,
  },
  menuHeaderText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#191919',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  menuIcon: {
    fontSize: 18,
    width: 24,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#191919',
  },
  menuItemLogout: {
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    paddingTop: Spacing.md,
  },
  menuItemTextLogout: {
    fontSize: 16,
    fontWeight: '700',
    color: Brand.primary,
  },
  card: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: '58%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  brandingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  brandingTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#191919',
    marginRight: 8,
  },
  brandingAccent: {
    color: Brand.primary,
  },
  brandingSubtitle: {
    fontSize: 16,
    color: '#545151',
    marginBottom: 24,
  },
  highlight: {
    color: Brand.accent,
    fontWeight: 'bold',
  },
  form: {
    width: '100%',
    paddingBottom: Spacing.md,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#fafafa',
    marginBottom: 16,
  },
  inputButton: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
    paddingHorizontal: 14,
    justifyContent: 'center',
    backgroundColor: '#fafafa',
    marginBottom: 16,
  },
  inputText: {
    fontSize: 15,
  },
  inputValue: {
    color: '#181818',
  },
  placeholderText: {
    color: '#8C8C8C',
  },
  calendarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  calendarContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
  },
  calendarHeader: {
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#191919',
    marginBottom: 12,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F2',
  },
  monthButtonText: {
    fontSize: 18,
    color: '#191919',
  },
  monthName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#191919',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  weekdayLabel: {
    width: 40,
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
  },
  dayButtonDisabled: {
    backgroundColor: '#F0F0F0',
  },
  dayText: {
    color: '#191919',
  },
  dayTextDisabled: {
    color: '#C1C1C1',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 1,
    marginBottom: 0,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#545151',
    borderRadius: 6,
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#C6082A',
    borderColor: '#C6082A',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#545151',
  },
  errorText: {
    color: '#C6082A',
    fontSize: 13,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#C6082A',
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#C6082A',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
