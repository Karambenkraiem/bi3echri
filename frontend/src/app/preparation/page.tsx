'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { api, getAssetUrl } from '@/lib/api';
import { Article } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { PencilIcon } from '@/components/ui/icons';
import { ArticleForm } from '@/components/articles/article-form';
import { formatSpecsSummary } from '@/lib/format';

function PreparationPageContent() {
  const queryClient = useQueryClient();
  const [editTarget, setEditTarget] = useState<Article | null>(null);

  const { data: articles, isLoading } = useQuery({
    queryKey: ['articles'],
    queryFn: () => api.get<Article[]>('/articles'),
  });

  const notReady = articles?.filter((a) => !a.readyForPublication) ?? [];

  const publishMutation = useMutation({
    mutationFn: (id: string) => api.post<Article>(`/articles/${id}/publish`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (err: unknown) => {
      alert(err instanceof Error ? err.message : 'Erreur lors de la publication');
    },
  });

  function handlePublish(article: Article) {
    if (confirm(`Publier « ${article.name} » sur le store en ligne ?`)) {
      publishMutation.mutate(article.id);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">À préparer</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Articles pas encore prêts à être publiés sur le store en ligne. Complétez-les puis
          publiez-les en un clic.
        </p>
      </div>

      <Card className="overflow-x-auto p-0">
        {isLoading ? (
          <p className="p-4 text-sm text-slate-500">Chargement...</p>
        ) : notReady.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">
            Aucun article en attente de préparation — tout est prêt 🎉
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {notReady.map((article) => (
              <li key={article.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                {article.photos && article.photos.length > 0 ? (
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-slate-200 dark:border-slate-700">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getAssetUrl(article.photos[0].url)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-dashed border-slate-200 text-[10px] text-slate-400 dark:border-slate-700">
                    Aucune photo
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-slate-900 dark:text-white">{article.name}</div>
                  {formatSpecsSummary(article.specs) && (
                    <div className="text-xs text-slate-500">{formatSpecsSummary(article.specs)}</div>
                  )}
                  <div className="mt-1 flex items-start gap-1.5 text-sm text-amber-700 dark:text-amber-400">
                    <span className="font-medium">Raison :</span>
                    <span>{article.notReadyReason || 'Non précisée'}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => setEditTarget(article)}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    aria-label="Modifier"
                    title="Modifier"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <Button
                    onClick={() => handlePublish(article)}
                    disabled={publishMutation.isPending}
                  >
                    Publier
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Préparer l'article">
        {editTarget && (
          <ArticleForm article={editTarget} onSuccess={() => setEditTarget(null)} />
        )}
      </Modal>
    </div>
  );
}

export default function PreparationPage() {
  return (
    <ProtectedRoute>
      <PreparationPageContent />
    </ProtectedRoute>
  );
}
