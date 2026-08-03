'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { useAuth } from '@/lib/auth-context';
import { api, getAssetUrl } from '@/lib/api';
import {
  Article,
  CashMovement,
  CashMovementType,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  PaymentMethod,
  Sale,
} from '@/lib/types';
import { formatDT } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, FieldLabel, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { PencilIcon, TrashIcon, BoxIcon } from '@/components/ui/icons';
import { SortableHeader } from '@/components/ui/sortable-header';
import { useSort } from '@/lib/use-sort';

const TYPE_LABELS: Record<CashMovementType, string> = {
  RESET: 'Initialisation',
  PURCHASE: 'Achat',
  SALE: 'Vente',
  EXPENSE: 'Massrouf',
  MANUAL: 'Ajustement',
  INVESTMENT: 'Investissement',
  RETOUR: 'Retour',
};

const TYPE_COLORS: Record<CashMovementType, string> = {
  RESET: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  PURCHASE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  SALE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  EXPENSE: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  MANUAL: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  INVESTMENT: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  RETOUR: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
};

function AdjustForm() {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/treasury/adjust', { amount: Number(amount), comment, paymentMethod }),
    onSuccess: () => {
      setAmount('');
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['treasury'] });
    },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : 'Erreur'),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!confirm(`Ajuster la Canaouite de ${amount} DT ?`)) return;
    mutation.mutate();
  }

  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
        Ajuster le solde
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div>
          <FieldLabel htmlFor="adjust-amount">Montant (DT, + ou -)</FieldLabel>
          <Input
            id="adjust-amount"
            type="number"
            step="0.001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-40"
            placeholder="Ex: -20 ou 20"
            required
          />
        </div>
        <div className="flex-1">
          <FieldLabel htmlFor="adjust-comment">Raison</FieldLabel>
          <Input
            id="adjust-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ex: correction d'écart de caisse"
            required
          />
        </div>
        <div>
          <FieldLabel htmlFor="adjust-payment-method">Modalité</FieldLabel>
          <Select
            id="adjust-payment-method"
            className="w-40"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {PAYMENT_METHOD_LABELS[m]}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Envoi...' : 'Ajuster'}
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </Card>
  );
}

function InvestForm() {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => api.post('/treasury/invest', { amount: Number(amount), comment }),
    onSuccess: () => {
      setAmount('');
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['treasury'] });
    },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : 'Erreur'),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!confirm(`Alimenter la Canaouite de ${amount} DT ?`)) return;
    mutation.mutate();
  }

  return (
    <Card>
      <h2 className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">
        Alimenter la Canaouite
      </h2>
      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
        Pour enregistrer un investissement externe (apport de capital, etc.) comme entrée.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div>
          <FieldLabel htmlFor="invest-amount">Montant (DT)</FieldLabel>
          <Input
            id="invest-amount"
            type="number"
            min="0"
            step="0.001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-40"
            required
          />
        </div>
        <div className="flex-1">
          <FieldLabel htmlFor="invest-comment">Origine de l&apos;investissement</FieldLabel>
          <Input
            id="invest-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ex: apport personnel, associé..."
            required
          />
        </div>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Envoi...' : 'Alimenter'}
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </Card>
  );
}

function CommentEditor({ movement }: { movement: CashMovement }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [comment, setComment] = useState(movement.comment ?? '');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => api.patch(`/treasury/movements/${movement.id}/comment`, { comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treasury'] });
      setEditing(false);
    },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : 'Erreur'),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!confirm('Enregistrer ce commentaire ?')) return;
    mutation.mutate();
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:underline dark:text-violet-400"
      >
        <PencilIcon className="h-3.5 w-3.5" />
        Modifier le commentaire
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <FieldLabel htmlFor={`comment-${movement.id}`}>Commentaire</FieldLabel>
      <Input
        id={`comment-${movement.id}`}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Ajouter un commentaire..."
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
          Annuler
        </Button>
      </div>
    </form>
  );
}

