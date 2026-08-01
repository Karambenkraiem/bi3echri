'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { api } from '@/lib/api';
import { Order, OrderStatus } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SortableHeader } from '@/components/ui/sortable-header';
import { useSort } from '@/lib/use-sort';
import { STATUS_LABELS, STATUS_COLORS, TYPE_LABELS } from '@/components/orders/order-detail';

function OrderRowActions({
  order,
  onOpenDetail,
  onOpenSell,
}: {
  order: Order;
  onOpenDetail: () => void;
  onOpenSell: () => void;
}) {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data: { status: OrderStatus }) => api.patch(`/orders/${order.id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });

  const renewMutation = useMutation({
    mutationFn: () => api.post(`/orders/${order.id}/renew`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });

  const btnClass = '!px-3 !py-1 text-xs';

  if (order.status === 'EN_ATTENTE') {
    return (
      <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
        <Button onClick={onOpenDetail} className={btnClass}>
          Confirmer
        </Button>
        <Button
          variant="danger"
          onClick={() => updateMutation.mutate({ status: 'ANNULEE' })}
          disabled={updateMutation.isPending}
          className={btnClass}
        >
          Annuler
        </Button>
      </div>
    );
  }

  if (order.status === 'CONFIRMEE') {
    if (order.article.status === 'VENDU') {
      return (
        <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="danger"
            onClick={() => updateMutation.mutate({ status: 'ANNULEE' })}
            disabled={updateMutation.isPending}
            className={btnClass}
            title="Cet article a déjà été vendu via une autre commande"
          >
            Annuler
          </Button>
        </div>
      );
    }
    return (
      <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
        <Button
          onClick={onOpenSell}
          className={`!bg-gradient-to-r !from-emerald-600 !to-teal-600 hover:!from-emerald-500 hover:!to-teal-500 ${btnClass}`}
        >
          Vendre
        </Button>
        <Button onClick={() => renewMutation.mutate()} disabled={renewMutation.isPending} className={btnClass}>
          Renouveler
        </Button>
        <Button
          variant="danger"
          onClick={() => updateMutation.mutate({ status: 'ANNULEE' })}
          disabled={updateMutation.isPending}
          className={btnClass}
        >
          Annuler
        </Button>
      </div>
    );
  }

  if (order.status === 'ANNULEE') {
    return (
      <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
        <Button
          onClick={() => updateMutation.mutate({ status: 'EN_ATTENTE' })}
          disabled={updateMutation.isPending}
          className={`!bg-gradient-to-r !from-emerald-600 !to-teal-600 hover:!from-emerald-500 hover:!to-teal-500 ${btnClass}`}
        >
          Réactiver
        </Button>
      </div>
    );
  }

  return null;
}

type SortKey = 'createdAt' | 'customerName' | 'article' | 'type' | 'status';

const STATUS_FILTERS: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'Toutes' },
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'CONFIRMEE', label: 'Confirmée' },
  { value: 'VENDU', label: 'Vendu' },
  { value: 'ANNULEE', label: 'Annulée' },
];

const STATUS_FILTER_ACTIVE_CLASSES: Record<OrderStatus | '', string> = {
  '': 'bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-sm shadow-violet-600/25',
  EN_ATTENTE: 'bg-amber-500 text-white shadow-sm shadow-amber-500/25',
  CONFIRMEE: 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/25',
  VENDU: 'bg-violet-500 text-white shadow-sm shadow-violet-500/25',
  ANNULEE: 'bg-red-500 text-white shadow-sm shadow-red-500/25',
};

function CommandesContent() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('EN_ATTENTE');

  const { data: allOrders, isLoading } = useQuery({
    queryKey: ['orders', 'all'],
    queryFn: () => api.get<Order[]>('/orders'),
  });

  const counts = (allOrders ?? []).reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  const orders = statusFilter ? allOrders?.filter((o) => o.status === statusFilter) : allOrders;

  const { sorted, sortKey, sortDirection, toggleSort } = useSort<Order, SortKey>(
    orders,
    (o, key) => {
      switch (key) {
        case 'createdAt':
          return o.createdAt;
        case 'customerName':
          return o.customerName;
        case 'article':
          return o.article.name;
        case 'type':
          return o.type;
        case 'status':
          return o.status;
      }
    },
    'createdAt',
  );

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
        Commandes en ligne
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Demandes de réservation ou d&apos;achat soumises depuis le site vitrine.
      </p>

      <div className="flex flex-wrap justify-start gap-2">
        {STATUS_FILTERS.map((f) => {
          const active = statusFilter === f.value;
          const count = f.value ? (counts[f.value] ?? 0) : (allOrders?.length ?? 0);
          return (
            <button
              key={f.value || 'all'}
              onClick={() => setStatusFilter(f.value)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
                active
                  ? STATUS_FILTER_ACTIVE_CLASSES[f.value]
                  : 'border border-slate-200/70 bg-white/60 text-slate-600 hover:border-slate-300 hover:bg-white dark:border-slate-800/70 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800'
              }`}
            >
              {f.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                  active ? 'bg-white/25' : 'bg-slate-100 dark:bg-slate-800'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <Card className="overflow-x-auto p-0">
        {isLoading ? (
          <p className="p-4 text-sm text-slate-500">Chargement...</p>
        ) : !sorted || sorted.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">Aucune commande.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-slate-800">
              <tr>
                <SortableHeader
                  active={sortKey === 'createdAt'}
                  direction={sortDirection}
                  onClick={() => toggleSort('createdAt')}
                >
                  Date
                </SortableHeader>
                <SortableHeader
                  active={sortKey === 'article'}
                  direction={sortDirection}
                  onClick={() => toggleSort('article')}
                >
                  Article
                </SortableHeader>
                <SortableHeader
                  active={sortKey === 'customerName'}
                  direction={sortDirection}
                  onClick={() => toggleSort('customerName')}
                >
                  Client
                </SortableHeader>
                <SortableHeader
                  active={sortKey === 'type'}
                  direction={sortDirection}
                  onClick={() => toggleSort('type')}
                >
                  Type
                </SortableHeader>
                <SortableHeader
                  active={sortKey === 'status'}
                  direction={sortDirection}
                  onClick={() => toggleSort('status')}
                >
                  Statut
                </SortableHeader>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sorted.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => router.push(`/commandes/${order.id}`)}
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {new Date(order.createdAt).toLocaleString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {order.article.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {order.customerName} · {order.customerPhone}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {TYPE_LABELS[order.type]}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status]}`}
                    >
                      {STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <OrderRowActions
                      order={order}
                      onOpenDetail={() => router.push(`/commandes/${order.id}`)}
                      onOpenSell={() => router.push(`/commandes/${order.id}?sell=1`)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

export default function CommandesPage() {
  return (
    <ProtectedRoute>
      <CommandesContent />
    </ProtectedRoute>
  );
}
