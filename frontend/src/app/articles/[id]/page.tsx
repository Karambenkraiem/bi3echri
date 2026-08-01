'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { api, getAssetUrl } from '@/lib/api';
import { Article, ArticleStatus, Order } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { PencilIcon, TrashIcon } from '@/components/ui/icons';
import { ArticleForm } from '@/components/articles/article-form';
import { SellForm } from '@/components/articles/sell-form';
import { RestockForm } from '@/components/articles/restock-form';
import { CancelSaleForm } from '@/components/sales/cancel-sale-form';
import { EditSaleForm } from '@/components/sales/edit-sale-form';
import { formatDT } from '@/lib/format';

const STATUS_LABELS: Record<ArticleStatus, string> = {
  EN_STOCK: 'En stock',
  RESERVE: 'En attente de retrait',
  VENDU: 'Vendu',
};

const STATUS_COLORS: Record<ArticleStatus, string> = {
  EN_STOCK: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  RESERVE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  VENDU: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

const SPEC_LABELS: Record<string, string> = {
  marque: 'Marque',
  type: 'Type',
  concept: 'Concept',
  processeur: 'Processeur',
  carteGraphique: 'Carte graphique',
  ram: 'RAM',
  stockage: 'Stockage',
  typeEcran: "Type d'écran",
  tailleEcran: 'Taille écran',
};

const SPEC_ORDER = Object.keys(SPEC_LABELS);

function orderedSpecEntries(specs: Article['specs']): [string, string | number][] {
  if (!specs) return [];
  const entries = Object.entries(specs).filter(
    ([, v]) => v !== undefined && v !== '',
  ) as [string, string | number][];
  return entries.sort((a, b) => {
    const ia = SPEC_ORDER.indexOf(a[0]);
    const ib = SPEC_ORDER.indexOf(b[0]);
    return (ia === -1 ? SPEC_ORDER.length : ia) - (ib === -1 ? SPEC_ORDER.length : ib);
  });
}

function ArticleDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showSell, setShowSell] = useState(false);
  const [showRestock, setShowRestock] = useState(false);
  const [showCancelSale, setShowCancelSale] = useState(false);
  const [showEditSale, setShowEditSale] = useState(false);

  const { data: article, isLoading } = useQuery({
    queryKey: ['articles', id],
    queryFn: () => api.get<Article>(`/articles/${id}`),
  });

  const { data: confirmedOrders } = useQuery({
    queryKey: ['orders', 'CONFIRMEE', id],
    queryFn: () => api.get<Order[]>(`/orders?status=CONFIRMEE&articleId=${id}`),
    enabled: article?.status === 'RESERVE',
  });
  const confirmedOrder = confirmedOrders?.[0];

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/articles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      router.push('/articles');
    },
  });

  const cancelRetraitMutation = useMutation({
    mutationFn: (orderId: string) => api.patch(`/orders/${orderId}`, { status: 'ANNULEE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  if (isLoading) {
    return <p className="text-sm text-slate-500">Chargement...</p>;
  }

  if (!article) {
    return <p className="text-sm text-slate-500">Article introuvable.</p>;
  }

  const purchasePrice = Number(article.purchasePrice);
  const specsEntries = orderedSpecEntries(article.specs);

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
        {article.status === 'RESERVE' && (
          <Button
            onClick={() => setShowSell(true)}
            className="!bg-gradient-to-r !from-emerald-600 !to-teal-600 hover:!from-emerald-500 hover:!to-teal-500"
          >
            Vendu (client récupéré)
          </Button>
        )}
        {article.status === 'RESERVE' && confirmedOrder && (
          <Button
            variant="danger"
            onClick={() => {
              if (confirm("Le client n'est pas venu ou a abandonné : remettre l'article en stock ?")) {
                cancelRetraitMutation.mutate(confirmedOrder.id);
              }
            }}
            disabled={cancelRetraitMutation.isPending}
          >
            Retour au stock
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
          <dt className="text-slate-500">Prix affiché</dt>
          <dd className="col-span-2 sm:col-span-2">
            {article.expectedSalePrice != null ? formatDT(Number(article.expectedSalePrice)) : '—'}
          </dd>
          <dt className="text-slate-500">Dernier prix</dt>
          <dd className="col-span-2 sm:col-span-2">
            {article.floorPrice != null ? (
              <span className="font-medium text-red-600 dark:text-red-400">
                {formatDT(Number(article.floorPrice))}
              </span>
            ) : (
              '—'
            )}
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
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Détails de la vente
            </h2>
            {!showEditSale && !showCancelSale && (
              <button
                onClick={() => setShowEditSale(true)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:underline dark:text-violet-400"
              >
                <PencilIcon className="h-3.5 w-3.5" />
                Modifier la vente
              </button>
            )}
          </div>

          {showEditSale ? (
            <EditSaleForm sale={article.sale} onDone={() => setShowEditSale(false)} />
          ) : (
            <>
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
                    <dd className="col-span-2 whitespace-pre-wrap sm:col-span-2">
                      {article.sale.notes}
                    </dd>
                  </>
                )}
              </dl>

              {showCancelSale ? (
                <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
                  <CancelSaleForm
                    saleId={article.sale.id}
                    onDone={() => setShowCancelSale(false)}
                  />
                </div>
              ) : (
                <button
                  onClick={() => setShowCancelSale(true)}
                  className="mt-4 text-sm font-medium text-red-600 hover:underline dark:text-red-400"
                >
                  Le client a fait un retour — annuler la vente
                </button>
              )}
            </>
          )}
        </Card>
      )}

      <Modal open={showSell} onClose={() => setShowSell(false)} title="Vendre l'article">
        <SellForm
          article={article}
          orderId={confirmedOrder?.id}
          initialSalePrice={confirmedOrder?.agreedPrice}
          initialBuyerName={confirmedOrder?.customerName}
          initialBuyerContact={confirmedOrder?.customerPhone}
          initialAdChannel={confirmedOrder ? 'Site web' : undefined}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            setShowSell(false);
          }}
        />
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
