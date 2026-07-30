import { ArticleSpecs } from './types';

const SPECS_ORDER: { key: keyof ArticleSpecs; format?: (v: string | number) => string }[] = [
  { key: 'marque' },
  { key: 'processeur' },
  { key: 'type' },
  { key: 'concept' },
  { key: 'tailleEcran', format: (v) => `${v}"` },
  { key: 'ram', format: (v) => `${v} RAM` },
  { key: 'stockage' },
];

export function formatDT(value: number): string {
  return `${value.toFixed(3)} DT`;
}

export function formatSpecsSummary(specs: ArticleSpecs | null | undefined): string | null {
  if (!specs) return null;
  const parts = SPECS_ORDER.filter(({ key }) => specs[key] !== undefined && specs[key] !== '').map(
    ({ key, format }) => (format ? format(specs[key] as string | number) : String(specs[key])),
  );
  return parts.length > 0 ? parts.join(' · ') : null;
}
