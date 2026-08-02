'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Article, AD_CHANNELS } from '@/lib/types';
import { Input, FieldLabel, Select, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatDT } from '@/lib/format';

export function SellForm({
  article,
  onSuccess,
  initialSalePrice,
  initialBuyerName,
  initialBuyerContact,
  initialAdChannel,
  orderId,
}: {
  article: Article;
  onSuccess: () => void;
  initialSalePrice?: number | string | null;
  initialBuyerName?: string;
  initialBuyerContact?: string;
  initialAdChannel?: string;
  orderId?: string;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    salePrice:
      initialSalePrice != null
        ? String(initialSalePrice)
        : article.expectedSalePrice != null
          ? String(article.expectedSalePrice)
          : '',
    saleDate: new Date().toISOString().slice(0, 10),
    buyerName: initialBuyerName ?? '',
    buyerContact: initialBuyerContact ?? '',
    adChannel: initialAdChannel ?? AD_CHANNELS[0],
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      api.post(`/articles/${article.id}/sell`, {
        salePrice: Number(form.salePrice),
        saleDate: form.saleDate,
        buyerName: form.buyerName || undefined,
        buyerContact: form.buyerContact || undefined,
        adChannel: form.adChannel,
        notes: form.notes || undefined,
        orderId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      onSuccess();
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : 'Erreur lors de la vente');
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!confirm(`Enregistrer la vente de "${article.name}" pour ${form.salePrice} DT ?`)) return;
    mutation.mutate();
  }

  const purchasePrice = Number(article.purchasePrice);
  const salePriceNum = Number(form.salePrice) || 0;
  const margin = salePriceNum - purchasePrice;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Vente de <span className="font-medium text-slate-900 dark:text-white">{article.name}</span>{' '}
        (acheté {formatDT(purchasePrice)})
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="salePrice">Prix de vente (DT)</FieldLabel>
          <Input
            id="salePrice"
            type="number"
            min="0"
            step="0.001"
            value={form.salePrice}
            onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
            required
          />
        </div>
        <div>
          <FieldLabel htmlFor="saleDate">Date de vente</FieldLabel>
          <Input
            id="saleDate"
            type="date"
            value={form.saleDate}
            onChange={(e) => setForm({ ...form, saleDate: e.target.value })}
            required
          />
        </div>
      </div>
      {form.salePrice && (
        <p className={`text-sm font-medium ${margin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          Marge estimée : {formatDT(margin)}
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="buyerName">Acheteur</FieldLabel>
          <Input
            id="buyerName"
            value={form.buyerName}
            onChange={(e) => setForm({ ...form, buyerName: e.target.value })}
            placeholder="Nom de l'acheteur"
          />
        </div>
        <div>
          <FieldLabel htmlFor="buyerContact">Contact</FieldLabel>
          <Input
            id="buyerContact"
            value={form.buyerContact}
            onChange={(e) => setForm({ ...form, buyerContact: e.target.value })}
            placeholder="Téléphone / email"
          />
        </div>
      </div>
      <div>
        <FieldLabel htmlFor="adChannel">Où l&apos;annonce a été trouvée / vendue</FieldLabel>
        <Select
          id="adChannel"
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
        <FieldLabel htmlFor="notes">Notes (optionnel)</FieldLabel>
        <Textarea
          id="notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={3}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={mutation.isPending} className="w-full">
        {mutation.isPending ? 'Enregistrement...' : 'Confirmer la vente'}
      </Button>
    </form>
  );
}
