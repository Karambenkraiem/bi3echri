'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { api } from '@/lib/api';
import { Sale } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { CancelSaleForm } from '@/components/sales/cancel-sale-form';
import { formatSpecsSummary, formatDT } from '@/lib/format';

function SalesPageContent() {
  const router = useRouter();
  const [cancelTarget, setCancelTarget] = useState<Sale | null>(null);
  const { data: sales, isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: () => api.get<Sale[]>('/sales'),
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Historique des ventes</h1>

      <Card className="overflow-x-auto p-0">
        {isLoading ? (
          <p className="p-4 text-sm text-slate-500">Chargement...</p>
        ) : !sales || sales.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">Aucune vente enregistrée.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Article</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Prix vente</th>
                <th className="px-4 py-3">Marge</th>
                <th className="px-4 py-3">Acheteur</th>
                <th className="px-4 py-3">Canal</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sales.map((sale) => {
                const purchasePrice = Number(sale.article?.purchasePrice ?? 0);
                const salePrice = Number(sale.salePrice);
                const margin = salePrice - purchasePrice;
                return (
                  <tr
                    key={sale.id}
                    onClick={() => router.push(`/articles/${sale.articleId}`)}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {sale.article?.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {sale.article?.category.name}
                        {formatSpecsSummary(sale.article?.specs) && (
                          <> · {formatSpecsSummary(sale.article?.specs)}</>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {new Date(sale.saleDate).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {formatDT(salePrice)}
                    </td>
                    <td
                      className={`px-4 py-3 font-medium ${margin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                    >
                      {formatDT(margin)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {sale.buyerName || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {sale.adChannel}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCancelTarget(sale);
                        }}
                        className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                      >
                        Retour
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      <Modal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Annuler la vente (retour au stock)"
      >
        {cancelTarget && (
          <CancelSaleForm saleId={cancelTarget.id} onDone={() => setCancelTarget(null)} />
        )}
      </Modal>
    </div>
  );
}

export default function SalesPage() {
  return (
    <ProtectedRoute>
      <SalesPageContent />
    </ProtectedRoute>
  );
}
