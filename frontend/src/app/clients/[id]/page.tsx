'use client';

import { use, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { api, getAssetUrl } from '@/lib/api';
import { Client, Order, OrderStatus, OrderType } from '@/lib/types';
import { formatDT } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { PhoneIcon, MailIcon, BellIcon, BoxIcon, EyeIcon } from '@/components/ui/icons';

const STOREFRONT_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? 'http://localhost:3002';

const STATUS_LABELS: Record<OrderStatus, string> = {
  EN_ATTENTE: 'En attente',
  CONFIRMEE: 'Confirmée',
  ANNULEE: 'Annulée',
  VENDU: 'Vendu',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  EN_ATTENTE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  CONFIRMEE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  ANNULEE: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  VENDU: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
};

const TYPE_LABELS: Record<OrderType, string> = {
  RESERVATION: 'Réservation',
  ACHAT: 'Achat',
  NEGOCIATION: 'Négociation',
};

function ClientDetailContent({ id }: { id: string }) {
  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ['clients', id],
    queryFn: () => api.get<Client>(`/clients/${id}`),
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', { clientId: id }],
    queryFn: () => api.get<Order[]>(`/orders?clientId=${id}`),
  });

  const [impersonateError, setImpersonateError] = useState<string | null>(null);
  const impersonateMutation = useMutation({
    mutationFn: () => api.post<{ accessToken: string }>(`/clients/${id}/impersonate`),
    onSuccess: ({ accessToken }) => {
      window.open(`${STOREFRONT_URL}/auto-login?token=${encodeURIComponent(accessToken)}`, '_blank');
    },
    onError: (err: unknown) => {
      setImpersonateError(err instanceof Error ? err.message : 'Erreur');
    },
  });

  const interestedArticles = useMemo(() => {
    if (!orders) return [];
    const map = new Map<
      string,
      { article: Order['article']; count: number; lastCreatedAt: string; lastType: OrderType }
    >();
    for (const order of orders) {
      const existing = map.get(order.article.id);
      if (existing) {
        existing.count += 1;
        if (order.createdAt > existing.lastCreatedAt) {
          existing.lastCreatedAt = order.createdAt;
          existing.lastType = order.type;
        }
      } else {
        map.set(order.article.id, {
          article: order.article,
          count: 1,
          lastCreatedAt: order.createdAt,
          lastType: order.type,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.lastCreatedAt < b.lastCreatedAt ? 1 : -1,
    );
  }, [orders]);

  if (clientLoading) {
    return <p className="text-sm text-slate-500">Chargement...</p>;
  }

  if (!client) {
    return <p className="text-sm text-slate-500">Client introuvable.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/clients" className="text-sm text-slate-500 hover:underline">
          ← Retour aux clients
        </Link>
      </div>

      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {client.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getAssetUrl(client.avatarUrl)}
              alt={client.name}
              className="h-16 w-16 rounded-full object-cover ring-4 ring-blue-500/10 dark:ring-blue-400/10"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-xl font-semibold text-white ring-4 ring-blue-500/10 dark:ring-blue-400/10">
              {client.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{client.name}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {client.email || '—'} · {client.phone || '—'}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Inscrit le {new Date(client.createdAt).toLocaleDateString('fr-FR')} ·{' '}
              <span className="font-medium text-slate-500 dark:text-slate-300">
                {client._count?.orders ?? 0} commande{(client._count?.orders ?? 0) > 1 ? 's' : ''}
              </span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {client.phone && (
            <a
              href={`tel:${client.phone}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-200 dark:hover:border-emerald-800 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-300"
            >
              <PhoneIcon className="h-4 w-4" />
              Appeler
            </a>
          )}
          {client.email && (
            <a
              href={`mailto:${client.email}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:text-slate-200 dark:hover:border-blue-800 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
            >
              <MailIcon className="h-4 w-4" />
              Email
            </a>
          )}
          <a
            href="#commandes"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm shadow-blue-600/20 transition-all hover:from-blue-500 hover:to-violet-500"
          >
            <BellIcon className="h-4 w-4" />
            Voir les commandes
          </a>
          <button
            type="button"
            onClick={() => impersonateMutation.mutate()}
            disabled={impersonateMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-violet-800 dark:hover:bg-violet-900/20 dark:hover:text-violet-300"
          >
            <EyeIcon className="h-4 w-4" />
            {impersonateMutation.isPending ? 'Connexion...' : 'Voir le site comme ce client'}
          </button>
        </div>
      </Card>
      {impersonateError && <p className="text-sm text-red-600">{impersonateError}</p>}

      <h2 id="commandes" className="text-sm font-semibold text-slate-900 dark:text-white">
        Réservations et achats
      </h2>

      <Card className="overflow-x-auto p-0">
        {ordersLoading ? (
          <p className="p-4 text-sm text-slate-500">Chargement...</p>
        ) : !orders || orders.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">Aucune commande pour ce client.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Article</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Qté</th>
                <th className="px-4 py-3">Prix affiché</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {new Date(order.createdAt).toLocaleString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {order.article.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {TYPE_LABELS[order.type]}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {order.quantity}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {order.article.expectedSalePrice != null
                      ? formatDT(Number(order.article.expectedSalePrice))
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status]}`}
                    >
                      {STATUS_LABELS[order.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <p className="text-xs text-slate-400">
        Pour confirmer, annuler ou discuter d&apos;une commande, retrouvez-la dans{' '}
        <Link href="/commandes" className="text-violet-600 hover:underline dark:text-violet-400">
          Commandes
        </Link>
        .
      </p>

      {interestedArticles.length > 0 && (
        <>
          <h2 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
            Articles qui l&apos;intéressent
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {interestedArticles.map(({ article, count, lastType }) => {
              const photo = article.photos?.[0];
              return (
                <Link
                  key={article.id}
                  href={`/articles/${article.id}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800/70 dark:bg-slate-900/80"
                >
                  <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getAssetUrl(photo.url)}
                        alt={article.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-600">
                        <BoxIcon className="h-8 w-8" />
                      </div>
                    )}
                    {count > 1 && (
                      <span className="absolute right-1.5 top-1.5 rounded-full bg-slate-900/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        ×{count}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5 p-2.5">
                    <p className="line-clamp-2 text-xs font-medium text-slate-900 dark:text-white">
                      {article.name}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-1">
                      <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                        {article.expectedSalePrice != null
                          ? formatDT(Number(article.expectedSalePrice))
                          : '—'}
                      </span>
                      <span className="text-[10px] text-slate-400">{TYPE_LABELS[lastType]}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ProtectedRoute>
      <ClientDetailContent id={id} />
    </ProtectedRoute>
  );
}
