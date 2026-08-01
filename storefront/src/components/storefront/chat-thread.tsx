'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Message } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ChatThread({ orderId }: { orderId: string }) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useQuery({
    queryKey: ['public', 'orders', orderId, 'messages'],
    queryFn: () => api.get<Message[]>(`/public/orders/${orderId}/messages`),
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages?.length]);

  const sendMutation = useMutation({
    mutationFn: () => api.post(`/public/orders/${orderId}/messages`, { body }),
    onSuccess: () => {
      setBody('');
      queryClient.invalidateQueries({ queryKey: ['public', 'orders', orderId, 'messages'] });
    },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : 'Erreur'),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!body.trim()) return;
    sendMutation.mutate();
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={listRef}
        className="flex max-h-96 flex-col gap-2 overflow-y-auto rounded-xl border border-slate-200/70 bg-white/60 p-3 dark:border-slate-800/70 dark:bg-slate-900/60"
      >
        {isLoading ? (
          <p className="text-xs text-slate-500">Chargement...</p>
        ) : !messages || messages.length === 0 ? (
          <p className="text-xs text-slate-500">
            Aucun message pour le moment — posez votre question ou proposez un prix.
          </p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                m.sender === 'CLIENT'
                  ? 'ml-auto bg-gradient-to-r from-violet-600 to-blue-600 text-white'
                  : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
              }`}
            >
              <p className="whitespace-pre-wrap">{m.body}</p>
              <p className={`mt-1 text-[10px] ${m.sender === 'CLIENT' ? 'text-white/70' : 'text-slate-400'}`}>
                {m.sender === 'CLIENT' ? 'Vous' : 'Vendeur'} ·{' '}
                {new Date(m.createdAt).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Votre message ou proposition de prix..."
        />
        <Button type="submit" disabled={sendMutation.isPending || !body.trim()}>
          Envoyer
        </Button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
