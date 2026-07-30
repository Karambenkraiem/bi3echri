'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { api, getAssetUrl } from '@/lib/api';
import { Article, ArticleStatus, Category, Condition } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { PencilIcon, TrashIcon } from '@/components/ui/icons';
import { SortableHeader } from '@/components/ui/sortable-header';
import { ArticleForm } from '@/components/articles/article-form';
import { SellForm } from '@/components/articles/sell-form';
import { CategorySelect } from '@/components/articles/category-select';
import { formatSpecsSummary, formatDT } from '@/lib/format';
import { useSort } from '@/lib/use-sort';

const STATUS_LABELS: Record<ArticleStatus, string> = {
  EN_STOCK: 'En stock',
  RESERVE: 'Réservé',
  VENDU: 'Vendu',
};

const STATUS_COLORS: Record<ArticleStatus, string> = {
  EN_STOCK: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  RESERVE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  VENDU: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

type SortKey =
  | 'name'
  | 'category'
  | 'quantity'
  | 'purchasePrice'
  | 'expectedSalePrice'
  | 'purchaseDate'
  | 'status';

function ArticlesPageContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | ''>('EN_STOCK');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [conditionFilter, setConditionFilter] = useState<Condition | ''>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [sellTarget, setSellTarget] = useState<Article | null>(null);
  const [editTarget, setEditTarget] = useState<Article | null>(null);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/categories'),
  });

  const { data: articles, isLoading } = useQuery({
    queryKey: ['articles', statusFilter, categoryFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (categoryFilter) params.set('categoryId', categoryFilter);
      const qs = params.toString();
      return api.get<Article[]>(`/articles${qs ? `?${qs}` : ''}`);
    },
  });

  const filtered = articles?.filter((a) => !conditionFilter || a.condition === conditionFilter);

  const { sorted, sortKey, sortDirection, toggleSort } = useSort<Article, SortKey>(
    filtered,
    (a, key) => {
      switch (key) {
        case 'name':
          return a.name;
        case 'category':
          return a.category.name;
        case 'quantity':
          return a.quantity;
        case 'purchasePrice':
          return Number(a.purchasePrice);
        case 'expectedSalePrice':
          return a.expectedSalePrice != null ? Number(a.expectedSalePrice) : -1;
        case 'purchaseDate':
          return a.purchaseDate;
        case 'status':
          return a.status;
      }
    },
    'purchaseDate',
  );

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/articles/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['articles'] }),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Stock</h1>
        <Button onClick={() => setShowAddModal(true)}>+ Ajouter un article</Button>
      </div>

      <Card className="flex flex-wrap gap-3">
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ArticleStatus | '')}
          className="w-auto"
        >
          <option value="">Tous les statuts</option>
          <option value="EN_STOCK">En stock</option>
          <option value="RESERVE">Réservé</option>
          <option value="VENDU">Vendu</option>
        </Select>
        <CategorySelect
          categories={categories}
          placeholder="Toutes les catégories"
          placeholderDisabled={false}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-auto"
        />
        <Select
          value={conditionFilter}
          onChange={(e) => setConditionFilter(e.target.value as Condition | '')}
          className="w-auto"
        >
          <option value="">Neuf et occasion</option>
          <option value="NEUF">Neuf</option>
          <option value="OCCASION">Occasion</option>
        </Select>
      </Card>

      <Card className="overflow-x-auto p-0">
        {isLoading ? (
          <p className="p-4 text-sm text-slate-500">Chargement...</p>
        ) : !sorted || sorted.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">Aucun article trouvé.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3"></th>
                <SortableHeader
                  active={sortKey === 'name'}
                  direction={sortDirection}
                  onClick={() => toggleSort('name')}
                >
                  Article
                </SortableHeader>
                <SortableHeader
                  active={sortKey === 'category'}
                  direction={sortDirection}
                  onClick={() => toggleSort('category')}
                >
                  Catégorie
                </SortableHeader>
                <SortableHeader
                  active={sortKey === 'quantity'}
                  direction={sortDirection}
                  onClick={() => toggleSort('quantity')}
                >
                  Qté
                </SortableHeader>
                <SortableHeader
                  active={sortKey === 'purchasePrice'}
                  direction={sortDirection}
                  onClick={() => toggleSort('purchasePrice')}
                >
                  Prix d&apos;achat
                </SortableHeader>
                <SortableHeader
                  active={sortKey === 'expectedSalePrice'}
                  direction={sortDirection}
                  onClick={() => toggleSort('expectedSalePrice')}
                >
                  Prix de vente prévu
                </SortableHeader>
                <SortableHeader
                  active={sortKey === 'purchaseDate'}
                  direction={sortDirection}
                  onClick={() => toggleSort('purchaseDate')}
                >
                  Date d&apos;achat
                </SortableHeader>
                <SortableHeader
                  active={sortKey === 'status'}
                  direction={sortDirection}
                  onClick={() => toggleSort('status')}
                >
                  Statut
                </SortableHeader>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sorted.map((article) => (
                <tr
                  key={article.id}
                  onClick={() => router.push(`/articles/${article.id}`)}
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <td className="py-3 pl-4">
                    {article.photos && article.photos.length > 0 ? (
                      <div className="relative h-12 w-12 overflow-hidden rounded-md border border-slate-200 dark:border-slate-700">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getAssetUrl(article.photos[0].url)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                        {article.photos.length > 1 && (
                          <span className="absolute bottom-0 right-0 rounded-tl bg-black/60 px-1 text-[10px] leading-tight text-white">
                            +{article.photos.length - 1}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-md border border-dashed border-slate-200 text-[10px] text-slate-400 dark:border-slate-700">
                        Aucune
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900 dark:text-white">{article.name}</div>
                    {formatSpecsSummary(article.specs) && (
                      <div className="text-xs text-slate-500">{formatSpecsSummary(article.specs)}</div>
                    )}
                    {article.purchaseSource && (
                      <div className="text-xs text-slate-400">{article.purchaseSource}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {article.category.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {article.quantity}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {formatDT(Number(article.purchasePrice))}
                  </td>
                  <td className="px-4 py-3 font-medium text-violet-600 dark:text-violet-400">
                    {article.expectedSalePrice != null
                      ? formatDT(Number(article.expectedSalePrice))
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {new Date(article.purchaseDate).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[article.status]}`}
                    >
                      {STATUS_LABELS[article.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      {article.status === 'EN_STOCK' && (
                        <Button variant="secondary" onClick={() => setSellTarget(article)}>
                          Vendre
                        </Button>
                      )}
                      <button
                        onClick={() => setEditTarget(article)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        aria-label="Modifier"
                        title="Modifier"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      {article.status !== 'VENDU' && (
                        <button
                          onClick={() => {
                            if (confirm('Supprimer cet article ?')) {
                              deleteMutation.mutate(article.id);
                            }
                          }}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                          aria-label="Supprimer"
                          title="Supprimer"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Ajouter un article">
        <ArticleForm onSuccess={() => setShowAddModal(false)} />
      </Modal>

      <Modal open={!!sellTarget} onClose={() => setSellTarget(null)} title="Vendre l'article">
        {sellTarget && (
          <SellForm article={sellTarget} onSuccess={() => setSellTarget(null)} />
        )}
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Modifier l'article">
        {editTarget && (
          <ArticleForm article={editTarget} onSuccess={() => setEditTarget(null)} />
        )}
      </Modal>
    </div>
  );
}

export default function ArticlesPage() {
  return (
    <ProtectedRoute>
      <ArticlesPageContent />
    </ProtectedRoute>
  );
}
