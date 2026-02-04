import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function Reserva() {
  const params = useLocalSearchParams();

  /* ======================
     CONFIGURAÇÕES
  ======================= */
  const TOTAL_ASSENTOS = 30;
  const ASSENTOS_POR_FILA = 4;

  /* ======================
     STATES
  ======================= */
  const [numPassageiros, setNumPassageiros] = useState(1);
  const [numPassageirosInput, setNumPassageirosInput] = useState('1');
  const [passageiros, setPassageiros] = useState([{ nome: '', bilhete: '' }]);
  const [assentosSelecionados, setAssentosSelecionados] = useState<number[]>([]);
  const [pagamento, setPagamento] = useState<'referencia' | 'transferencia'>(
    'referencia'
  );
  const [processando, setProcessando] = useState(false);
  const [pago, setPago] = useState(false);
  const [saving, setSaving] = useState(false);

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

  async function salvarReservaLocal(assentos: number[], passageirosLista: Passageiro[]) {
    setSaving(true);
    try {
      const currentUserEmail = await AsyncStorage.getItem('currentUserEmail');
      const json = await AsyncStorage.getItem('reservas');
      const existentes: ReservaSalva[] = json ? JSON.parse(json) : [];

      const novaReserva: ReservaSalva = {
        id: Date.now().toString(),
        userEmail: currentUserEmail,
        viagem: {
          agencia: params.agencia,
          origem: params.origem,
          destino: params.destino,
          data: params.data,
          hora: params.hora,
          preco: params.preco,
          duracao: params.duracao,
          embarque: params.embarque,
        },
        assentos,
        passageiros: passageirosLista,
        status: 'ativa',
        criadaEm: new Date().toISOString(),
      };

      await AsyncStorage.setItem(
        'reservas',
        JSON.stringify([novaReserva, ...existentes])
      );
    } catch (error) {
      alert('Pagamento confirmado, mas não foi possível guardar a reserva localmente.');
    } finally {
      setSaving(false);
    }
  }

  /* ======================
     FUNÇÕES
  ======================= */
  function atualizarPassageiros(qtd: number) {
    if (qtd < 1) return;

    const lista = [];
    for (let i = 0; i < qtd; i++) {
      lista.push({ nome: '', bilhete: '' });
    }

    setNumPassageiros(qtd);
    setNumPassageirosInput(String(qtd));
    setPassageiros(lista);
    setAssentosSelecionados([]); // resetar assentos
  }

  function toggleAssento(numero: number) {
    if (assentosSelecionados.includes(numero)) {
      setAssentosSelecionados(
        assentosSelecionados.filter((a) => a !== numero)
      );
      return;
    }

    if (assentosSelecionados.length >= numPassageiros) {
      alert(`Só pode selecionar ${numPassageiros} assento(s).`);
      return;
    }

    setAssentosSelecionados([...assentosSelecionados, numero]);
  }

  function efetuarPagamento() {
    if (assentosSelecionados.length !== numPassageiros) {
      alert('Selecione um assento para cada passageiro.');
      return;
    }

    setProcessando(true);

    setTimeout(async () => {
      await salvarReservaLocal(assentosSelecionados, passageiros);
      setProcessando(false);
      setPago(true);
    }, 3000);
  }

  /* ======================
     UI
  ======================= */
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Resumo da Viagem</Text>

      <Text>{params.origem} → {params.destino}</Text>
      <Text>Agência: {params.agencia}</Text>
      {params.data ? <Text>Data: {params.data}</Text> : null}
      <Text>Hora: {params.hora}</Text>
      <Text>Duração: {params.duracao}</Text>
      <Text>Preço: {params.preco}</Text>

      {/* ======================
         ESCOLHA DE ASSENTOS
      ======================= */}
      <View style={styles.section}>
        <Text style={styles.subtitle}>Escolha de Assentos</Text>

        <View style={styles.bus}>
          {Array.from({ length: TOTAL_ASSENTOS / ASSENTOS_POR_FILA }).map(
            (_, fila) => {
              const base = fila * ASSENTOS_POR_FILA + 1;

              return (
                <View key={fila} style={styles.row}>
                  {/* Lado esquerdo */}
                  <View style={styles.side}>
                    {[base, base + 1].map((n) => (
                      <TouchableOpacity
                        key={n}
                        style={[
                          styles.assento,
                          assentosSelecionados.includes(n) &&
                            styles.assentoSelecionado,
                        ]}
                        onPress={() => toggleAssento(n)}
                      >
                        <Text style={styles.assentoTexto}>{n}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Corredor */}
                  <View style={styles.corridor} />

                  {/* Lado direito */}
                  <View style={styles.side}>
                    {[base + 2, base + 3].map((n) => (
                      <TouchableOpacity
                        key={n}
                        style={[
                          styles.assento,
                          assentosSelecionados.includes(n) &&
                            styles.assentoSelecionado,
                        ]}
                        onPress={() => toggleAssento(n)}
                      >
                        <Text style={styles.assentoTexto}>{n}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            }
          )}
        </View>

        <Text style={styles.info}>
  Assentos selecionados:{' '}
  {Array.isArray(assentosSelecionados) && assentosSelecionados.length > 0
    ? assentosSelecionados.join(', ')
    : 'Nenhum'}
</Text>

      </View>

      {/* ======================
         PASSAGEIROS
      ======================= */}
      <View style={styles.section}>
        <Text style={styles.subtitle}>Passageiros</Text>

        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Número de passageiros"
          value={numPassageirosInput}
          onChangeText={(v) => {
            // Permitir limpar o campo enquanto o utilizador escreve
            setNumPassageirosInput(v);

            const valor = Number(v);
            if (!isNaN(valor) && valor > 0) {
              atualizarPassageiros(valor);
            } else if (v === '') {
              setNumPassageiros(0);
              setPassageiros([]);
              setAssentosSelecionados([]);
            }
          }}
          
        />

        {passageiros.map((p, i) => (
          <View key={i}>
            <TextInput
              style={styles.input}
              placeholder={`Nome do passageiro ${i + 1}`}
              value={p.nome}
              onChangeText={(t) => {
                const copia = [...passageiros];
                copia[i].nome = t;
                setPassageiros(copia);
              }}
            />
            <TextInput
              style={styles.input}
              placeholder="Nº do bilhete"
              value={p.bilhete}
              onChangeText={(t) => {
                const copia = [...passageiros];
                copia[i].bilhete = t;
                setPassageiros(copia);
              }}
            />
          </View>
        ))}
      </View>

      {/* ======================
         PAGAMENTO
      ======================= */}
      <View style={styles.section}>
        <Text style={styles.subtitle}>Método de Pagamento</Text>

        <TouchableOpacity onPress={() => setPagamento('referencia')}>
          <Text
            style={
              pagamento === 'referencia' ? styles.selected : styles.option
            }
          >
             Referência
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setPagamento('transferencia')}>
          <Text
            style={
              pagamento === 'transferencia' ? styles.selected : styles.option
            }
          >
             Transferência
          </Text>
        </TouchableOpacity>
      </View>

      {!pago ? (
        <TouchableOpacity
          style={[
            styles.button,
            assentosSelecionados.length !== numPassageiros && {
              opacity: 0.5,
            },
          ]}
          disabled={assentosSelecionados.length !== numPassageiros}
          onPress={efetuarPagamento}
        >
          <Text style={styles.buttonText}>
            {processando || saving
              ? 'Processando pagamento...'
              : 'Efetuar Pagamento'}
          </Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.success}>
           Pagamento efetuado com sucesso!
        </Text>
      )}
    </ScrollView>
  );
}

/* ======================
   ESTILOS
======================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  section: {
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  option: {
    padding: 10,
  },
  selected: {
    padding: 10,
    fontWeight: 'bold',
    color: '#1e90ff',
  },
  button: {
    backgroundColor: '#1e90ff',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  success: {
    marginTop: 30,
    color: 'green',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bus: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  side: {
    flexDirection: 'row',
    gap: 8,
  },
  corridor: {
    width: 20,
  },
  assento: {
    width: 45,
    height: 45,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assentoSelecionado: {
    backgroundColor: '#1e90ff',
  },
  assentoTexto: {
    fontWeight: 'bold',
    color: '#000',
  },
  info: {
    marginTop: 10,
    fontSize: 13,
    color: '#555',
  },
});
