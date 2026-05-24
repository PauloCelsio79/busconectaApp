import { apiRequest } from '@/lib/api/client';
import type { ApiAssento, ApiViagem } from '@/lib/types/api';

export interface PesquisarViagensParams {
  origem: string;
  destino: string;
  data: string;
}

function normalizeList<T>(data: T[] | { data?: T[] } | null | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) return data.data;
  return [];
}

export async function pesquisarViagens(
  params: PesquisarViagensParams
): Promise<ApiViagem[]> {
  const qs = new URLSearchParams({
    origem: params.origem,
    destino: params.destino,
    data: params.data,
  });
  const data = await apiRequest<ApiViagem[] | { data?: ApiViagem[] }>(
    `/viagens/pesquisar?${qs.toString()}`,
    { auth: false }
  );
  return normalizeList(data);
}

export async function obterViagem(id: number): Promise<ApiViagem> {
  return apiRequest<ApiViagem>(`/viagens/${id}`, { auth: false });
}

export async function obterAssentos(viagemId: number): Promise<ApiAssento[]> {
  const data = await apiRequest<ApiAssento[] | { data?: ApiAssento[] }>(
    `/viagens/${viagemId}/assentos`,
    { auth: false }
  );
  return normalizeList(data);
}
