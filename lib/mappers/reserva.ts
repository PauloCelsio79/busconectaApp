import type { ApiAssento, ApiReserva, ApiViagem } from '@/lib/types/api';
import { mapApiViagemToViagem } from '@/lib/mappers/viagem';
import { isoToDdmm, formatHora } from '@/lib/utils/date';
import { formatPrecoKz, parsePreco } from '@/lib/utils/format';
import { assentoNumero } from '@/lib/mappers/viagem';

export type ReservaStatusApp = 'ativa' | 'cancelada' | 'remarcada';

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
  status: ReservaStatusApp;
  criadaEm: string;
  estadoApi: string;
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
