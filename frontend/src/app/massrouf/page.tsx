'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { api } from '@/lib/api';
import { Expense } from '@/lib/types';
import { formatDT } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, FieldLabel, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { PencilIcon, TrashIcon } from '@/components/ui/icons';
import { SortableHeader } from '@/components/ui/sortable-header';
import { useSort } from '@/lib/use-sort';

function ExpenseDetailModal({
  expense,
  onClose,
}: {
  expense: Expense;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(String(expense.amount));
  const [comment, setComment] = useState(expense.comment);
  const [error, setError] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: () => api.patch(`/expenses/${expense.id}`, { amount: Number(amount), comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['treasury'] });
      onClose();
    },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : 'Erreur'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/expenses/${expense.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
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
          <FieldLabel htmlFor="edit-amount">Montant (DT)</FieldLabel>
          <Input
            id="edit-amount"
            type="number"
            min="0"
            step="0.001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div>
          <FieldLabel htmlFor="edit-comment">Commentaire</FieldLabel>
          <Input
            id="edit-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
          />
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
        <dt className="text-slate-500">Montant</dt>
        <dd className="font-medium text-red-600">{formatDT(Number(expense.amount))}</dd>
        <dt className="text-slate-500">Date</dt>
        <dd>{new Date(expense.createdAt).toLocaleString('fr-FR')}</dd>
        <dt className="text-slate-500">Commentaire</dt>
        <dd>{expense.comment}</dd>
        <dt className="text-slate-500">Enregistré par</dt>
        <dd>{expense.createdBy?.name ?? '—'}</dd>
      </dl>
      {error && <p className="text-sm text-red-600">{error}</p>}
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
            if (confirm('Supprimer ce Massrouf ?')) {
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
    </div>
  );
}

type SortKey = 'createdAt' | 'amount' | 'comment' | 'createdBy';

function MassroufContent() {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [detailTarget, setDetailTarget] = useState<Expense | null>(null);
  const [userFilter, setUserFilter] = useState('');

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => api.get<Expense[]>('/expenses'),
  });

  const creators = useMemo(() => {
    const map = new Map<string, string>();
    expenses?.forEach((e) => {
      if (e.createdBy) map.set(e.createdBy.id, e.createdBy.name);
    });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [expenses]);

  const filtered = expenses?.filter((e) => !userFilter || e.createdBy?.id === userFilter);

  const { sorted, sortKey, sortDirection, toggleSort } = useSort<Expense, SortKey>(
    filtered,
    (e, key) => {
      switch (key) {
        case 'createdAt':
          return e.createdAt;
        case 'amount':
          return Number(e.amount);
        case 'comment':
          return e.comment;
        case 'createdBy':
          return e.createdBy?.name ?? '';
      }
    },
    'createdAt',
  );

  const createMutation = useMutation({
    mutationFn: () => api.post('/expenses', { amount: Number(amount), comment }),
    onSuccess: () => {
      setAmount('');
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['treasury'] });
    },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : 'Erreur'),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    createMutation.mutate();
  }

  const total = filtered?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Massrouf</h1>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          Total dépensé : {formatDT(total)}
        </span>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
          <div>
            <FieldLabel htmlFor="amount">Montant (DT)</FieldLabel>
            <Input
              id="amount"
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
            <FieldLabel htmlFor="comment">Où / pourquoi (brièvement)</FieldLabel>
            <Input
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ex: essence, transport, achat carton..."
              required
            />
          </div>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Ajout...' : 'Ajouter'}
          </Button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </Card>

      <Card className="flex flex-wrap gap-3">
        <Select value={userFilter} onChange={(e) => setUserFilter(e.target.value)} className="w-auto">
          <option value="">Tous les utilisateurs</option>
          {creators.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Card>

      <Card className="overflow-x-auto p-0">
        {isLoading ? (
          <p className="p-4 text-sm text-slate-500">Chargement...</p>
        ) : !sorted || sorted.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">Aucune dépense enregistrée.</p>
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
              {sorted.map((expense) => (
                <tr
                  key={expense.id}
                  onClick={() => setDetailTarget(expense)}
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {new Date(expense.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 font-medium text-red-600">
                    {formatDT(Number(expense.amount))}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {expense.comment}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {expense.createdBy?.name ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={!!detailTarget} onClose={() => setDetailTarget(null)} title="Détail du Massrouf">
        {detailTarget && (
          <ExpenseDetailModal expense={detailTarget} onClose={() => setDetailTarget(null)} />
        )}
      </Modal>
    </div>
  );
}

export default function MassroufPage() {
  return (
    <ProtectedRoute>
      <MassroufContent />
    </ProtectedRoute>
  );
}
