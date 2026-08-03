'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useClientAuth } from '@/lib/client-auth-context';
import { setToken } from '@/lib/api';

function AutoLoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshClient } = useClientAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      router.replace('/');
      return;
    }
    // Retire le token de la barre d'adresse dès que possible.
    window.history.replaceState({}, '', '/auto-login');
    setToken(token);
    refreshClient().then(() => router.replace('/'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <p className="text-sm text-slate-500">Connexion en cours...</p>
    </div>
  );
}

export default function AutoLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm text-slate-500">Chargement...</p>
        </div>
      }
    >
      <AutoLoginContent />
    </Suspense>
  );
}
