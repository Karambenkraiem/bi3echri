'use client';

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getAssetUrl } from '@/lib/api';
import { Message, Order, OrderStatus, OrderType } from '@/lib/types';
import { formatDT } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, FieldLabel } from '@/components/ui/input';
import { SellForm } from '@/components/articles/sell-form';

const ATTACHMENT_ACCEPT = 'image/*,video/mp4,video/webm,video/quicktime,application/pdf';

function MessageAttachment({ message }: { message: Message }) {
  if (!message.attachmentUrl) return null;
  const url = getAssetUrl(message.attachmentUrl);
  if (message.attachmentType === 'IMAGE') {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="mb-1 block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" className="max-h-48 rounded-md object-contain" />
      </a>
    );
  }
  if (message.attachmentType === 'VIDEO') {
    return (
      <video controls className="mb-1 max-h-48 max-w-full rounded-md">
        <source src={url} />
      </video>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mb-1 flex items-center gap-1.5 rounded-md bg-black/10 px-2 py-1.5 text-xs underline dark:bg-white/10"
    >
      📄 {message.attachmentName ?? 'Document'}
    </a>
  );
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  EN_ATTENTE: 'En attente',
  CONFIRMEE: 'Confirmée',
  ANNULEE: 'Annulée',
  VENDU: 'Vendu',
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  EN_ATTENTE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  CONFIRMEE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  ANNULEE: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  VENDU: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
};

export const TYPE_LABELS: Record<OrderType, string> = {
  RESERVATION: 'Réservation',
  ACHAT: 'Achat',
  NEGOCIATION: 'Négociation',
};

