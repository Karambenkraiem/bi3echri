import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/lib/query-provider';
import { ThemeProvider } from '@/lib/theme-context';
import { ClientAuthProvider } from '@/lib/client-auth-context';
import { StorefrontNavbar } from '@/components/storefront/navbar';
import { StorefrontFooter } from '@/components/storefront/footer';
import { VisitTracker } from '@/components/storefront/visit-tracker';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'bi3wechri.net — Boutique en ligne',
  description: 'PC, matériel informatique, bricolage et électroménager à Goulette / Lac2 / Lac3 / Elkram',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'bi3wechri.net',
  },
};

export const viewport: Viewport = {
  themeColor: '#7c3aed',
  width: 'device-width',
  initialScale: 1,
};

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('bi3echri_storefront_theme');
    var dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`h-full antialiased ${inter.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="relative flex min-h-full flex-col font-sans text-slate-900 dark:text-slate-100">
        <div className="fixed inset-0 -z-10 overflow-hidden bg-slate-50 dark:bg-[#0a0714]">
          <div className="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-violet-300/30 blur-[110px] dark:bg-violet-500/20" />
          <div className="absolute top-1/3 -right-32 h-[26rem] w-[26rem] rounded-full bg-blue-300/25 blur-[110px] dark:bg-blue-500/15" />
          <div className="absolute bottom-0 left-1/4 h-[24rem] w-[24rem] rounded-full bg-emerald-300/20 blur-[110px] dark:bg-emerald-500/10" />
        </div>
        <QueryProvider>
          <ThemeProvider>
            <ClientAuthProvider>
              <VisitTracker />
              <StorefrontNavbar />
              <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 animate-fade-in-up">
                {children}
              </main>
              <StorefrontFooter />
            </ClientAuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
