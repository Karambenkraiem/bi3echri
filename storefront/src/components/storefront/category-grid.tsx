'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Category } from '@/lib/types';
import { FolderIcon } from '@/components/ui/icons';

export function CategoryGrid({ categories }: { categories: Category[] }) {
  const topLevel = categories.filter((c) => !c.parentId);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {topLevel.map((category, i) => (
        <motion.div
          key={category.id}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
        >
          <Link
            href={`/produits?categoryId=${category.id}`}
            className="group flex flex-col items-center gap-2 rounded-2xl border border-slate-200/70 bg-white/80 p-4 text-center shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md dark:border-slate-800/70 dark:bg-slate-900/80 dark:hover:border-violet-700"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 transition-colors group-hover:bg-violet-500 group-hover:text-white dark:bg-violet-500/15 dark:text-violet-300">
              <FolderIcon className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {category.name}
            </span>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
