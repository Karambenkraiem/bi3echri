'use client';

import { useQuery } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { api } from '@/lib/api';
import { VisitsPoint } from '@/lib/types';
import { VisitsChart } from '@/components/dashboard/visits-chart';

function AudienceContent() {
  const { data: daily, isLoading: loadingDaily } = useQuery({
    queryKey: ['analytics', 'visits-daily'],
    queryFn: () => api.get<VisitsPoint[]>('/analytics/visits-daily'),
  });
  const { data: weekly, isLoading: loadingWeekly } = useQuery({
    queryKey: ['analytics', 'visits-weekly'],
    queryFn: () => api.get<VisitsPoint[]>('/analytics/visits-weekly'),
  });
  const { data: monthly, isLoading: loadingMonthly } = useQuery({
    queryKey: ['analytics', 'visits-monthly'],
    queryFn: () => api.get<VisitsPoint[]>('/analytics/visits-monthly'),
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Audience</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Nombre de visites du site (bi3wechri.net) pour évaluer la portée de la boutique en
          ligne, une visite = un visiteur unique par jour/semaine/mois selon le graphique.
        </p>
      </div>

      {loadingDaily ? (
        <p className="text-sm text-slate-500">Chargement...</p>
      ) : (
        <VisitsChart title="Visites par jour" subtitle="30 derniers jours" data={daily ?? []} />
      )}
      {loadingWeekly ? (
        <p className="text-sm text-slate-500">Chargement...</p>
      ) : (
        <VisitsChart title="Visites par semaine" subtitle="12 dernières semaines" data={weekly ?? []} />
      )}
      {loadingMonthly ? (
        <p className="text-sm text-slate-500">Chargement...</p>
      ) : (
        <VisitsChart title="Visites par mois" subtitle="12 derniers mois" data={monthly ?? []} />
      )}
    </div>
  );
}

export default function AudiencePage() {
  return (
    <ProtectedRoute>
      <AudienceContent />
    </ProtectedRoute>
  );
}
