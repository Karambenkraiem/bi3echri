'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { CashMovement, CashMovementType } from '@/lib/types';
import { formatDT } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, FieldLabel } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { PencilIcon, TrashIcon } from '@/components/ui/icons';
import { SortableHeader } from '@/components/ui/sortable-header';
import { useSort } from '@/lib/use-sort';

const TYPE_LABELS: Record<CashMovementType, string> = {
  RESET: 'Initialisation',
  PURCHASE: 'Achat',
  SALE: 'Vente',
  EXPENSE: 'Massrouf',
  MANUAL: 'Ajustement',
  INVESTMENT: 'Investissement',
};

const TYPE_COLORS: Record<CashMovementType, string> = {
  RESET: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  PURCHASE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  SALE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  EXPENSE: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  MANUAL: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  INVESTMENT: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
};

function AdjustForm() {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => api.post('/treasury/adjust', { amount: Number(amount), comment }),
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
      <dl className="grid grid-cols-2 gap-3 text-sm">
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
        <p className="text-xs text-slate-500">
          Ce type de mouvement ne peut pas être modifié depuis cet écran.
        </p>
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
            Solde : {formatDT(balanceData.balance)}
          </span>
        )}
      </div>

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

      <Modal open={!!detailTarget} onClose={() => setDetailTarget(null)} title="Détail du mouvement">
        {detailTarget && (
          <MovementDetailModal
            movement={detailTarget}
            canManage={canManage(detailTarget)}
            minAmount={detailTarget.type === 'INVESTMENT' ? 0 : undefined}
            onClose={() => setDetailTarget(null)}
          />
        )}
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
