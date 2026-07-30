import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { QueryProvider } from '@/lib/query-provider';
import { ThemeProvider } from '@/lib/theme-context';
import { Navbar } from '@/components/layout/navbar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'Bi3Echri — Gestion achat/vente',
  description: 'Gestion de stock, achats, ventes et analyse de marge',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Bi3Echri',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
};

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('bi3echri_theme');
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
        <div className="fixed inset-0 -z-10 overflow-hidden bg-slate-50 dark:bg-[#050914]">
          <div className="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-blue-300/30 blur-[110px] dark:bg-blue-500/20" />
          <div className="absolute top-1/3 -right-32 h-[26rem] w-[26rem] rounded-full bg-violet-300/25 blur-[110px] dark:bg-violet-500/15" />
          <div className="absolute bottom-0 left-1/4 h-[24rem] w-[24rem] rounded-full bg-emerald-300/20 blur-[110px] dark:bg-emerald-500/10" />
          <div className="absolute top-1/2 left-1/2 h-[22rem] w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/15 blur-[120px] dark:bg-cyan-500/10" />
          <div
            className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
            style={{
              backgroundImage:
                'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
              backgroundSize: '56px 56px',
              color: 'var(--foreground)',
            }}
          />
        </div>
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>
              <Navbar />
              <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 animate-fade-in-up">
                {children}
              </main>
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
