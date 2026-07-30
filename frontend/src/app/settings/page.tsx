'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';

function SettingsContent() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['settings', 'demo-mode'],
    queryFn: () => api.get<{ enabled: boolean }>('/settings/demo-mode'),
  });

  const mutation = useMutation({
    mutationFn: (enabled: boolean) => api.patch<{ enabled: boolean }>('/settings/demo-mode', { enabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings', 'demo-mode'] }),
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Réglages</h1>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Mode démonstration
            </h2>
            <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
              Quand activé, la page de connexion affiche une liste d&apos;accès rapide à des
              comptes de démonstration (Admin / Vendeur). Désactivé par défaut à chaque nouvelle
              installation.
            </p>
          </div>
          <button
            role="switch"
            aria-checked={!!data?.enabled}
            disabled={isLoading || mutation.isPending}
            onClick={() => mutation.mutate(!data?.enabled)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
              data?.enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                data?.enabled ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute roles={['ADMIN']}>
      <SettingsContent />
    </ProtectedRoute>
  );
}
