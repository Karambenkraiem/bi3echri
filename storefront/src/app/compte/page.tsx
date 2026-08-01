'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useClientAuth } from '@/lib/client-auth-context';
import { api, getAssetUrl } from '@/lib/api';
import { MyOrder, OrderStatus, OrderType } from '@/lib/types';
import { formatDT } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BoxIcon } from '@/components/ui/icons';

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

export default function ComptePage() {
  const { client, loading, logout } = useClientAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !client) {
      router.replace('/compte/connexion');
    }
  }, [loading, client, router]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['public', 'my-orders'],
    queryFn: () => api.get<MyOrder[]>('/public/clients/me/orders'),
    enabled: !!client,
  });

  if (loading || !client) {
    return <p className="text-sm text-slate-500">Chargement...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {client.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getAssetUrl(client.avatarUrl)}
              alt={client.name}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-lg font-semibold text-white">
              {client.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Bonjour {client.name}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{client.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/compte/profil">
            <Button variant="secondary">Modifier mon profil</Button>
          </Link>
          <Button variant="secondary" onClick={logout}>
            Déconnexion
          </Button>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
        Mes réservations et achats
      </h2>

      {isLoading ? (
        <p className="text-sm text-slate-500">Chargement...</p>
      ) : !orders || orders.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">Vous n&apos;avez aucune demande pour le moment.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => {
            const photo = order.article.photos[0];
            return (
              <Link key={order.id} href={`/suivi/${order.id}`}>
                <Card className="flex items-center gap-4 transition-shadow hover:shadow-md">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={getAssetUrl(photo.url)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <BoxIcon className="h-6 w-6 text-slate-300" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900 dark:text-white">
                      {order.article.name}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {TYPE_LABELS[order.type]} · Qté {order.quantity} ·{' '}
                      {formatDT(order.article.price)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[order.status]}`}
                  >
                    {STATUS_LABELS[order.status]}
                  </span>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
