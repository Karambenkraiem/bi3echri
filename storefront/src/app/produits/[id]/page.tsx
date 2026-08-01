'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api, getAssetUrl } from '@/lib/api';
import { useClientAuth } from '@/lib/client-auth-context';
import { OrderType, Product } from '@/lib/types';
import { formatDT } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BoxIcon, ChatIcon } from '@/components/ui/icons';
import { OrderModal } from '@/components/storefront/order-modal';

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

function orderedSpecEntries(specs: Product['specs']): [string, string | number][] {
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

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { client, loading: authLoading } = useClientAuth();
  const [activePhoto, setActivePhoto] = useState(0);
  const [orderType, setOrderType] = useState<OrderType | null>(null);

  function handleOrderClick(type: OrderType) {
    if (authLoading) return;
    if (!client) {
      router.push(`/compte/inscription?next=/produits/${id}`);
      return;
    }
    setOrderType(type);
  }

  const { data: product, isLoading } = useQuery({
    queryKey: ['public', 'products', id],
    queryFn: () => api.get<Product>(`/public/products/${id}`),
  });

  if (isLoading) {
    return <p className="text-sm text-slate-500">Chargement...</p>;
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-slate-500">Ce produit n&apos;est plus disponible.</p>
        <Link href="/produits" className="text-violet-600 hover:underline dark:text-violet-400">
          ← Retour au catalogue
        </Link>
      </div>
    );
  }

  const specsEntries = orderedSpecEntries(product.specs);
  const currentPhoto = product.photos[activePhoto];

  return (
    <div className="flex flex-col gap-6">
      <Link href="/produits" className="text-sm text-slate-500 hover:underline">
        ← Retour au catalogue
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="aspect-square overflow-hidden rounded-2xl border border-slate-200/70 bg-slate-100 dark:border-slate-800/70 dark:bg-slate-800">
            {currentPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getAssetUrl(currentPhoto.url)}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-600">
                <BoxIcon className="h-16 w-16" />
              </div>
            )}
          </div>
          {product.photos.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {product.photos.map((photo, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={photo.id}
                  src={getAssetUrl(photo.url)}
                  alt=""
                  onClick={() => setActivePhoto(i)}
                  className={`aspect-square cursor-pointer rounded-lg border object-cover transition-all ${
                    i === activePhoto
                      ? 'border-violet-500 ring-2 ring-violet-500/40'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-violet-600 dark:text-violet-400">
              {product.category.parent ? `${product.category.parent.name} · ` : ''}
              {product.category.name}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
              {product.name}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {formatDT(product.price)}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {product.condition === 'NEUF' ? 'Neuf' : 'Occasion'}
            </span>
            {product.isNew && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                Nouveau
              </span>
            )}
          </div>

          {product.description && (
            <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
              {product.description}
            </p>
          )}

          {specsEntries.length > 0 && (
            <Card>
              <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
                Caractéristiques
              </h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {specsEntries.map(([key, value]) => (
                  <div key={key} className="contents">
                    <dt className="text-slate-500">{SPEC_LABELS[key] ?? key}</dt>
                    <dd className="text-slate-900 dark:text-white">{value}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              onClick={() => handleOrderClick('RESERVATION')}
              variant="secondary"
              className="flex-1"
            >
              Réserver
            </Button>
            <Button
              onClick={() => handleOrderClick('NEGOCIATION')}
              className="flex-1 gap-1.5 !bg-gradient-to-r !from-emerald-600 !to-teal-600 shadow-emerald-600/20 hover:!from-emerald-500 hover:!to-teal-500"
            >
              <ChatIcon className="h-4 w-4" />
              Négocier
            </Button>
            <Button onClick={() => handleOrderClick('ACHAT')} className="flex-1">
              Acheter
            </Button>
          </div>
          {!authLoading && !client && (
            <p className="-mt-2 text-xs text-slate-400">
              Un compte est nécessaire pour réserver, négocier ou acheter.{' '}
              <Link
                href={`/compte/inscription?next=/produits/${id}`}
                className="font-medium text-violet-600 hover:underline dark:text-violet-400"
              >
                Créer un compte
              </Link>
            </p>
          )}
        </div>
      </div>

      {orderType && (
        <OrderModal
          product={product}
          type={orderType}
          open={!!orderType}
          onClose={() => setOrderType(null)}
        />
      )}
    </div>
  );
}
