'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { api, getAssetUrl } from '@/lib/api';
import { Article, ArticleStatus } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { PencilIcon, TrashIcon } from '@/components/ui/icons';
import { ArticleForm } from '@/components/articles/article-form';
import { SellForm } from '@/components/articles/sell-form';
import { RestockForm } from '@/components/articles/restock-form';
import { formatDT } from '@/lib/format';

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

const SPEC_LABELS: Record<string, string> = {
  marque: 'Marque',
  processeur: 'Processeur',
  tailleEcran: 'Taille écran',
  concept: 'Concept',
  type: 'Type',
  ram: 'RAM',
  stockage: 'Stockage',
};

function ArticleDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showSell, setShowSell] = useState(false);
  const [showRestock, setShowRestock] = useState(false);

  const { data: article, isLoading } = useQuery({
    queryKey: ['articles', id],
    queryFn: () => api.get<Article>(`/articles/${id}`),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/articles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      router.push('/articles');
    },
  });

  if (isLoading) {
    return <p className="text-sm text-slate-500">Chargement...</p>;
  }

  if (!article) {
    return <p className="text-sm text-slate-500">Article introuvable.</p>;
  }

  const purchasePrice = Number(article.purchasePrice);
  const specsEntries = article.specs
    ? Object.entries(article.specs).filter(([, v]) => v !== undefined && v !== '')
    : [];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/articles" className="text-sm text-slate-500 hover:underline">
          ← Retour au stock
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{article.name}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {article.category.parent ? `${article.category.parent.name} > ` : ''}
            {article.category.name}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[article.status]}`}>
          {STATUS_LABELS[article.status]}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {article.status === 'EN_STOCK' && (
          <Button variant="secondary" onClick={() => setShowSell(true)}>
            Vendre
          </Button>
        )}
        {article.status !== 'VENDU' && (
          <Button variant="secondary" onClick={() => setShowRestock(true)}>
            + Ajouter au stock
          </Button>
        )}
        <button
          onClick={() => setShowEdit(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <PencilIcon className="h-4 w-4" />
          Modifier
        </button>
        {article.status !== 'VENDU' && (
          <button
            onClick={() => {
              if (confirm('Supprimer cet article ?')) {
                deleteMutation.mutate();
              }
            }}
            disabled={deleteMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-slate-700 dark:hover:bg-red-900/30"
          >
            <TrashIcon className="h-4 w-4" />
            Supprimer
          </button>
        )}
      </div>

      {article.photos && article.photos.length > 0 && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Photos</h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {article.photos.map((photo) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={photo.id}
                src={getAssetUrl(photo.url)}
                alt=""
                onClick={() => setLightbox(getAssetUrl(photo.url))}
                className="aspect-square cursor-pointer rounded-md border border-slate-200 object-cover dark:border-slate-700"
              />
            ))}
          </div>
        </Card>
      )}

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Informations</h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
          <dt className="text-slate-500">État</dt>
          <dd className="col-span-2 sm:col-span-2">
            {article.condition === 'NEUF' ? 'Neuf' : 'Occasion'}
          </dd>
          <dt className="text-slate-500">Prix d&apos;achat</dt>
          <dd className="col-span-2 sm:col-span-2">{formatDT(purchasePrice)}</dd>
          <dt className="text-slate-500">Date d&apos;achat</dt>
          <dd className="col-span-2 sm:col-span-2">
            {new Date(article.purchaseDate).toLocaleDateString('fr-FR')}
          </dd>
          <dt className="text-slate-500">Fournisseur / où acheté</dt>
          <dd className="col-span-2 sm:col-span-2">{article.purchaseSource || '—'}</dd>
          <dt className="text-slate-500">Dernier prix prévu de vente</dt>
          <dd className="col-span-2 sm:col-span-2">
            {article.expectedSalePrice != null ? formatDT(Number(article.expectedSalePrice)) : '—'}
          </dd>
          <dt className="text-slate-500">Quantité</dt>
          <dd className="col-span-2 sm:col-span-2">{article.quantity}</dd>
          {article.description && (
            <>
              <dt className="text-slate-500">Description</dt>
              <dd className="col-span-2 whitespace-pre-wrap sm:col-span-2">
                {article.description}
              </dd>
            </>
          )}
        </dl>
      </Card>

      {specsEntries.length > 0 && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
            Caractéristiques
          </h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
            {specsEntries.map(([key, value]) => (
              <div key={key} className="contents">
                <dt className="text-slate-500">{SPEC_LABELS[key] ?? key}</dt>
                <dd className="col-span-2 sm:col-span-2">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      {article.sale && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
            Détails de la vente
          </h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
            <dt className="text-slate-500">Prix de vente</dt>
            <dd className="col-span-2 font-medium text-emerald-600 sm:col-span-2">
              {formatDT(Number(article.sale.salePrice))}
            </dd>
            <dt className="text-slate-500">Marge</dt>
            <dd className="col-span-2 sm:col-span-2">
              {formatDT(Number(article.sale.salePrice) - purchasePrice)}
            </dd>
            <dt className="text-slate-500">Date de vente</dt>
            <dd className="col-span-2 sm:col-span-2">
              {new Date(article.sale.saleDate).toLocaleDateString('fr-FR')}
            </dd>
            <dt className="text-slate-500">Acheteur</dt>
            <dd className="col-span-2 sm:col-span-2">{article.sale.buyerName || '—'}</dd>
            <dt className="text-slate-500">Contact</dt>
            <dd className="col-span-2 sm:col-span-2">{article.sale.buyerContact || '—'}</dd>
            <dt className="text-slate-500">Canal</dt>
            <dd className="col-span-2 sm:col-span-2">{article.sale.adChannel}</dd>
            {article.sale.notes && (
              <>
                <dt className="text-slate-500">Notes</dt>
                <dd className="col-span-2 sm:col-span-2">{article.sale.notes}</dd>
              </>
            )}
          </dl>
        </Card>
      )}

      <Modal open={showSell} onClose={() => setShowSell(false)} title="Vendre l'article">
        <SellForm article={article} onSuccess={() => setShowSell(false)} />
      </Modal>

      <Modal open={showRestock} onClose={() => setShowRestock(false)} title="Ajouter au stock">
        <RestockForm article={article} onSuccess={() => setShowRestock(false)} />
      </Modal>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Modifier l'article">
        <ArticleForm article={article} onSuccess={() => setShowEdit(false)} />
      </Modal>

      <Modal open={!!lightbox} onClose={() => setLightbox(null)} title="Photo">
        {lightbox && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={lightbox} alt="" className="max-h-[70vh] w-full rounded-md object-contain" />
        )}
      </Modal>
    </div>
  );
}

export default function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ProtectedRoute>
      <ArticleDetailContent id={id} />
    </ProtectedRoute>
  );
}
