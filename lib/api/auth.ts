import { apiRequest } from '@/lib/api/client';
import { clearToken, getToken, setToken } from '@/lib/auth-storage';
import type { ApiUser, AuthPayload } from '@/lib/types/api';

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  nome: string;
  email: string;
  password: string;
  password_confirmation: string;
  telefone: string;
  bi: string;
}

function normalizeAuthPayload(data: AuthPayload | (AuthPayload & { access_token?: string })): AuthPayload {
  const token = data.token ?? (data as { access_token?: string }).access_token;
  if (!token || !data.user) {
    throw new Error('Resposta de autenticação inválida.');
  }
  return { token, user: data.user };
}

export async function login(input: LoginInput): Promise<ApiUser> {
  const data = await apiRequest<AuthPayload>('/auth/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify(input),
  });
  const { token, user } = normalizeAuthPayload(data);
  await setToken(token);
  return user;
}

export async function register(input: RegisterInput): Promise<void> {
  const data = await apiRequest<AuthPayload>('/auth/register', {
    method: 'POST',
    auth: false,
    body: JSON.stringify(input),
  });
  normalizeAuthPayload(data);
}

export async function logout(): Promise<void> {
  const token = await getToken();
  if (token) {
    try {
      await apiRequest<null>('/auth/logout', { method: 'POST' });
    } catch {
      // Sessão expirada ou API indisponível — limpar credenciais localmente na mesma.
    }
  }
  await clearToken();
}

export async function fetchMe(): Promise<ApiUser> {
  return apiRequest<ApiUser>('/auth/me');
}
