'use client';

import { FormEvent, use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { useAuth } from '@/lib/auth-context';
import { api, getAssetUrl } from '@/lib/api';
import { Role, User } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, FieldLabel, Select } from '@/components/ui/input';
import { TrashIcon } from '@/components/ui/icons';

function UserDetailContent({ id }: { id: string }) {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', email: '', role: 'VENDEUR' as Role });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['users', id],
    queryFn: () => api.get<User>(`/users/${id}`),
  });

  useEffect(() => {
    if (user) {
      setForm({ name: user.name, email: user.email, role: user.role });
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: () => api.patch(`/users/${id}`, form),
    onSuccess: () => {
      setError(null);
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : 'Erreur'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      router.push('/users');
    },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : 'Erreur'),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    updateMutation.mutate();
  }

  if (isLoading) {
    return <p className="text-sm text-slate-500">Chargement...</p>;
  }

  if (!user) {
    return <p className="text-sm text-slate-500">Utilisateur introuvable.</p>;
  }

  const isSelf = user.id === currentUser?.id;

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <div>
        <Link href="/users" className="text-sm text-slate-500 hover:underline">
          ← Retour aux utilisateurs
        </Link>
      </div>

      <Card className="flex items-center gap-4">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={getAssetUrl(user.avatarUrl)}
            alt={user.name}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-xl font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{user.name}</h1>
          <p className="text-sm text-slate-500">
            Inscrit le{' '}
            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : '—'}
          </p>
        </div>
      </Card>

      {(user.phone || user.bio) && (
        <Card>
          <dl className="grid grid-cols-3 gap-y-2 text-sm">
            {user.phone && (
              <>
                <dt className="text-slate-500">Téléphone</dt>
                <dd className="col-span-2">{user.phone}</dd>
              </>
            )}
            {user.bio && (
              <>
                <dt className="text-slate-500">À propos</dt>
                <dd className="col-span-2 whitespace-pre-wrap">{user.bio}</dd>
              </>
            )}
          </dl>
        </Card>
      )}

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
          Modifier le compte
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <FieldLabel htmlFor="name">Nom</FieldLabel>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <FieldLabel htmlFor="role">Rôle</FieldLabel>
            <Select
              id="role"
              value={form.role}
              disabled={isSelf}
              onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
            >
              <option value="VENDEUR">Vendeur</option>
              <option value="ADMIN">Admin</option>
            </Select>
            {isSelf && (
              <p className="mt-1 text-xs text-slate-500">
                Vous ne pouvez pas changer votre propre rôle.
              </p>
            )}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-emerald-600">Compte mis à jour.</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
            {!isSelf && (
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  if (confirm('Supprimer cet utilisateur ?')) {
                    deleteMutation.mutate();
                  }
                }}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center gap-1.5"
              >
                <TrashIcon className="h-4 w-4" />
                Supprimer
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ProtectedRoute roles={['ADMIN']}>
      <UserDetailContent id={id} />
    </ProtectedRoute>
  );
}
