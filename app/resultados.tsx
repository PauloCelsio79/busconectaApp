import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const viagens = [
  {
    id: 1,
    agencia: 'Huambo Express',
    origem: 'Lubango',
    destino: 'Luanda',
    hora: '07:00',
    preco: '15.000 Kz',
    duracao: '12h',
    embarque: 'Terminal Rodoviário do Lubango',
  },
  {
    id: 2,
    agencia: 'Macom',
    origem: 'Lubango',
    destino: 'Luanda',
    hora: '09:30',
    preco: '16.500 Kz',
    duracao: '11h30',
    embarque: 'Terminal Central',
  },
  {
    id: 3,
    agencia: 'Rosalina Express',
    origem: 'Lubango',
    destino: 'Luanda',
    hora: '18:00',
    preco: '14.000 Kz',
    duracao: '13h',
    embarque: 'Paragem Principal',
  },

  {
    id: 4,
    agencia: 'TCUL Express',
    origem: 'Lubango',
    destino: 'Luanda',
    hora: '18:00',
    preco: '14.000 Kz',
    duracao: '13h',
    embarque: 'Paragem Principal',
  },


    {
    id: 5,
    agencia: 'OLga Chaves',
    origem: 'Lubango',
    destino: 'Luanda',
    hora: '18:00',
    preco: '14.000 Kz',
    duracao: '13h',
    embarque: 'Paragem Principal',
  },
];

export default function Resultados() {
  const [viagemExpandida, setViagemExpandida] = useState<number | null>(null);
  const params = useLocalSearchParams<{ origem?: string; destino?: string; dataIda?: string }>();

  function toggleExpand(id: number) {
    setViagemExpandida(viagemExpandida === id ? null : id);
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>
        De {params.origem ?? 'origem'} para {params.destino ?? 'destino'} em{' '}
        {params.dataIda ?? 'data não definida'}
      </Text>

      {viagens.map((viagem) => (
        <TouchableOpacity
          key={viagem.id}
          style={styles.card}
          activeOpacity={0.9}
          onPress={() => toggleExpand(viagem.id)}
        >
          {/* Parte principal do card */}
          <View style={styles.row}>
            <View>
              <Text style={styles.agencia}>{viagem.agencia}</Text>
              <Text>{viagem.hora}</Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.preco}>{viagem.preco}</Text>
            </View>
          </View>

          {/* Parte expandida */}
          {viagemExpandida === viagem.id && (
            <View style={styles.expanded}>
              <Text>🚌 Embarque: {viagem.embarque}</Text>
              <Text>⏱ Duração: {viagem.duracao}</Text>

              <TouchableOpacity
  style={styles.button}
  onPress={() =>
    router.push({
      pathname: '/reserva',
      params: {
        agencia: viagem.agencia,
        origem: viagem.origem,
        destino: viagem.destino,
        data: params.dataIda ?? '',
        hora: viagem.hora,
        preco: viagem.preco,
        duracao: viagem.duracao,
        embarque: viagem.embarque,
      },
    })
  }
>
  <Text style={styles.buttonText}>Reservar</Text>
</TouchableOpacity>

            </View>
          )}
        </TouchableOpacity>
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
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
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
  preco: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e90ff',
  },
  expanded: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  button: {
    marginTop: 12,
    backgroundColor: '#1e90ff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

  