export function formatDeadline(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function OrderChat({ order, floorPrice }: { order: Order; floorPrice: number }) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useQuery({
    queryKey: ['orders', order.id, 'messages'],
    queryFn: () => api.get<Message[]>(`/orders/${order.id}/messages`),
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages?.length]);

  const sendMutation = useMutation({
    mutationFn: () => {
      const formData = new FormData();
      if (body.trim()) formData.append('body', body.trim());
      if (file) formData.append('file', file);
      return api.upload(`/orders/${order.id}/messages`, formData);
    },
    onSuccess: () => {
      setBody('');
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ['orders', order.id, 'messages'] });
    },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : 'Erreur'),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!body.trim() && !file) return;
    sendMutation.mutate();
  }

  function handleFileSelected(e: ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
    e.target.value = '';
  }

  const draftNumbers = (body.match(/\d+([.,]\d+)?/g) ?? []).map((n) =>
    Number(n.replace(',', '.')),
  );
  const belowFloor = floorPrice > 0 && draftNumbers.some((n) => n > 0 && n < floorPrice);

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={listRef}
        className="flex max-h-96 flex-col gap-2 overflow-y-auto rounded-lg border border-slate-200 p-3 dark:border-slate-700"
      >
        {isLoading ? (
          <p className="text-xs text-slate-500">Chargement...</p>
        ) : !messages || messages.length === 0 ? (
          <p className="text-xs text-slate-500">Aucun message pour le moment.</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                m.sender === 'STAFF'
                  ? 'ml-auto bg-gradient-to-r from-blue-600 to-violet-600 text-white'
                  : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
              }`}
            >
              <MessageAttachment message={m} />
              {m.body && <p className="whitespace-pre-wrap">{m.body}</p>}
              <p className={`mt-1 text-[10px] ${m.sender === 'STAFF' ? 'text-white/70' : 'text-slate-400'}`}>
                {m.sender === 'STAFF' ? (m.createdBy?.name ?? 'Staff') : 'Client'} ·{' '}
                {new Date(m.createdAt).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-1">
        {file && (
          <div className="flex items-center gap-2 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            📎 {file.name}
            <button
              type="button"
              onClick={() => setFile(null)}
              className="ml-auto text-slate-400 hover:text-red-600"
              aria-label="Retirer le fichier"
            >
              ✕
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            id="order-chat-file"
            type="file"
            accept={ATTACHMENT_ACCEPT}
            onChange={handleFileSelected}
            className="hidden"
          />
          <label
            htmlFor="order-chat-file"
            className="flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-300 px-3 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            title="Joindre une image, vidéo ou document"
          >
            📎
          </label>
          <Input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Répondre au client..."
          />
          <Button type="submit" disabled={sendMutation.isPending || (!body.trim() && !file)}>
            Envoyer
          </Button>
        </div>
        {belowFloor && (
          <p className="text-xs font-medium text-red-600">
            ⚠ Ce montant semble inférieur au dernier prix ({formatDT(floorPrice)}).
          </p>
        )}
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

export function OrderDetail({ order, autoOpenSell }: { order: Order; autoOpenSell?: boolean }) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState(order.notes ?? '');
  const [notesError, setNotesError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showSellForm, setShowSellForm] = useState(!!autoOpenSell);
  const [agreedPrice, setAgreedPrice] = useState(
    order.agreedPrice != null
      ? String(order.agreedPrice)
      : order.article.expectedSalePrice != null
        ? String(order.article.expectedSalePrice)
        : '',
  );

  const notesMutation = useMutation({
    mutationFn: (data: { notes: string }) => api.patch(`/orders/${order.id}`, data),
    onSuccess: () => {
      setNotesError(null);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err: unknown) => setNotesError(err instanceof Error ? err.message : 'Erreur'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { status?: OrderStatus; agreedPrice?: number }) =>
      api.patch(`/orders/${order.id}`, data),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err: unknown) => setActionError(err instanceof Error ? err.message : 'Erreur'),
  });

  const renewMutation = useMutation({
    mutationFn: () => api.post(`/orders/${order.id}/renew`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
    onError: (err: unknown) => setActionError(err instanceof Error ? err.message : 'Erreur'),
  });

  function handleSaveNotes(e: FormEvent) {
    e.preventDefault();
    setNotesError(null);
    notesMutation.mutate({ notes });
  }

  function handleConfirm(e: FormEvent) {
    e.preventDefault();
    setActionError(null);
    const price = Number(agreedPrice);
    if (!agreedPrice || Number.isNaN(price) || price <= 0) {
      setActionError('Merci de saisir le prix convenu avec le client avant de confirmer.');
      return;
    }
    updateMutation.mutate({ status: 'CONFIRMEE', agreedPrice: price });
  }

  const photo = order.article.photos?.[0];
  const floorPrice = Number(order.article.floorPrice ?? order.article.expectedSalePrice ?? 0);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr_320px] lg:items-start">
      {/* Colonne gauche : infos + notes */}
      <div className="flex flex-col gap-4">
        <Card className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            {photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getAssetUrl(photo.url)}
                alt=""
                className="h-14 w-14 shrink-0 rounded-md border border-slate-200 object-cover dark:border-slate-700"
              />
            )}
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-900 dark:text-white">
                {order.article.name}
              </p>
              <p className="text-sm text-slate-500">
                {TYPE_LABELS[order.type]} · Qté {order.quantity} ·{' '}
                {formatDT(Number(order.article.expectedSalePrice ?? 0))}
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-3 text-sm [&_dd]:min-w-0 [&_dd]:break-words">
            <dt className="text-slate-500">Statut</dt>
            <dd>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status]}`}
              >
                {STATUS_LABELS[order.status]}
              </span>
            </dd>
            <dt className="text-slate-500">Date</dt>
            <dd>{new Date(order.createdAt).toLocaleString('fr-FR')}</dd>
            <dt className="text-slate-500">Client</dt>
            <dd>{order.customerName}</dd>
            <dt className="text-slate-500">Téléphone</dt>
            <dd>{order.customerPhone}</dd>
            <dt className="text-slate-500">Email</dt>
            <dd>{order.customerEmail || '—'}</dd>
            <dt className="text-slate-500">Compte client</dt>
            <dd>{order.client ? 'Inscrit' : 'Invité'}</dd>
            {order.status === 'CONFIRMEE' && order.agreedPrice != null && (
              <>
                <dt className="text-slate-500">Prix convenu</dt>
                <dd className="font-semibold text-slate-900 dark:text-white">
                  {formatDT(Number(order.agreedPrice))}
                </dd>
              </>
            )}
            {order.status === 'CONFIRMEE' && order.retraitDeadline && (
              <>
                <dt className="text-slate-500">Retrait avant</dt>
                <dd className="font-medium text-emerald-700 dark:text-emerald-400">
                  {formatDeadline(order.retraitDeadline)}
                </dd>
              </>
            )}
          </dl>
        </Card>

        <Card>
          <form onSubmit={handleSaveNotes} className="flex flex-col gap-2">
            <FieldLabel htmlFor="order-notes">Notes internes</FieldLabel>
            <Input
              id="order-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: contacté le 30/07, viendra samedi..."
            />
            {notesError && <p className="text-sm text-red-600">{notesError}</p>}
            <Button type="submit" variant="secondary" disabled={notesMutation.isPending}>
              Enregistrer les notes
            </Button>
          </form>
        </Card>
      </div>

      {/* Colonne centrale : discussion / négociation */}
      <Card className="flex min-w-0 flex-col gap-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Discussion / négociation
        </h3>
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 shadow-sm dark:bg-red-900/30 dark:text-red-300">
          <span>⚠ Dernier prix : {formatDT(floorPrice)}</span>
          <span className="text-xs font-normal">Ne pas descendre en dessous</span>
        </div>
        <OrderChat order={order} floorPrice={floorPrice} />
      </Card>

      {/* Colonne droite : confirmation / actions */}
      <Card className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Actions</h3>
        {actionError && <p className="text-sm text-red-600">{actionError}</p>}

        {order.status === 'EN_ATTENTE' && (
          <form onSubmit={handleConfirm} className="flex flex-col gap-2">
            <FieldLabel htmlFor="agreed-price">Prix convenu avec le client (DT)</FieldLabel>
            <Input
              id="agreed-price"
              type="number"
              min="0"
              step="0.01"
              value={agreedPrice}
              onChange={(e) => setAgreedPrice(e.target.value)}
              placeholder="Ex: 180"
            />
            <div className="flex flex-col gap-2">
              <Button type="submit" disabled={updateMutation.isPending}>
                Confirmer avec ce prix
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => updateMutation.mutate({ status: 'ANNULEE' })}
                disabled={updateMutation.isPending}
              >
                Annuler
              </Button>
            </div>
          </form>
        )}

        {order.status === 'VENDU' && (
          <p className="rounded-lg bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
            ✓ Article vendu et récupéré par le client.
          </p>
        )}

        {order.status === 'CONFIRMEE' && order.article.status === 'VENDU' && (
          <div className="flex flex-col gap-2">
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              Cet article a déjà été vendu via une autre commande. Annulez cette commande pour la
              clôturer.
            </p>
            <Button
              variant="danger"
              onClick={() => updateMutation.mutate({ status: 'ANNULEE' })}
              disabled={updateMutation.isPending}
            >
              Annuler cette commande
            </Button>
          </div>
        )}

        {order.status === 'CONFIRMEE' && order.article.status !== 'VENDU' && showSellForm && (
          <div className="flex flex-col gap-2 rounded-lg border border-emerald-200 p-3 dark:border-emerald-900/50">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              Le client a récupéré l&apos;article — confirmer la vente
            </p>
            <SellForm
              article={order.article}
              orderId={order.id}
              initialSalePrice={order.agreedPrice}
              initialBuyerName={order.customerName}
              initialBuyerContact={order.customerPhone}
              initialAdChannel="Site web"
              onSuccess={() => setShowSellForm(false)}
            />
            <Button type="button" variant="secondary" onClick={() => setShowSellForm(false)}>
              Annuler
            </Button>
          </div>
        )}

        {order.status === 'CONFIRMEE' && order.article.status !== 'VENDU' && !showSellForm && (
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => setShowSellForm(true)}
              className="!bg-gradient-to-r !from-emerald-600 !to-teal-600 hover:!from-emerald-500 hover:!to-teal-500"
            >
              Vendu (client récupéré)
            </Button>
            <Button onClick={() => renewMutation.mutate()} disabled={renewMutation.isPending}>
              Renouveler 24h
            </Button>
            <Button
              variant="danger"
              onClick={() => updateMutation.mutate({ status: 'ANNULEE' })}
              disabled={updateMutation.isPending}
            >
              Annuler (retour en stock)
            </Button>
          </div>
        )}

        {order.status === 'ANNULEE' && (
          <Button
            onClick={() => updateMutation.mutate({ status: 'EN_ATTENTE' })}
            disabled={updateMutation.isPending}
            className="!bg-gradient-to-r !from-emerald-600 !to-teal-600 hover:!from-emerald-500 hover:!to-teal-500"
          >
            Réactiver (redonner une chance au client)
          </Button>
        )}
      </Card>
    </div>
  );
}
