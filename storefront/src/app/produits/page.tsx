'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Category, Condition, Product } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SearchIcon, XIcon } from '@/components/ui/icons';
import { ProductCard } from '@/components/storefront/product-card';

const CONDITIONS: { value: Condition; label: string }[] = [
  { value: 'NEUF', label: 'Neuf' },
  { value: 'OCCASION', label: 'Occasion' },
];

function CategoryCheckbox({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-2 py-1 text-sm text-slate-600 dark:text-slate-300"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 shrink-0 rounded border-slate-300 text-violet-600 focus:ring-violet-500 dark:border-slate-600 dark:bg-slate-800"
      />
      {label}
    </label>
  );
}

function ProduitsContent() {
  const searchParams = useSearchParams();
  const initialCategoryId = searchParams.get('categoryId');

  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    () => new Set(initialCategoryId ? [initialCategoryId] : []),
  );
  const [selectedConditions, setSelectedConditions] = useState<Set<Condition>>(new Set());

  const { data: categories } = useQuery({
    queryKey: ['public', 'categories'],
    queryFn: () => api.get<Category[]>('/public/categories'),
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ['public', 'products'],
    queryFn: () => api.get<Product[]>('/public/products'),
  });

  const topLevel = (categories ?? []).filter((c) => !c.parentId);

  function toggleCategory(id: string) {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleCondition(value: Condition) {
    setSelectedConditions((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  }

  function clearFilters() {
    setSearch('');
    setSelectedCategories(new Set());
    setSelectedConditions(new Set());
  }

  const filtered = useMemo(() => {
    if (!products) return [];
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      if (query && !product.name.toLowerCase().includes(query)) return false;
      if (selectedCategories.size > 0 && !selectedCategories.has(product.category.id)) return false;
      if (selectedConditions.size > 0 && !selectedConditions.has(product.condition)) return false;
      return true;
    });
  }, [products, search, selectedCategories, selectedConditions]);

  const hasActiveFilters = search !== '' || selectedCategories.size > 0 || selectedConditions.size > 0;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Nos produits</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="flex flex-col gap-4">
          <Card>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un produit..."
                className="pl-9"
              />
            </div>
          </Card>

          <Card>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Filtres</h2>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:underline dark:text-violet-400"
                >
                  <XIcon className="h-3 w-3" />
                  Réinitialiser
                </button>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Catégories
                </p>
                <div className="flex flex-col">
                  {topLevel.map((category) =>
                    category.children && category.children.length > 0 ? (
                      <div key={category.id} className="mb-1">
                        <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                          {category.name}
                        </p>
                        {category.children.map((child) => (
                          <CategoryCheckbox
                            key={child.id}
                            id={`cat-${child.id}`}
                            label={child.name}
                            checked={selectedCategories.has(child.id)}
                            onChange={() => toggleCategory(child.id)}
                          />
                        ))}
                      </div>
                    ) : (
                      <CategoryCheckbox
                        key={category.id}
                        id={`cat-${category.id}`}
                        label={category.name}
                        checked={selectedCategories.has(category.id)}
                        onChange={() => toggleCategory(category.id)}
                      />
                    ),
                  )}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3 dark:border-slate-800">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  État
                </p>
                {CONDITIONS.map((c) => (
                  <CategoryCheckbox
                    key={c.value}
                    id={`cond-${c.value}`}
                    label={c.label}
                    checked={selectedConditions.has(c.value)}
                    onChange={() => toggleCondition(c.value)}
                  />
                ))}
              </div>
            </div>
          </Card>
        </aside>

        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isLoading ? 'Chargement...' : `${filtered.length} produit${filtered.length > 1 ? 's' : ''}`}
          </p>
          {isLoading ? (
            <p className="text-sm text-slate-500">Chargement...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun produit ne correspond à ces critères.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProduitsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Chargement...</p>}>
      <ProduitsContent />
    </Suspense>
  );
}
