'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Product } from '@/lib/types';
import { getAssetUrl } from '@/lib/api';
import { formatDT } from '@/lib/format';
import { ChevronLeftIcon, ChevronRightIcon, SparklesIcon } from '@/components/ui/icons';

export function HeroBanner({ products }: { products: Product[] }) {
  const [index, setIndex] = useState(0);
  const slides = products.slice(0, 6);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), 4500);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-slate-200/70 bg-gradient-to-br from-violet-600 via-blue-600 to-emerald-500 text-center text-white shadow-lg sm:h-80">
        <SparklesIcon className="h-8 w-8" />
        <h1 className="text-2xl font-bold sm:text-3xl">Bienvenue chez bi3wechri.net</h1>
        <p className="max-w-md px-4 text-sm text-white/90">
          PC, matériel informatique, bricolage et petit électroménager — au meilleur prix.
        </p>
      </div>
    );
  }

  const current = slides[index];
  const photo = current.photos[0];

  function prev() {
    setIndex((i) => (i - 1 + slides.length) % slides.length);
  }
  function next() {
    setIndex((i) => (i + 1) % slides.length);
  }

  return (
    <div className="relative h-72 overflow-hidden rounded-3xl border border-slate-200/70 shadow-lg dark:border-slate-800/70 sm:h-96">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={getAssetUrl(photo.url)} alt={current.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-violet-600 via-blue-600 to-emerald-500" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-6 sm:p-10">
            {current.isNew && (
              <span className="w-fit rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
                Nouveauté
              </span>
            )}
            <h1 className="max-w-xl text-2xl font-bold text-white sm:text-4xl">{current.name}</h1>
            <p className="text-lg font-semibold text-white/95 sm:text-xl">{formatDT(current.price)}</p>
            <Link
              href={`/produits/${current.id}`}
              className="mt-2 w-fit rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow transition-transform hover:scale-105"
            >
              Découvrir
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>

      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Précédent"
            className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            aria-label="Suivant"
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setIndex(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
