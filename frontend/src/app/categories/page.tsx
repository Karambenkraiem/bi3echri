'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Category } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, FieldLabel, Select } from '@/components/ui/input';
import { PencilIcon, TrashIcon } from '@/components/ui/icons';

function CategoryRow({
  category,
  isAdmin,
  onDelete,
  isChild = false,
}: {
  category: Category;
  isAdmin: boolean;
  onDelete: (id: string) => void;
  isChild?: boolean;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [error, setError] = useState<string | null>(null);

  const renameMutation = useMutation({
    mutationFn: () => api.patch(`/categories/${category.id}`, { name }),
    onSuccess: () => {
      setEditing(false);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : 'Erreur'),
  });

  if (editing) {
    return (
      <li className={`flex items-center gap-2 px-4 py-2.5 ${isChild ? 'pl-8' : ''}`}>
        <Input value={name} onChange={(e) => setName(e.target.value)} className="max-w-xs" />
        <Button
          variant="secondary"
          onClick={() => renameMutation.mutate()}
          disabled={renameMutation.isPending || !name}
        >
          Enregistrer
        </Button>
        <button
          onClick={() => {
            setEditing(false);
            setName(category.name);
            setError(null);
          }}
          className="text-sm text-slate-500 hover:underline"
        >
          Annuler
        </button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </li>
    );
  }

  return (
    <li className={`flex items-center justify-between px-4 py-2.5 ${isChild ? 'pl-8' : ''}`}>
      <span
        className={
          isChild
            ? 'text-sm text-slate-700 dark:text-slate-300'
            : 'text-sm font-medium text-slate-900 dark:text-white'
        }
      >
        {category.name}
      </span>
      <div className="flex gap-3">
        <button
          onClick={() => setEditing(true)}
          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label="Modifier"
          title="Modifier"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
        {isAdmin && (
          <button
            onClick={() => {
              if (confirm('Supprimer cette catégorie ?')) {
                onDelete(category.id);
              }
            }}
            className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
            aria-label="Supprimer"
            title="Supprimer"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </li>
  );
}

function CategoriesContent() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/categories'),
  });

  const topLevel = (categories ?? []).filter((c) => !c.parentId);

  const createMutation = useMutation({
    mutationFn: () => api.post('/categories', { name, parentId: parentId || undefined }),
    onSuccess: () => {
      setName('');
      setParentId('');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : 'Erreur'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    createMutation.mutate();
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Catégories</h1>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
          <div>
            <FieldLabel htmlFor="categoryName">Nom</FieldLabel>
            <Input
              id="categoryName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nouvelle catégorie"
              className="max-w-xs"
              required
            />
          </div>
          <div>
            <FieldLabel htmlFor="categoryParent">Catégorie parente (optionnel)</FieldLabel>
            <Select
              id="categoryParent"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-auto"
            >
              <option value="">Aucune (catégorie principale)</option>
              {topLevel.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" disabled={createMutation.isPending}>
            Ajouter
          </Button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </Card>

      <Card className="p-0">
        {isLoading ? (
          <p className="p-4 text-sm text-slate-500">Chargement...</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {topLevel.map((category) => (
              <li key={category.id}>
                <ul>
                  <CategoryRow
                    category={category}
                    isAdmin={isAdmin}
                    onDelete={(id) => deleteMutation.mutate(id)}
                  />
                </ul>
                {category.children && category.children.length > 0 && (
                  <ul className="divide-y divide-slate-50 border-t border-slate-100 bg-slate-50/50 dark:divide-slate-800/50 dark:border-slate-800 dark:bg-slate-950/40">
                    {category.children.map((child) => (
                      <CategoryRow
                        key={child.id}
                        category={child}
                        isAdmin={isAdmin}
                        onDelete={(id) => deleteMutation.mutate(id)}
                        isChild
                      />
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <ProtectedRoute>
      <CategoriesContent />
    </ProtectedRoute>
  );
}
