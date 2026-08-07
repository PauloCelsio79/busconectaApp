import { apiRequest } from '@/lib/api/client';
import type { ApiReserva, CreateReservaPayload } from '@/lib/types/api';

function normalizeList<T>(data: T[] | { data?: T[] } | null | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) return data.data;
  return [];
}

export async function listarReservas(): Promise<ApiReserva[]> {
  const data = await apiRequest<ApiReserva[] | { items?: ApiReserva[] }>('/app/reservas');
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  return [];
}

export async function criarReserva(payload: CreateReservaPayload): Promise<ApiReserva> {
  return apiRequest<ApiReserva>('/app/reservas', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function confirmarPagamento(
  reservaId: number,
  referencia?: string
): Promise<ApiReserva> {
  return apiRequest<ApiReserva>(`/app/reservas/${reservaId}/confirmar-pagamento`, {
    method: 'POST',
    body: JSON.stringify(
      referencia ? { referencia_pagamento: referencia } : {}
    ),
  });
}

export async function cancelarReserva(reservaId: number): Promise<ApiReserva> {
  return apiRequest<ApiReserva>(`/app/reservas/${reservaId}/cancelar`, {
    method: 'POST',
  });
}