function SaleMovementDetail({ movement }: { movement: CashMovement }) {
  const { data: sale, isLoading, isError } = useQuery({
    queryKey: ['sales', movement.saleId],
    queryFn: () => api.get<Sale>(`/sales/${movement.saleId}`),
    enabled: !!movement.saleId,
    retry: false,
  });

  if (!movement.saleId || isError) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
            Supprimé
          </span>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Cette vente a depuis été annulée (retour en stock) — le détail de l&apos;article
            n&apos;est plus disponible, mais les informations du mouvement restent ci-dessous.
          </p>
        </div>
        <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-3 text-sm [&_dd]:min-w-0 [&_dd]:break-words">
          <dt className="text-slate-500">Montant</dt>
          <dd className="text-emerald-600">{formatDT(Number(movement.amount))}</dd>
          <dt className="text-slate-500">Date</dt>
          <dd>{new Date(movement.createdAt).toLocaleString('fr-FR')}</dd>
          <dt className="text-slate-500">Commentaire</dt>
          <dd>{movement.comment ?? '—'}</dd>
          <dt className="text-slate-500">Par</dt>
          <dd>{movement.createdBy?.name ?? '—'}</dd>
        </dl>
        <CommentEditor movement={movement} />
      </div>
    );
  }

  if (isLoading || !sale) {
    return <p className="text-sm text-slate-500">Chargement...</p>;
  }

  const photo = sale.article?.photos?.[0];
  const purchasePrice = Number(sale.article?.purchasePrice ?? 0);
  const margin = Number(sale.salePrice) - purchasePrice;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={getAssetUrl(photo.url)} alt="" className="h-full w-full object-cover" />
          ) : (
            <BoxIcon className="h-6 w-6 text-slate-300" />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900 dark:text-white">
            {sale.article?.name ?? 'Article introuvable'}
          </p>
          <p className="text-sm text-slate-500">{sale.article?.category?.name}</p>
        </div>
      </div>

      <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-3 text-sm [&_dd]:min-w-0 [&_dd]:break-words">
        <dt className="text-slate-500">Prix de vente</dt>
        <dd className="font-medium text-emerald-600">{formatDT(Number(sale.salePrice))}</dd>
        <dt className="text-slate-500">Marge</dt>
        <dd className={margin >= 0 ? 'text-emerald-600' : 'text-red-600'}>{formatDT(margin)}</dd>
        <dt className="text-slate-500">Date de vente</dt>
        <dd>{new Date(sale.saleDate).toLocaleDateString('fr-FR')}</dd>
        <dt className="text-slate-500">Acheteur</dt>
        <dd>{sale.buyerName || '—'}</dd>
        <dt className="text-slate-500">Contact</dt>
        <dd>{sale.buyerContact || '—'}</dd>
        <dt className="text-slate-500">Canal</dt>
        <dd>{sale.adChannel}</dd>
        {sale.notes && (
          <>
            <dt className="text-slate-500">Notes</dt>
            <dd className="whitespace-pre-wrap">{sale.notes}</dd>
          </>
        )}
        <dt className="text-slate-500">Vendu par</dt>
        <dd>{sale.soldBy?.name ?? '—'}</dd>
        <dt className="text-slate-500">Commentaire (mouvement)</dt>
        <dd>{movement.comment ?? '—'}</dd>
      </dl>

      <CommentEditor movement={movement} />

      {sale.article && (
        <Link
          href={`/articles/${sale.article.id}`}
          className="text-sm font-medium text-violet-600 hover:underline dark:text-violet-400"
        >
          Voir la fiche article →
        </Link>
      )}
    </div>
  );
}

function PurchaseMovementDetail({ movement }: { movement: CashMovement }) {
  const { data: article, isLoading, isError } = useQuery({
    queryKey: ['articles', movement.articleId],
    queryFn: () => api.get<Article>(`/articles/${movement.articleId}`),
    enabled: !!movement.articleId,
    retry: false,
  });

  if (!movement.articleId || isError) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
            Supprimé
          </span>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            L&apos;article lié à cet achat a été supprimé depuis, mais les informations du
            mouvement restent ci-dessous.
          </p>
        </div>
        <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-3 text-sm [&_dd]:min-w-0 [&_dd]:break-words">
          <dt className="text-slate-500">Montant</dt>
          <dd className="text-red-600">{formatDT(Number(movement.amount))}</dd>
          <dt className="text-slate-500">Date</dt>
          <dd>{new Date(movement.createdAt).toLocaleString('fr-FR')}</dd>
          <dt className="text-slate-500">Commentaire</dt>
          <dd>{movement.comment ?? '—'}</dd>
          <dt className="text-slate-500">Par</dt>
          <dd>{movement.createdBy?.name ?? '—'}</dd>
        </dl>
        <CommentEditor movement={movement} />
      </div>
    );
  }

  if (isLoading || !article) {
    return <p className="text-sm text-slate-500">Chargement...</p>;
  }

  const photo = article.photos?.[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={getAssetUrl(photo.url)} alt="" className="h-full w-full object-cover" />
          ) : (
            <BoxIcon className="h-6 w-6 text-slate-300" />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900 dark:text-white">{article.name}</p>
          <p className="text-sm text-slate-500">{article.category?.name}</p>
        </div>
      </div>

      <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-3 text-sm [&_dd]:min-w-0 [&_dd]:break-words">
        <dt className="text-slate-500">Montant de l&apos;achat</dt>
        <dd className="font-medium text-red-600">{formatDT(Math.abs(Number(movement.amount)))}</dd>
        <dt className="text-slate-500">Prix d&apos;achat article</dt>
        <dd>{formatDT(Number(article.purchasePrice))}</dd>
        <dt className="text-slate-500">Date d&apos;achat</dt>
        <dd>{new Date(article.purchaseDate).toLocaleDateString('fr-FR')}</dd>
        <dt className="text-slate-500">Fournisseur / où acheté</dt>
        <dd>{article.purchaseSource || '—'}</dd>
        <dt className="text-slate-500">Quantité</dt>
        <dd>{article.quantity}</dd>
        <dt className="text-slate-500">Commentaire (mouvement)</dt>
        <dd>{movement.comment ?? '—'}</dd>
        <dt className="text-slate-500">Par</dt>
        <dd>{movement.createdBy?.name ?? '—'}</dd>
      </dl>

      <CommentEditor movement={movement} />

      <Link
        href={`/articles/${article.id}`}
        className="text-sm font-medium text-violet-600 hover:underline dark:text-violet-400"
      >
        Voir la fiche article →
      </Link>
    </div>
  );
}

