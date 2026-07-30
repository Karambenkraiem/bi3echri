'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { api, getAssetUrl } from '@/lib/api';
import { formatDT } from '@/lib/format';
import {
  SunIcon,
  MoonIcon,
  ChartIcon,
  BoxIcon,
  TagIcon,
  FolderIcon,
  BuildingIcon,
  ReceiptIcon,
  UsersIcon,
  GearIcon,
} from '@/components/ui/icons';

const LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: ChartIcon },
  { href: '/articles', label: 'Stock', icon: BoxIcon },
  { href: '/sales', label: 'Ventes', icon: TagIcon },
  { href: '/categories', label: 'Catégories', icon: FolderIcon },
  { href: '/fournisseurs', label: 'Fournisseurs', icon: BuildingIcon },
  { href: '/massrouf', label: 'Massrouf', icon: ReceiptIcon },
  { href: '/users', label: 'Utilisateurs', icon: UsersIcon, adminOnly: true },
  { href: '/settings', label: 'Réglages', icon: GearIcon, adminOnly: true },
];

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
      title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
      aria-label="Changer de thème"
    >
      {theme === 'dark' ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
    </button>
  );
}

function Avatar({ url, name }: { url?: string | null; name: string }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={getAssetUrl(url)}
        alt={name}
        className="h-8 w-8 rounded-full object-cover ring-2 ring-white dark:ring-slate-800"
      />
    );
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-xs font-semibold text-white ring-2 ring-white dark:ring-slate-800">
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function CanaouiteBadge() {
  const { data } = useQuery({
    queryKey: ['treasury', 'balance'],
    queryFn: () => api.get<{ balance: number }>('/treasury/balance'),
    refetchInterval: 30_000,
  });

  if (!data) return null;

  return (
    <Link
      href="/canaouite"
      className={`rounded-full px-3 py-1 text-xs font-semibold transition-opacity hover:opacity-80 ${
        data.balance >= 0
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
          : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
      }`}
      title="Voir l'historique de la Canaouite"
    >
      Canaouite : {formatDT(data.balance)}
    </Link>
  );
}

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const links = LINKS.filter((l) => !l.adminOnly || user.role === 'ADMIN');

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-md dark:border-slate-800/70 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex min-w-0 items-center gap-6">
          <Link
            href="/dashboard"
            className="shrink-0 bg-gradient-to-r from-blue-600 via-violet-600 to-emerald-500 bg-clip-text text-lg font-bold text-transparent"
          >
            Bi3Echri
          </Link>
          <nav className="hidden min-w-0 gap-1 overflow-x-auto md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  pathname.startsWith(link.href)
                    ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-sm shadow-blue-600/25'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <link.icon className="hidden h-4 w-4 lg:block" />
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="hidden shrink-0 items-center gap-3 md:flex">
          <ThemeToggle />
          <CanaouiteBadge />
          <Link
            href="/profile"
            className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Avatar url={user.avatarUrl} name={user.name} />
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {user.name} · {user.role === 'ADMIN' ? 'Admin' : 'Vendeur'}
            </span>
          </Link>
          <button
            onClick={logout}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-red-900/50 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          >
            Déconnexion
          </button>
        </div>
        <button
          className="rounded-lg border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 md:hidden"
          onClick={() => setOpen((o) => !o)}
        >
          Menu
        </button>
      </div>
      {open && (
        <nav className="animate-fade-in-up flex flex-col gap-1 border-t border-slate-200 px-4 py-3 md:hidden dark:border-slate-800">
          <div className="mb-2 flex items-center gap-3">
            <ThemeToggle />
            <CanaouiteBadge />
          </div>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                pathname.startsWith(link.href)
                  ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300"
          >
            Profil
          </Link>
          <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 dark:border-slate-800">
            <span className="text-sm text-slate-500 dark:text-slate-400">{user.name}</span>
            <button onClick={logout} className="text-sm font-medium text-red-600">
              Déconnexion
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
