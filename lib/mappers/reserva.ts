import type {
  ApiAssento,
  ApiReserva,
  ApiReservaAssentoLinha,
  ApiViagem,
} from '@/lib/types/api';
import { mapApiViagemToViagem } from '@/lib/mappers/viagem';
import { isoToDdmm, formatHora } from '@/lib/utils/date';
import { formatPrecoKz, parsePreco } from '@/lib/utils/format';
import { assentoNumero } from '@/lib/mappers/viagem';

export type ReservaStatusApp = 'ativa' | 'cancelada' | 'remarcada';

export interface PassageiroBilhete {
  nome: string;
  assento?: number;
}

export interface ReservaApp {
  id: string;
  codigo?: string;
  viagemId?: number;
  agencia: string;
  origem: string;
  destino: string;
  data: string;
  hora: string;
  horaChegada: string;
  preco: string;
  duracao: string;
  embarque: string;
  desembarque: string;
  assentos: number[];
  assentoIds: number[];
  passageiros: PassageiroBilhete[];
  status: ReservaStatusApp;
  criadaEm: string;
  estadoApi: string;
}

function isLinhaAssento(a: ApiAssento | ApiReservaAssentoLinha): a is ApiReservaAssentoLinha {
  return 'nome_passageiro' in a || ('numero' in a && !('ocupado' in a));
}

function extrairAssentos(reserva: ApiReserva): { numeros: number[]; ids: number[] } {
  const numeros: number[] = [];
  const ids: number[] = [];

  const lista =
    reserva.assentos ??
    reserva.reserva_assentos?.map((ra) => ra.assento).filter(Boolean) as ApiAssento[];

  for (const a of lista ?? []) {
    if (!a) continue;
    ids.push(a.id);
    const n = assentoNumero(a);
    if (n) numeros.push(n);
  }

  return { numeros, ids };
}

function extrairPassageiros(reserva: ApiReserva, numerosAssentos: number[]): PassageiroBilhete[] {
  const lista = reserva.assentos ?? [];
  const porAssento: PassageiroBilhete[] = [];

  for (let i = 0; i < lista.length; i += 1) {
    const a = lista[i];
    if (!a || !isLinhaAssento(a)) continue;
    const nome = a.nome_passageiro?.trim();
    if (!nome) continue;
    const numero = assentoNumero(a);
    porAssento.push({
      nome,
      assento: numero || numerosAssentos[i],
    });
  }

  if (porAssento.length > 0) return porAssento;

  const titular = reserva.passageiro?.nome?.trim();
  if (titular) {
    return [{ nome: titular, assento: numerosAssentos[0] }];
  }

  return [];
}

/** Texto codificado no QR do bilhete (código + passageiros + assentos). */
export function buildBilheteQrPayload(reserva: ReservaApp): string {
  const linhas = [
    reserva.codigo ? `TICKET-${reserva.codigo}` : `TICKET-${reserva.id}`,
  ];

  if (reserva.passageiros.length > 0) {
    linhas.push('Passageiros:');
    for (const p of reserva.passageiros) {
      linhas.push(p.assento ? `${p.nome} (assento ${p.assento})` : p.nome);
    }
  }

  if (reserva.assentos.length > 0) {
    linhas.push(`Assentos: ${reserva.assentos.join(', ')}`);
  }

  return linhas.join('\n');
}

function mapEstado(estado?: string): ReservaStatusApp {
  const e = estado?.toLowerCase();
  if (e === 'cancelada') return 'cancelada';
  if (e === 'remarcada') return 'remarcada';
  return 'ativa';
}

export function mapApiReservaToApp(reserva: ApiReserva): ReservaApp {
  const viagemRaw: ApiViagem | null =
    reserva.viagem ??
    (reserva.viagem_id
      ? ({ id: reserva.viagem_id } as ApiViagem)
      : null);

  const viagemUi = viagemRaw?.rota ? mapApiViagemToViagem(viagemRaw) : null;
  const { numeros, ids } = extrairAssentos(reserva);
  const passageiros = extrairPassageiros(reserva, numeros);

  const valor = parsePreco(reserva.valor_total ?? viagemUi?.preco ?? 0);

  return {
    id: String(reserva.id),
    codigo: reserva.codigo_reserva,
    viagemId: reserva.viagem_id ?? viagemRaw?.id,
    agencia: viagemUi?.agencia ?? 'Operador',
    origem: viagemUi?.origem ?? '',
    destino: viagemUi?.destino ?? '',
    data: isoToDdmm(viagemRaw?.data_partida) || '',
    hora: formatHora(viagemRaw?.hora_partida) || viagemUi?.horaPartida || '—',
    horaChegada: formatHora(viagemRaw?.hora_chegada) || viagemUi?.horaChegada || '—',
    preco: formatPrecoKz(valor),
    duracao: viagemUi?.duracao ?? '—',
    embarque: viagemUi?.embarque ?? '',
    desembarque: viagemUi?.desembarque ?? '',
    assentos: numeros,
    assentoIds: ids,
    passageiros,
    status: mapEstado(reserva.estado),
    criadaEm: reserva.data_reserva ?? new Date().toISOString(),
    estadoApi: reserva.estado ?? 'pendente',
  };
}

export function mapApiReservasToApp(lista: ApiReserva[]): ReservaApp[] {
  return lista.map(mapApiReservaToApp);
}

/** Bilhetes activos: confirmada ou pendente (não cancelada). */
export function isBilheteAtivo(reserva: ReservaApp): boolean {
  return reserva.status === 'ativa' && reserva.estadoApi !== 'cancelada';
}