function MovementDetailModal({
  movement,
  canManage,
  minAmount,
  onClose,
}: {
  movement: CashMovement;
  canManage: boolean;
  minAmount?: number;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(String(Math.abs(Number(movement.amount))));
  const [comment, setComment] = useState(movement.comment ?? '');
  const [error, setError] = useState<string | null>(null);

  const wasNegative = Number(movement.amount) < 0;

  const updateMutation = useMutation({
    mutationFn: () =>
      api.patch(`/treasury/movements/${movement.id}`, {
        amount: wasNegative ? -Math.abs(Number(amount)) : Math.abs(Number(amount)),
        comment,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treasury'] });
      onClose();
    },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : 'Erreur'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/treasury/movements/${movement.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treasury'] });
      onClose();
    },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : 'Erreur'),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!confirm('Enregistrer les modifications de ce mouvement ?')) return;
    updateMutation.mutate();
  }

  if (editing) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <FieldLabel htmlFor="mv-amount">Montant (DT)</FieldLabel>
          <Input
            id="mv-amount"
            type="number"
            min={minAmount ?? undefined}
            step="0.001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div>
          <FieldLabel htmlFor="mv-comment">Commentaire</FieldLabel>
          <Input id="mv-comment" value={comment} onChange={(e) => setComment(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
            Annuler
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-3 text-sm [&_dd]:min-w-0 [&_dd]:break-words">
        <dt className="text-slate-500">Type</dt>
        <dd>{TYPE_LABELS[movement.type]}</dd>
        <dt className="text-slate-500">Montant</dt>
        <dd className={Number(movement.amount) >= 0 ? 'text-emerald-600' : 'text-red-600'}>
          {formatDT(Number(movement.amount))}
        </dd>
        <dt className="text-slate-500">Date</dt>
        <dd>{new Date(movement.createdAt).toLocaleString('fr-FR')}</dd>
        <dt className="text-slate-500">Commentaire</dt>
        <dd>{movement.comment ?? '—'}</dd>
        <dt className="text-slate-500">Par</dt>
        <dd>{movement.createdBy?.name ?? '—'}</dd>
      </dl>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {canManage ? (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5"
          >
            <PencilIcon className="h-4 w-4" />
            Modifier
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (confirm('Supprimer ce mouvement ?')) {
                deleteMutation.mutate();
              }
            }}
            disabled={deleteMutation.isPending}
            className="inline-flex items-center gap-1.5"
          >
            <TrashIcon className="h-4 w-4" />
            Supprimer
          </Button>
        </div>
      ) : (
        <CommentEditor movement={movement} />
      )}
    </div>
  );
}

type SortKey = 'createdAt' | 'type' | 'amount' | 'comment' | 'createdBy';

