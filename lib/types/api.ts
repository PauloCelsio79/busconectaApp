export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]> | null;
}

export type UserTipo = 'admin' | 'empresa' | 'passageiro';

export interface ApiUser {
  id: number;
  nome: string;
  email: string;
  telefone?: string | null;
  tipo: UserTipo;
  ativo?: boolean;
}

export interface AuthPayload {
  token: string;
  user: ApiUser;
}

export interface ApiEmpresa {
  id?: number;
  nome_empresa?: string;
  nome_comercial?: string;
}

export interface ApiParagem {
  id?: number;
  nome?: string;
  ordem?: number;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

export interface ApiRota {
  id?: number;
  origem?: string;
  destino?: string;
  distancia_km?: number;
  tempo_estimado?: string;
  paragens?: ApiParagem[];
}

export interface ApiViagem {
  id: number;
  empresa_id?: number;
  rota_id?: number;
  autocarro_id?: number;
  data_partida?: string;
  hora_partida?: string;
  data_chegada?: string;
  hora_chegada?: string;
  preco?: number | string;
  lugares_disponiveis?: number;
  estado?: string;
  empresa?: ApiEmpresa | null;
  rota?: ApiRota | null;
  /** Campos planos (algumas respostas da API) */
  origem?: string;
  destino?: string;
  empresa_nome?: string;
}

export interface ApiAssento {
  id: number;
  numero: number | string;
  tipo?: string;
  ocupado?: boolean;
  disponivel?: boolean;
  estado?: string;
}

export interface ApiReserva {
  id: number;
  codigo_reserva?: string;
  viagem_id?: number;
  valor_total?: number | string;
  estado?: string;
  data_reserva?: string;
  metodo_pagamento?: string;
  referencia_pagamento?: string;
  viagem?: ApiViagem | null;
  assentos?: ApiAssento[];
  reserva_assentos?: { assento?: ApiAssento; assento_id?: number }[];
}

export interface CreateReservaPayload {
  viagem_id: number;
  assento_ids: number[];
  metodo_pagamento: 'multicaixa' | 'transferencia' | 'cartao';
  referencia_pagamento?: string;
}
