'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatRelativeTime } from '@/lib/format';
import { Order, OrderType } from '@/lib/types';
import { BoxIcon, BellIcon, ChatIcon } from '@/components/ui/icons';

const SEEN_STORAGE_KEY = 'bi3echri_seen_order_ids';

const TYPE_META: Record<OrderType, { label: string; icon: typeof BoxIcon; iconBg: string; text: string }> = {
  NEGOCIATION: {
    label: 'a lancé une négociation sur',
    icon: ChatIcon,
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  RESERVATION: {
    label: 'souhaite réserver',
    icon: BoxIcon,
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    text: 'text-amber-600 dark:text-amber-400',
  },
  ACHAT: {
    label: 'souhaite acheter',
    icon: BellIcon,
    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
    text: 'text-blue-600 dark:text-blue-400',
  },
};

function loadSeenIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(SEEN_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveSeenIds(ids: Set<string>) {
  localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify([...ids]));
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [seenIds, setSeenIds] = useState<Set<string>>(() => new Set());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSeenIds(loadSeenIds());
  }, []);

  const { data: orders } = useQuery({
    queryKey: ['orders', 'EN_ATTENTE'],
    queryFn: () => api.get<Order[]>('/orders?status=EN_ATTENTE'),
    refetchInterval: 15_000,
  });

  const list = orders ?? [];
  const unreadCount = list.filter((o) => !seenIds.has(o.id)).length;

  useEffect(() => {
    if (!open || list.length === 0) return;
    const next = new Set(seenIds);
    list.forEach((o) => next.add(o.id));
    setSeenIds(next);
    saveSeenIds(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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

  function goToOrders() {
    setOpen(false);
    router.push('/commandes');
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        aria-label="Notifications"
        title="Notifications"
      >
        <BellIcon className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-950">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="animate-fade-in-up absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-lg dark:border-slate-800/70 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-3.5 py-2.5 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</p>
          </div>

          <div className="max-h-96 overflow-y-auto p-1.5">
            {list.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                Aucune commande en attente.
              </p>
            ) : (
              list.map((order) => {
                const meta = TYPE_META[order.type];
                const Icon = meta.icon;
                const isUnread = !seenIds.has(order.id);
                return (
                  <button
                    key={order.id}
                    onClick={goToOrders}
                    className={`flex w-full items-start gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/60 ${
                      isUnread ? 'bg-blue-50/70 dark:bg-blue-500/10' : ''
                    }`}
                  >
                    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.iconBg}`}>
                      <Icon className={`h-4 w-4 ${meta.text}`} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-slate-700 dark:text-slate-200">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {order.customerName}
                        </span>{' '}
                        {meta.label}{' '}
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {order.article.name}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                        {formatRelativeTime(order.createdAt)}
                      </span>
                    </span>
                    {isUnread && (
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500" aria-hidden />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {list.length > 0 && (
            <button
              onClick={goToOrders}
              className="block w-full border-t border-slate-100 px-3.5 py-2.5 text-center text-sm font-medium text-violet-600 hover:bg-slate-50 dark:border-slate-800 dark:text-violet-400 dark:hover:bg-slate-800/60"
            >
              Voir toutes les commandes
            </button>
          )}
        </div>
      )}
    </div>
  );
}
