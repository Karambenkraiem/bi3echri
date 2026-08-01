'use client';

import { Suspense, use } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { api } from '@/lib/api';
import { Order } from '@/lib/types';
import { OrderDetail } from '@/components/orders/order-detail';

function CommandeDetailContent({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const autoOpenSell = searchParams.get('sell') === '1';

  const { data: order, isLoading } = useQuery({
    queryKey: ['orders', 'detail', id],
    queryFn: () => api.get<Order>(`/orders/${id}`),
  });

  return (
    <div className="flex w-full flex-col gap-4">
      <Link href="/commandes" className="text-sm text-slate-500 hover:underline">
        ← Retour aux commandes
      </Link>
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
        Détail de la commande
      </h1>

      {isLoading ? (
        <p className="text-sm text-slate-500">Chargement...</p>
      ) : !order ? (
        <p className="text-sm text-slate-500">Commande introuvable.</p>
      ) : (
        <OrderDetail order={order} autoOpenSell={autoOpenSell} />
      )}
    </div>
  );
}

export default function CommandeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ProtectedRoute>
      <Suspense fallback={<p className="text-sm text-slate-500">Chargement...</p>}>
        <CommandeDetailContent id={id} />
      </Suspense>
    </ProtectedRoute>
  );
}
