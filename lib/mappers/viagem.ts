import type { ApiAssento, ApiParagem, ApiViagem } from '@/lib/types/api';
import type { Viagem } from '@/lib/types/viagem';
import { formatHora } from '@/lib/utils/date';
import { parsePreco } from '@/lib/utils/format';

const LOGO_COLORS = [
  '#1E5FA8',
  '#C6082A',
  '#7B3F9E',
  '#2F9D45',
  '#D97706',
  '#0D6E6E',
  '#5B21B6',
  '#B45309',
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function iniciais(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function ordenarParagens(paragens?: ApiParagem[]): ApiParagem[] {
  if (!paragens?.length) return [];
  return [...paragens].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
}

function paragemCoords(p?: ApiParagem) {
  const lat = p?.latitude != null ? Number(p.latitude) : NaN;
  const lng = p?.longitude != null ? Number(p.longitude) : NaN;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  return { latitude: lat, longitude: lng };
}

function formatarDuracaoMinutos(mins: number): string {
  const horas = Math.floor(mins / 60);
  const resto = mins % 60;
  if (horas && resto) return `${horas}h${resto}min`;
  if (horas) return `${horas}h`;
  return `${resto}min`;
}

function calcularDuracao(
  horaPartida?: string,
  horaChegada?: string,
  tempoEstimado?: number | string
): string {
  if (tempoEstimado != null) {
    const estimado =
      typeof tempoEstimado === 'number'
        ? tempoEstimado
        : parseInt(tempoEstimado.trim(), 10);
    if (Number.isFinite(estimado) && estimado > 0) {
      return formatarDuracaoMinutos(estimado);
    }
  }

  if (!horaPartida || !horaChegada) return '—';

  const [h1, m1] = horaPartida.split(':').map(Number);
  const [h2, m2] = horaChegada.split(':').map(Number);
  let mins = (h2 ?? 0) * 60 + (m2 ?? 0) - ((h1 ?? 0) * 60 + (m1 ?? 0));
  if (mins < 0) mins += 24 * 60;

  return formatarDuracaoMinutos(mins);
}

export function mapApiViagemToViagem(raw: ApiViagem): Viagem {
  const rota = raw.rota ?? {};
  const empresa = raw.empresa ?? {};
  const paragens = ordenarParagens(rota.paragens);

  const agencia =
    empresa.nome_comercial ??
    empresa.nome ??
    empresa.nome_empresa ??
    raw.empresa_nome ??
    'Operador';

  const origem = rota.origem ?? raw.origem ?? '';
  const destino = rota.destino ?? raw.destino ?? '';

  const primeira = paragens[0];
  const ultima = paragens[paragens.length - 1];

  const embarque = primeira?.nome ?? origem;
  const desembarque = ultima?.nome ?? destino;

  const preco = parsePreco(raw.preco ?? 0);
  const colorIndex = hashString(agencia) % LOGO_COLORS.length;

  return {
    id: raw.id,
    agencia,
    origem,
    destino,
    horaPartida: formatHora(raw.hora_partida),
    horaChegada: formatHora(raw.hora_chegada),
    preco,
    duracao: calcularDuracao(raw.hora_partida, raw.hora_chegada, rota.tempo_estimado),
    embarque,
    embarqueEndereco: embarque,
    desembarque,
    desembarqueEndereco: desembarque,
    lugaresRestantes: raw.lugares_disponiveis ?? 0,
    amenities: {
      tomada: true,
      wifi: true,
      arCondicionado: true,
      entretenimento: false,
    },
    logoCor: LOGO_COLORS[colorIndex],
    logoIniciais: iniciais(agencia),
    embarqueCoords: paragemCoords(primeira),
    desembarqueCoords: paragemCoords(ultima),
  };
}

export function mapApiViagensToViagens(lista: ApiViagem[]): Viagem[] {
  console.log('[mapApiViagensToViagens] mapear', lista.length, 'viagem(ns)');
  return lista.map(mapApiViagemToViagem);
}

export function assentoOcupado(assento: ApiAssento): boolean {
  if (assento.ocupado === true) return true;
  if (assento.disponivel === false) return true;
  const estado = assento.estado?.toLowerCase();
  return estado === 'ocupado' || estado === 'reservado' || estado === 'indisponivel';
}

export function assentoNumero(assento: ApiAssento): number {
  return typeof assento.numero === 'number'
    ? assento.numero
    : parseInt(String(assento.numero), 10) || 0;
}
