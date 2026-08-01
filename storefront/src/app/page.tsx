'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Category, Product } from '@/lib/types';
import { HeroBanner } from '@/components/storefront/hero-banner';
import { CategoryGrid } from '@/components/storefront/category-grid';
import { ProductCard } from '@/components/storefront/product-card';
import { SparklesIcon } from '@/components/ui/icons';

export default function HomePage() {
  const { data: categories } = useQuery({
    queryKey: ['public', 'categories'],
    queryFn: () => api.get<Category[]>('/public/categories'),
  });

  const { data: newProducts } = useQuery({
    queryKey: ['public', 'products', 'new'],
    queryFn: () => api.get<Product[]>('/public/products?isNew=true'),
  });

  const { data: allProducts, isLoading } = useQuery({
    queryKey: ['public', 'products', 'all'],
    queryFn: () => api.get<Product[]>('/public/products'),
  });

  return (
    <div className="flex flex-col gap-12">
      <HeroBanner products={newProducts ?? allProducts ?? []} />

      {categories && categories.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Catégories</h2>
          <CategoryGrid categories={categories} />
        </section>
      )}

      {newProducts && newProducts.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-emerald-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Nouveautés</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {newProducts.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tous nos produits</h2>
          <Link
            href="/produits"
            className="text-sm font-medium text-violet-600 hover:underline dark:text-violet-400"
          >
            Voir tout →
          </Link>
        </div>
        {isLoading ? (
          <p className="text-sm text-slate-500">Chargement...</p>
        ) : !allProducts || allProducts.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun produit disponible pour le moment.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {allProducts.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
