'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useClientAuth, isApiError } from '@/lib/client-auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, FieldLabel } from '@/components/ui/input';
import { UserIcon } from '@/components/ui/icons';

export default function ConnexionPage() {
  return (
    <Suspense fallback={null}>
      <ConnexionForm />
    </Suspense>
  );
}

function ConnexionForm() {
  const { login } = useClientAuth();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? undefined;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password, next);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Connexion impossible');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 shadow-lg shadow-violet-600/25">
            <UserIcon className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-3 text-xl font-bold text-slate-900 dark:text-white">Mon compte</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Suivez vos réservations et vos achats.
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>
        </Card>

        <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
          Pas encore de compte ?{' '}
          <Link
            href={next ? `/compte/inscription?next=${encodeURIComponent(next)}` : '/compte/inscription'}
            className="font-medium text-violet-600 hover:underline dark:text-violet-400"
          >
            Inscrivez-vous
          </Link>
        </p>
      </div>
    </div>
  );
}
