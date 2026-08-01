'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useClientAuth } from '@/lib/client-auth-context';
import { Product, OrderType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input, FieldLabel, Textarea } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { CheckCircleIcon } from '@/components/ui/icons';

export function OrderModal({
  product,
  type,
  open,
  onClose,
}: {
  product: Product;
  type: OrderType;
  open: boolean;
  onClose: () => void;
}) {
  const { client } = useClientAuth();
  const [quantity, setQuantity] = useState('1');
  const [customerName, setCustomerName] = useState(client?.name ?? '');
  const [customerPhone, setCustomerPhone] = useState(client?.phone ?? '');
  const [customerEmail, setCustomerEmail] = useState(client?.email ?? '');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      api.post<{ id: string }>('/public/orders', {
        articleId: product.id,
        quantity: Number(quantity),
        type,
        customerName,
        customerPhone,
        customerEmail: customerEmail || undefined,
        notes: notes || undefined,
      }),
    onSuccess: (order) => setCreatedOrderId(order.id),
    onError: (err: unknown) => setError(err instanceof Error ? err.message : 'Erreur'),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    mutation.mutate();
  }

  function handleClose() {
    setCreatedOrderId(null);
    setNotes('');
    onClose();
  }

  const title =
    type === 'RESERVATION'
      ? 'Réserver cet article'
      : type === 'NEGOCIATION'
        ? 'Négocier le prix'
        : 'Acheter cet article';

  return (
    <Modal open={open} onClose={handleClose} title={title}>
      {createdOrderId ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircleIcon className="h-12 w-12 text-emerald-500" />
          <p className="text-lg font-semibold text-slate-900 dark:text-white">
            Demande envoyée !
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {type === 'NEGOCIATION'
              ? `Un vendeur va vous contacter au ${customerPhone} pour discuter du prix. Vous pourrez choisir d'acheter ou d'abandonner à tout moment.`
              : `Nous vous contacterons très prochainement au ${customerPhone} pour finaliser ${
                  type === 'RESERVATION' ? 'votre réservation' : 'votre achat'
                }.`}
          </p>
          <Link
            href={`/suivi/${createdOrderId}`}
            className="mt-1 text-sm font-medium text-violet-600 hover:underline dark:text-violet-400"
          >
            Suivre ma demande et négocier le prix →
          </Link>
          <Button onClick={handleClose} className="mt-2">
            Fermer
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Aucune inscription requise. Laissez vos coordonnées, nous vous recontactons pour{' '}
            {type === 'RESERVATION'
              ? 'confirmer la réservation'
              : type === 'NEGOCIATION'
                ? 'négocier le prix'
                : 'finaliser l’achat'}
            .
          </p>
          <div>
            <FieldLabel htmlFor="order-quantity">Quantité</FieldLabel>
            <Input
              id="order-quantity"
              type="number"
              min="1"
              max={product.quantity}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>
          <div>
            <FieldLabel htmlFor="order-name">Nom complet</FieldLabel>
            <Input
              id="order-name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </div>
          <div>
            <FieldLabel htmlFor="order-phone">Téléphone</FieldLabel>
            <Input
              id="order-phone"
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Ex: 55 368 999"
              required
            />
          </div>
          <div>
            <FieldLabel htmlFor="order-email">Email (optionnel)</FieldLabel>
            <Input
              id="order-email"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
          </div>
          <div>
            <FieldLabel htmlFor="order-notes">Note (optionnel)</FieldLabel>
            <Textarea
              id="order-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: disponibilité, question sur l'article..."
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? 'Envoi...' : 'Confirmer la demande'}
          </Button>
        </form>
      )}
    </Modal>
  );
}
