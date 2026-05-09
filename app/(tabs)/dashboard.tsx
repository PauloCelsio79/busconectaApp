import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
  const [dateError, setDateError] = useState('');
  const [datePickerOpen, setDatePickerOpen] = useState<null | 'ida' | 'regresso'>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
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

  const currentYear = new Date().getFullYear();
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
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

  const parseDateString = (value: string) => {
    const parts = value.split('/').map((item) => Number(item.trim()));
    if (parts.length !== 2) return null;

    const [day, month] = parts;
    if (!day || !month) return null;

    const date = new Date(currentYear, month - 1, day);
    if (
      date.getFullYear() !== currentYear ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  };

  const validateDate = (value: string, minDate?: Date) => {
    const date = parseDateString(value);
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
    setCalendarMonth(baseMonth);
    setDatePickerOpen(field);
  };

  const selectedIdaDate = parseDateString(dataIda);

  const canSelectDay = (day: number) => {
    const date = new Date(currentYear, calendarMonth, day);
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

  const handleSubmit = () => {
    setDateError('');

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

    if (!origem || !destino || !dataIda) {
      alert('Preencha origem, destino e data de ida.');
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

  const firstWeekdayOffset = (new Date(currentYear, calendarMonth, 1).getDay() + 6) % 7;
  const monthDays = new Date(currentYear, calendarMonth + 1, 0).getDate();

  return (
    <View style={styles.container}>
      <View style={styles.heroBackground} />

      <View style={styles.topButtons}>
        <TouchableOpacity
          style={styles.circleButton}
          onPress={() => setMenuOpen((prev) => !prev)}
        >
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.circleButton}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
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

      <View style={styles.card}>
        <View style={styles.brandingRow}>
          <Text style={styles.brandingTitle}>Bus</Text>
          <Text style={[styles.brandingTitle, styles.brandingAccent]}>Conecta</Text>
        </View>
        <Text style={styles.brandingSubtitle}>
          Viagem com <Text style={styles.highlight}>praticidade</Text>
        </Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Origem"
            placeholderTextColor="#545151"
            value={origem}
            onChangeText={setOrigem}
          />

          <TextInput
            style={styles.input}
            placeholder="Destino"
            placeholderTextColor="#545151"
            value={destino}
            onChangeText={setDestino}
          />

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
                        calendarMonth <=
                        ((datePickerOpen === 'regresso' && selectedIdaDate)
                          ? selectedIdaDate.getMonth()
                          : today.getMonth())
                      }
                      onPress={() => setCalendarMonth((prev) => Math.max(prev - 1, 0))}
                      style={styles.monthButton}
                    >
                      <Text style={styles.monthButtonText}>{'<'}</Text>
                    </TouchableOpacity>
                    <Text style={styles.monthName}>{monthNames[calendarMonth]}</Text>
                    <TouchableOpacity
                      disabled={calendarMonth >= 11}
                      onPress={() => setCalendarMonth((prev) => Math.min(prev + 1, 11))}
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
              </View>
            </Pressable>
          </Modal>

          {dateError ? <Text style={styles.errorText}>{dateError}</Text> : null}

          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Buscar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#9C0415' },
  heroBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
    backgroundColor: '#9C0415',
  },
  topButtons: {
    position: 'absolute',
    top: 52,
    left: 24,
    right: 24,
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
  menu: {
    position: 'absolute',
    top: 110,
    left: 24,
    right: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 20,
  },
  menuItem: {
    paddingVertical: 12,
  },
  menuItemText: {
    fontSize: 15,
    color: '#333',
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
    color: '#C6082A',
  },
  brandingSubtitle: {
    fontSize: 16,
    color: '#545151',
    marginBottom: 24,
  },
  highlight: {
    color: '#2F9D45',
    fontWeight: 'bold',
  },
  form: {
    width: '100%',
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
