'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Sale, AD_CHANNELS } from '@/lib/types';
import { Input, FieldLabel, Select, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function EditSaleForm({ sale, onDone }: { sale: Sale; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    salePrice: String(sale.salePrice),
    saleDate: sale.saleDate.slice(0, 10),
    buyerName: sale.buyerName ?? '',
    buyerContact: sale.buyerContact ?? '',
    adChannel: sale.adChannel,
    notes: sale.notes ?? '',
  });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      api.patch(`/sales/${sale.id}`, {
        salePrice: Number(form.salePrice),
        saleDate: form.saleDate,
        buyerName: form.buyerName || undefined,
        buyerContact: form.buyerContact || undefined,
        adChannel: form.adChannel,
        notes: form.notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['treasury'] });
      onDone();
    },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : 'Erreur'),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!confirm('Enregistrer les modifications de cette vente ?')) return;
    mutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor="edit-salePrice">Prix de vente (DT)</FieldLabel>
          <Input
            id="edit-salePrice"
            type="number"
            min="0"
            step="0.001"
            value={form.salePrice}
            onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
            required
          />
        </div>
        <div>
          <FieldLabel htmlFor="edit-saleDate">Date de vente</FieldLabel>
          <Input
            id="edit-saleDate"
            type="date"
            value={form.saleDate}
            onChange={(e) => setForm({ ...form, saleDate: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor="edit-buyerName">Acheteur</FieldLabel>
          <Input
            id="edit-buyerName"
            value={form.buyerName}
            onChange={(e) => setForm({ ...form, buyerName: e.target.value })}
            placeholder="Nom de l'acheteur"
          />
        </div>
        <div>
          <FieldLabel htmlFor="edit-buyerContact">Contact</FieldLabel>
          <Input
            id="edit-buyerContact"
            value={form.buyerContact}
            onChange={(e) => setForm({ ...form, buyerContact: e.target.value })}
            placeholder="Téléphone / email"
          />
        </div>
      </div>
      <div>
        <FieldLabel htmlFor="edit-adChannel">Où l&apos;annonce a été trouvée / vendue</FieldLabel>
        <Select
          id="edit-adChannel"
          value={form.adChannel}
          onChange={(e) => setForm({ ...form, adChannel: e.target.value })}
        >
          {AD_CHANNELS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <FieldLabel htmlFor="edit-notes">Notes (optionnel)</FieldLabel>
        <Textarea
          id="edit-notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={3}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </Button>
        <Button type="button" variant="secondary" onClick={onDone}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
