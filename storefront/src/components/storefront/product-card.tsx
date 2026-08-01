'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Product } from '@/lib/types';
import { getAssetUrl } from '@/lib/api';
import { formatDT } from '@/lib/format';
import { BoxIcon } from '@/components/ui/icons';

export function ProductCard({ product }: { product: Product }) {
  const photo = product.photos[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -4 }}
    >
      <Link
        href={`/produits/${product.id}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-lg dark:border-slate-800/70 dark:bg-slate-900/80"
      >
        <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getAssetUrl(photo.url)}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-600">
              <BoxIcon className="h-12 w-12" />
            </div>
          )}
          {product.isNew && (
            <span className="absolute left-2 top-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
              Nouveau
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-violet-600 dark:text-violet-400">
            {product.category.name}
          </p>
          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-white">
            {product.name}
          </h3>
          <div className="mt-auto flex items-center justify-between pt-2">
            <span className="text-base font-bold text-slate-900 dark:text-white">
              {formatDT(product.price)}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {product.condition === 'NEUF' ? 'Neuf' : 'Occasion'}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
