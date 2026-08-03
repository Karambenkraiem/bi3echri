'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { api, setToken, ApiError } from './api';
import { User } from './types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadUser = useCallback(async () => {
    try {
      const me = await api.get<User>('/auth/me');
      setUser(me);
    } catch {
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const hasToken = typeof window !== 'undefined' && localStorage.getItem('bi3echri_token');
    if (hasToken) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, [loadUser]);

  useEffect(() => {
    // Le token est partagé (localStorage) entre tous les onglets d'une même
    // origine : sans ceci, se connecter avec un autre compte dans un onglet
    // laisse les autres onglets afficher l'ancien utilisateur alors que leurs
    // requêtes s'authentifient déjà silencieusement avec le nouveau token.
    function handleStorage(e: StorageEvent) {
      if (e.key !== 'bi3echri_token') return;
      if (e.newValue) {
        loadUser();
      } else {
        setUser(null);
        setLoading(false);
        router.push('/login');
      }
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [loadUser, router]);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await api.post<{ accessToken: string; user: User }>('/auth/login', {
        email,
        password,
      });
      setToken(result.accessToken);
      setUser(result.user);
      router.push('/dashboard');
    },
    [router],
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}
