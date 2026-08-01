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
import { Client } from './types';

interface RegisterInput {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

interface ClientAuthContextValue {
  client: Client | null;
  loading: boolean;
  login: (email: string, password: string, redirectTo?: string) => Promise<void>;
  register: (input: RegisterInput, redirectTo?: string) => Promise<void>;
  logout: () => void;
  refreshClient: () => Promise<void>;
}

const BACKOFFICE_URL = process.env.NEXT_PUBLIC_BACKOFFICE_URL ?? 'http://localhost:3000';

const ClientAuthContext = createContext<ClientAuthContextValue | undefined>(undefined);

export function ClientAuthProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadClient = useCallback(async () => {
    try {
      const me = await api.get<Client>('/public/clients/me');
      setClient(me);
    } catch {
      setClient(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const hasToken = typeof window !== 'undefined' && localStorage.getItem('bi3echri_client_token');
    if (hasToken) {
      loadClient();
    } else {
      setLoading(false);
    }
  }, [loadClient]);

  const login = useCallback(
    async (email: string, password: string, redirectTo?: string) => {
      try {
        const result = await api.post<{ accessToken: string; client: Client }>(
          '/public/clients/login',
          { email, password },
        );
        setToken(result.accessToken);
        setClient(result.client);
        router.push(redirectTo && redirectTo.startsWith('/') ? redirectTo : '/compte');
      } catch (clientErr) {
        // Peut-être un compte staff (vendeur/admin) : on tente la connexion back
        // office et, si elle réussit, on redirige directement vers le back office
        // déjà connecté avec ce compte, plutôt que d'afficher une erreur.
        try {
          const staffResult = await api.post<{ accessToken: string }>('/auth/login', {
            email,
            password,
          });
          window.location.href = `${BACKOFFICE_URL}/auto-login?token=${encodeURIComponent(staffResult.accessToken)}`;
          return;
        } catch {
          throw clientErr;
        }
      }
    },
    [router],
  );

  const refreshClient = useCallback(async () => {
    await loadClient();
  }, [loadClient]);

  const register = useCallback(
    async (input: RegisterInput, redirectTo?: string) => {
      const result = await api.post<{ accessToken: string; client: Client }>(
        '/public/clients/register',
        input,
      );
      setToken(result.accessToken);
      setClient(result.client);
      router.push(redirectTo && redirectTo.startsWith('/') ? redirectTo : '/compte');
    },
    [router],
  );

  const logout = useCallback(() => {
    setToken(null);
    setClient(null);
    router.push('/');
  }, [router]);

  return (
    <ClientAuthContext.Provider
      value={{ client, loading, login, register, logout, refreshClient }}
    >
      {children}
    </ClientAuthContext.Provider>
  );
}

export function useClientAuth() {
  const ctx = useContext(ClientAuthContext);
  if (!ctx) {
    throw new Error('useClientAuth must be used within ClientAuthProvider');
  }
  return ctx;
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}
