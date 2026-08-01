'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getAssetUrl } from '@/lib/api';
import { MyOrder, OrderStatus } from '@/lib/types';
import { formatDT } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChatThread } from '@/components/storefront/chat-thread';
import { BoxIcon, ClockIcon } from '@/components/ui/icons';

const TYPE_LABELS: Record<MyOrder['type'], string> = {
  RESERVATION: 'Réservation',
  ACHAT: 'Achat',
  NEGOCIATION: 'Négociation',
};

function formatDeadline(iso: string): string {
  return new Date(iso).toLocaleString('fr-TN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

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

export default function SuiviPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [decisionError, setDecisionError] = useState<string | null>(null);

  const { data: order, isLoading } = useQuery({
    queryKey: ['public', 'orders', id],
    queryFn: () => api.get<MyOrder>(`/public/orders/${id}`),
    retry: false,
  });

  const decisionMutation = useMutation({
    mutationFn: (decision: 'ACHETER' | 'ABANDONNER') =>
      api.post(`/public/orders/${id}/decision`, { decision }),
    onSuccess: () => {
      setDecisionError(null);
      queryClient.invalidateQueries({ queryKey: ['public', 'orders', id] });
    },
    onError: (err: unknown) =>
      setDecisionError(err instanceof Error ? err.message : 'Erreur'),
  });

  if (isLoading) {
    return <p className="text-sm text-slate-500">Chargement...</p>;
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-slate-500">Cette demande est introuvable.</p>
        <Link href="/produits" className="text-violet-600 hover:underline dark:text-violet-400">
          ← Retour au catalogue
        </Link>
      </div>
    );
  }

  const photo = order.article.photos[0];

  return (
    <div className="flex w-full flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Suivi de ma demande</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr] lg:items-start">
        {/* Colonne gauche : infos, prix et boutons */}
        <div className="flex flex-col gap-4">
          <Card className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={getAssetUrl(photo.url)} alt="" className="h-full w-full object-cover" />
              ) : (
                <BoxIcon className="h-7 w-7 text-slate-300" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-slate-900 dark:text-white">
                {order.article.name}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {TYPE_LABELS[order.type]} · Qté {order.quantity}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[order.status]}`}
            >
              {STATUS_LABELS[order.status]}
            </span>
          </Card>

          {order.status === 'CONFIRMEE' && order.agreedPrice != null ? (
            <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm dark:border-emerald-900/50 dark:bg-emerald-950/30">
              <span className="font-medium text-emerald-700 dark:text-emerald-300">
                Prix convenu avec le vendeur
              </span>
              <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                {formatDT(order.agreedPrice)}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm dark:border-violet-900/50 dark:bg-violet-950/30">
              <span className="font-medium text-violet-700 dark:text-violet-300">
                Prix demandé par le vendeur
              </span>
              <span className="text-lg font-bold text-violet-700 dark:text-violet-300">
                {formatDT(order.article.price)}
              </span>
            </div>
          )}

          {order.status === 'CONFIRMEE' && order.retraitDeadline && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm dark:border-emerald-900/50 dark:bg-emerald-950/30">
              <ClockIcon className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <p className="text-emerald-700 dark:text-emerald-300">
                <span className="font-medium">Achat confirmé — en attente de retrait.</span>{' '}
                Merci de passer récupérer l&apos;article avant le{' '}
                <span className="font-semibold">{formatDeadline(order.retraitDeadline)}</span>,
                sinon l&apos;article sera remis en vente.
              </p>
            </div>
          )}

          {order.status === 'VENDU' && (
            <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-violet-300">
              ✓ Merci ! Cet article vous a bien été remis.
            </div>
          )}

          {order.status === 'ANNULEE' && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              Cette demande a été annulée. Contactez le vendeur via le chat si vous souhaitez
              qu&apos;il vous redonne une nouvelle chance d&apos;acheter cet article.
            </div>
          )}

          {order.status === 'EN_ATTENTE' && (
            <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white/60 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/40">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Vous avez changé d&apos;avis ? Vous pouvez décider à tout moment :
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => decisionMutation.mutate('ACHETER')}
                  disabled={decisionMutation.isPending}
                  className="!bg-gradient-to-r !from-emerald-600 !to-teal-600 hover:!from-emerald-500 hover:!to-teal-500"
                >
                  Je veux acheter
                </Button>
                <Button
                  onClick={() => decisionMutation.mutate('ABANDONNER')}
                  disabled={decisionMutation.isPending}
                  variant="danger"
                >
                  Abandonner
                </Button>
              </div>
              {decisionError && <p className="text-sm text-red-600">{decisionError}</p>}
            </div>
          )}
        </div>

        {/* Colonne droite : chat */}
        <Card className="flex min-w-0 flex-col gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Négocier avec le vendeur
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Gardez ce lien pour revenir consulter les réponses, même sans compte.
            </p>
          </div>
          <ChatThread orderId={order.id} />
        </Card>
      </div>
    </div>
  );
}
