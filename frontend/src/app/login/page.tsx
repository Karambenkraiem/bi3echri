'use client';

import { FormEvent, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth, isApiError } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UserIcon, LockIcon } from '@/components/ui/icons';

const DEMO_ACCOUNTS = [
  { label: 'Admin (démo)', email: 'admin@bi3echri.local', password: 'admin123' },
  { label: 'Vendeur (démo)', email: 'demo.vendeur@bi3echri.local', password: 'demo123' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: demoMode } = useQuery({
    queryKey: ['settings', 'demo-mode'],
    queryFn: () => api.get<{ enabled: boolean }>('/settings/demo-mode'),
  });

  async function doLogin(loginEmail: string, loginPassword: string) {
    setError(null);
    setSubmitting(true);
    try {
      await login(loginEmail, loginPassword);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Connexion impossible');
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    doLogin(email, password);
  }

  return (
    <div className="flex min-h-[85vh] items-center justify-center">
      <div className="w-full max-w-sm px-4">
        <div className="mb-6 flex flex-col items-center animate-fade-in-up">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 shadow-lg shadow-blue-600/25">
            <UserIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-4 bg-gradient-to-r from-blue-600 via-violet-600 to-emerald-500 bg-clip-text text-2xl font-bold text-transparent">
            Bi3Echri
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gestion achat / vente / stock
          </p>
        </div>

        <Card className="animate-fade-in-up">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-lg border border-slate-300 bg-white/70 px-3 py-2.5 transition-colors focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/30 dark:border-slate-700 dark:bg-slate-900/70 dark:focus-within:border-blue-400 dark:focus-within:ring-blue-400/20">
              <UserIcon className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                type="email"
                autoComplete="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
              />
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-slate-300 bg-white/70 px-3 py-2.5 transition-colors focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/30 dark:border-slate-700 dark:bg-slate-900/70 dark:focus-within:border-blue-400 dark:focus-within:ring-blue-400/20">
              <LockIcon className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                type="password"
                autoComplete="current-password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-900"
                />
                Se souvenir de moi
              </label>
              <span className="cursor-not-allowed" title="Bientôt disponible">
                Mot de passe oublié ?
              </span>
            </div>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>
        </Card>

        {demoMode?.enabled && (
          <Card className="mt-4 animate-fade-in-up">
            <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Accès rapide — démonstration
            </p>
            <div className="flex flex-col gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  disabled={submitting}
                  onClick={() => doLogin(account.email, account.password)}
                  className="rounded-lg border border-slate-300 bg-white/70 px-3 py-2 text-sm text-slate-700 transition-colors hover:border-blue-400 hover:bg-blue-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-blue-500/60 dark:hover:bg-slate-800"
                >
                  {account.label}
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
