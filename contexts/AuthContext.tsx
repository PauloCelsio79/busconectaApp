import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { ApiError } from '@/lib/api/client';
import * as authApi from '@/lib/api/auth';
import { getToken, clearToken } from '@/lib/auth-storage';
import type { ApiUser } from '@/lib/types/api';

interface AuthContextValue {
  user: ApiUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: authApi.RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setUser(null);
      return;
    }
    const me = await authApi.fetchMe();
    setUser(me);
  }, []);

  useEffect(() => {
    async function bootstrap() {
      try {
        await refreshUser();
      } catch {
        await clearToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    void bootstrap();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const logged = await authApi.login({ email: email.trim(), password });
    if (logged.tipo !== 'passageiro') {
      await authApi.logout();
      throw new ApiError('Esta conta não é de passageiro. Use a app apenas com conta de passageiro.');
    }
    setUser(logged);
  }, []);

  const register = useCallback(async (input: authApi.RegisterInput) => {
    await authApi.register(input);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return ctx;
}
