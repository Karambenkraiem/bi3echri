import { LocationIcon, PhoneIcon } from '@/components/ui/icons';

export function StorefrontFooter() {
  return (
    <footer className="mt-16 border-t border-slate-200/70 bg-white/60 dark:border-slate-800/70 dark:bg-slate-950/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-slate-600 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <div className="bg-gradient-to-r from-violet-600 via-blue-600 to-emerald-500 bg-clip-text text-lg font-bold text-transparent">
          bi3wechri.net
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
          <span className="inline-flex items-center gap-2">
            <LocationIcon className="h-4 w-4 shrink-0 text-violet-500" />
            Goulette, Lac2, Lac3, Elkram
          </span>
          <a
            href="tel:55368999"
            className="inline-flex items-center gap-2 transition-colors hover:text-violet-600 dark:hover:text-violet-400"
          >
            <PhoneIcon className="h-4 w-4 shrink-0 text-violet-500" />
            55 368 999
          </a>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          © {new Date().getFullYear()} bi3wechri.net. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
