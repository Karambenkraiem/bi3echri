import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'bi3wechri.net — Boutique en ligne',
    short_name: 'bi3wechri.net',
    description: 'PC, matériel informatique, bricolage et électroménager',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#7c3aed',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
