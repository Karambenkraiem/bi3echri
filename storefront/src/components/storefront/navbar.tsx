'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/lib/theme-context';
import { useClientAuth } from '@/lib/client-auth-context';
import { getAssetUrl } from '@/lib/api';
import { SunIcon, MoonIcon, UserIcon, BoxIcon } from '@/components/ui/icons';

const LINKS = [
  { href: '/', label: 'Accueil' },
  { href: '/produits', label: 'Produits' },
];

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
      title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
      aria-label="Changer de thème"
    >
      {theme === 'dark' ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
    </button>
  );
}

function Avatar({ url, name, className = 'h-8 w-8' }: { url?: string | null; name: string; className?: string }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={getAssetUrl(url)}
        alt={name}
        className={`${className} rounded-full object-cover ring-2 ring-white dark:ring-slate-800`}
      />
    );
  }
  return (
    <div
      className={`${className} flex items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-xs font-semibold text-white ring-2 ring-white dark:ring-slate-800`}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function AccountMenu({ client }: { client: { name: string; email?: string | null; avatarUrl?: string | null } }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { logout } = useClientAuth();

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <Avatar url={client.avatarUrl} name={client.name} />
        {client.name}
      </button>
      {open && (
        <div className="animate-fade-in-up absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-slate-200/70 bg-white p-1.5 shadow-lg dark:border-slate-800/70 dark:bg-slate-900">
          <div className="flex items-center gap-2 px-2 py-2">
            <Avatar url={client.avatarUrl} name={client.name} className="h-9 w-9" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                {client.name}
              </p>
              {client.email && (
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {client.email}
                </p>
              )}
            </div>
          </div>
          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
          <Link
            href="/compte"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Mes réservations et achats
          </Link>
          <Link
            href="/compte/profil"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Paramètres du profil
          </Link>
          <button
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="block w-full rounded-lg px-2 py-1.5 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            Déconnexion
          </button>
        </div>
      )}
    </div>
  );
}

export function StorefrontNavbar() {
  const pathname = usePathname();
  const { client, logout } = useClientAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-md dark:border-slate-800/70 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 via-blue-600 to-emerald-500 bg-clip-text text-lg font-bold text-transparent"
          >
            <BoxIcon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            bi3wechri.net
          </Link>
          <nav className="hidden gap-1 md:flex">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  pathname === link.href
                    ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-sm shadow-violet-600/25'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {client ? (
            <AccountMenu client={client} />
          ) : (
            <Link
              href="/compte/connexion"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <UserIcon className="h-4 w-4" />
              Mon compte
            </Link>
          )}
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
          <div className="mb-2">
            <ThemeToggle />
          </div>
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                pathname === link.href
                  ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {client ? (
            <>
              <div className="mt-2 flex items-center gap-2 border-t border-slate-100 px-3 pt-3 dark:border-slate-800">
                <Avatar url={client.avatarUrl} name={client.name} />
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {client.name}
                </span>
              </div>
              <Link
                href="/compte"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300"
              >
                Mes réservations et achats
              </Link>
              <Link
                href="/compte/profil"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300"
              >
                Paramètres du profil
              </Link>
              <button
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                className="rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 dark:text-red-400"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <Link
              href="/compte/connexion"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300"
            >
              Mon compte
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
