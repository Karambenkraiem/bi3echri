import { ArticleSpecs } from './types';

const SPECS_ORDER: { key: keyof ArticleSpecs; format?: (v: string | number) => string }[] = [
  { key: 'marque' },
  { key: 'type' },
  { key: 'concept' },
  { key: 'processeur' },
  { key: 'carteGraphique' },
  { key: 'ram', format: (v) => `${v} RAM` },
  { key: 'stockage' },
  { key: 'typeEcran' },
  { key: 'tailleEcran', format: (v) => `${v}"` },
];

export function formatDT(value: number): string {
  return `${value.toFixed(3)} DT`;
}

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days} j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

export function formatSpecsSummary(specs: ArticleSpecs | null | undefined): string | null {
  if (!specs) return null;
  const parts = SPECS_ORDER.filter(({ key }) => specs[key] !== undefined && specs[key] !== '').map(
    ({ key, format }) => (format ? format(specs[key] as string | number) : String(specs[key])),
  );
  return parts.length > 0 ? parts.join(' · ') : null;
}
