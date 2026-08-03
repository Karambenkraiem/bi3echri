'use client';

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getAssetUrl } from '@/lib/api';
import { Message } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

export function ChatThread({ orderId }: { orderId: string }) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
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
    mutationFn: () => {
      const formData = new FormData();
      if (body.trim()) formData.append('body', body.trim());
      if (file) formData.append('file', file);
      return api.upload(`/public/orders/${orderId}/messages`, formData);
    },
    onSuccess: () => {
      setBody('');
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ['public', 'orders', orderId, 'messages'] });
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
              <MessageAttachment message={m} />
              {m.body && <p className="whitespace-pre-wrap">{m.body}</p>}
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
            id="chat-thread-file"
            type="file"
            accept={ATTACHMENT_ACCEPT}
            onChange={handleFileSelected}
            className="hidden"
          />
          <label
            htmlFor="chat-thread-file"
            className="flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-300 px-3 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            title="Joindre une image, vidéo ou document"
          >
            📎
          </label>
          <Input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Votre message ou proposition de prix..."
          />
          <Button type="submit" disabled={sendMutation.isPending || (!body.trim() && !file)}>
            Envoyer
          </Button>
        </div>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
