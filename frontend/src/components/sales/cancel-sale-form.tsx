'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea, FieldLabel } from '@/components/ui/input';

export function CancelSaleForm({ saleId, onDone }: { saleId: string; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => api.post(`/sales/${saleId}/cancel`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['treasury'] });
      onDone();
    },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : 'Erreur'),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!reason.trim()) {
      setError('Merci de préciser la raison du retour.');
      return;
    }
    mutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <FieldLabel htmlFor="return-reason">Raison du retour / annulation</FieldLabel>
      <Textarea
        id="return-reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Ex: le client a rapporté l'article, défaut constaté..."
        rows={2}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" variant="danger" disabled={mutation.isPending}>
          {mutation.isPending ? 'Traitement...' : 'Confirmer le retour en stock'}
        </Button>
        <Button type="button" variant="secondary" onClick={onDone}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
