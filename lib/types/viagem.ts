import type { TerminalMapCoords } from '@/components/ui/terminal-map-slot';

export type Amenidades = {
  tomada: boolean;
  wifi: boolean;
  arCondicionado: boolean;
  entretenimento: boolean;
};

export type Viagem = {
  id: number;
  agencia: string;
  origem: string;
  destino: string;
  horaPartida: string;
  horaChegada: string;
  preco: number;
  duracao: string;
  embarque: string;
  embarqueEndereco: string;
  desembarque: string;
  desembarqueEndereco: string;
  lugaresRestantes: number;
  amenities: Amenidades;
  logoCor: string;
  logoIniciais: string;
  embarqueCoords?: TerminalMapCoords;
  desembarqueCoords?: TerminalMapCoords;
};
