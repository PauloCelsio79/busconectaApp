import { getToken } from '@/lib/auth-storage';
import { API_BASE_URL } from '@/lib/config';
import type { ApiEnvelope } from '@/lib/types/api';

export class ApiError extends Error {
  status?: number;
  errors?: Record<string, string[]> | null;

  constructor(
    message: string,
    status?: number,
    errors?: Record<string, string[]> | null
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

type RequestOptions = RequestInit & {
  auth?: boolean;
};

async function parseJsonSafe(res: Response): Promise<ApiEnvelope<unknown> | null> {
  try {
    return (await res.json()) as ApiEnvelope<unknown>;
  } catch {
    return null;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { auth = true, headers: customHeaders, ...init } = options;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  if (auth) {
    const token = await getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  let res: Response;
  try {
    res = await fetch(url, { ...init, headers });
  } catch {
    throw new ApiError(
      'Não foi possível ligar ao servidor. Verifique a API e a ligação de rede.'
    );
  }

  const body = await parseJsonSafe(res);

  if (!body) {
    if (!res.ok) {
      throw new ApiError(`Erro ${res.status} na comunicação com o servidor.`, res.status);
    }
    return undefined as T;
  }

  if (!res.ok || body.success === false) {
    throw new ApiError(
      body.message ?? `Erro ${res.status} na comunicação com o servidor.`,
      res.status,
      body.errors ?? null
    );
  }

  return body.data as T;
}
