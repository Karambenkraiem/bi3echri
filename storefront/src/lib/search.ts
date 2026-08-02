import { Product } from './types';

export function matchesSearch(product: Product, query: string): boolean {
  if (!query) return true;
  const haystack = [
    product.name,
    product.description,
    product.category.name,
    product.category.parent?.name,
    ...(product.specs ? Object.values(product.specs) : []),
  ]
    .filter((v) => v !== undefined && v !== null && v !== '')
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}