function CanaouiteContent() {
  const { user } = useAuth();
  const [detailTarget, setDetailTarget] = useState<CashMovement | null>(null);

  const { data: balanceData } = useQuery({
    queryKey: ['treasury', 'balance'],
    queryFn: () => api.get<{ balance: number }>('/treasury/balance'),
  });

  const { data: balanceByMethod } = useQuery({
    queryKey: ['treasury', 'balance-by-method'],
    queryFn: () => api.get<Record<PaymentMethod, number>>('/treasury/balance-by-method'),
  });

  const { data: movements, isLoading } = useQuery({
    queryKey: ['treasury', 'movements'],
    queryFn: () => api.get<CashMovement[]>('/treasury/movements'),
  });

  const { sorted, sortKey, sortDirection, toggleSort } = useSort<CashMovement, SortKey>(
    movements,
    (m, key) => {
      switch (key) {
        case 'createdAt':
          return m.createdAt;
        case 'type':
          return m.type;
        case 'amount':
          return Number(m.amount);
        case 'comment':
          return m.comment ?? '';
        case 'createdBy':
          return m.createdBy?.name ?? '';
      }
    },
    'createdAt',
  );

  function canManage(movement: CashMovement) {
    if (user?.role === 'ADMIN') return movement.type === 'MANUAL' || movement.type === 'INVESTMENT';
    if (movement.type === 'MANUAL') return user?.role === 'VENDEUR';
    return false;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Canaouite</h1>
        {balanceData && (
          <span className="text-lg font-semibold text-slate-900 dark:text-white">
            Solde (Cash Espèce) : {formatDT(balanceData.balance)}
          </span>
        )}
      </div>

      {balanceByMethod && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PAYMENT_METHODS.map((m) => (
            <Card key={m} className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {PAYMENT_METHOD_LABELS[m]}
              </span>
              <span
                className={`text-xl font-bold ${
                  balanceByMethod[m] >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatDT(balanceByMethod[m])}
              </span>
            </Card>
          ))}
        </div>
      )}

      {(user?.role === 'VENDEUR' || user?.role === 'ADMIN') && <AdjustForm />}
      {user?.role === 'ADMIN' && <InvestForm />}

      <Card className="overflow-x-auto p-0">
        {isLoading ? (
          <p className="p-4 text-sm text-slate-500">Chargement...</p>
        ) : !sorted || sorted.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">Aucun mouvement enregistré.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-slate-800">
              <tr>
                <SortableHeader
                  active={sortKey === 'createdAt'}
                  direction={sortDirection}
                  onClick={() => toggleSort('createdAt')}
                >
                  Date
                </SortableHeader>
                <SortableHeader
                  active={sortKey === 'type'}
                  direction={sortDirection}
                  onClick={() => toggleSort('type')}
                >
                  Type
                </SortableHeader>
                <SortableHeader
                  active={sortKey === 'amount'}
                  direction={sortDirection}
                  onClick={() => toggleSort('amount')}
                >
                  Montant
                </SortableHeader>
                <th className="px-4 py-3">Modalité</th>
                <SortableHeader
                  active={sortKey === 'comment'}
                  direction={sortDirection}
                  onClick={() => toggleSort('comment')}
                >
                  Commentaire
                </SortableHeader>
                <SortableHeader
                  active={sortKey === 'createdBy'}
                  direction={sortDirection}
                  onClick={() => toggleSort('createdBy')}
                >
                  Par
                </SortableHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sorted.map((movement) => {
                const amount = Number(movement.amount);
                return (
                  <tr
                    key={movement.id}
                    onClick={() => setDetailTarget(movement)}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {new Date(movement.createdAt).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[movement.type]}`}
                      >
                        {TYPE_LABELS[movement.type]}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-3 font-medium ${amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                    >
                      {amount >= 0 ? '+' : ''}
                      {formatDT(amount)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {PAYMENT_METHOD_LABELS[movement.paymentMethod]}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {movement.comment ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {movement.createdBy?.name ?? '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      <Modal
        open={!!detailTarget}
        onClose={() => setDetailTarget(null)}
        title={
          detailTarget?.type === 'SALE'
            ? 'Article vendu'
            : detailTarget?.type === 'PURCHASE'
              ? 'Article acheté'
              : 'Détail du mouvement'
        }
      >
        {detailTarget &&
          (detailTarget.type === 'SALE' ? (
            <SaleMovementDetail movement={detailTarget} />
          ) : detailTarget.type === 'PURCHASE' ? (
            <PurchaseMovementDetail movement={detailTarget} />
          ) : (
            <MovementDetailModal
              movement={detailTarget}
              canManage={canManage(detailTarget)}
              minAmount={detailTarget.type === 'INVESTMENT' ? 0 : undefined}
              onClose={() => setDetailTarget(null)}
            />
          ))}
      </Modal>
    </div>
  );
}

export default function CanaouitePage() {
  return (
    <ProtectedRoute>
      <CanaouiteContent />
    </ProtectedRoute>
  );
}
