'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Article } from '@/lib/types';
import { Input, FieldLabel } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function RestockForm({ article, onSuccess }: { article: Article; onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState('1');
  const [cost, setCost] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      api.post(`/articles/${article.id}/restock`, {
        quantity: Number(quantity),
        cost: cost ? Number(cost) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['treasury'] });
      onSuccess();
    },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : 'Erreur'),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    mutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Ajouter des unités au stock de{' '}
        <span className="font-medium text-slate-900 dark:text-white">{article.name}</span>{' '}
        (quantité actuelle : {article.quantity})
      </p>
      <div>
        <FieldLabel htmlFor="restock-quantity">Quantité à ajouter</FieldLabel>
        <Input
          id="restock-quantity"
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />
      </div>
      <div>
        <FieldLabel htmlFor="restock-cost">Coût total de cet ajout (DT, optionnel)</FieldLabel>
        <Input
          id="restock-cost"
          type="number"
          min="0"
          step="0.001"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          placeholder="Laisser vide si aucun nouvel achat"
        />
        <p className="mt-1 text-xs text-slate-500">
          Si renseigné, ce montant est déduit de la Canaouite comme un achat.
        </p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={mutation.isPending} className="w-full">
        {mutation.isPending ? 'Enregistrement...' : 'Ajouter au stock'}
      </Button>
    </form>
  );
}
