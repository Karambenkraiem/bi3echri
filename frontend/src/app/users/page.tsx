'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Role, User } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, FieldLabel, Select } from '@/components/ui/input';
import { TrashIcon } from '@/components/ui/icons';
import { SortableHeader } from '@/components/ui/sortable-header';
import { useSort } from '@/lib/use-sort';

type SortKey = 'name' | 'email' | 'role' | 'createdAt';

function UsersContent() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'VENDEUR' as Role });
  const [error, setError] = useState<string | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<User[]>('/users'),
  });

  const { sorted, sortKey, sortDirection, toggleSort } = useSort<User, SortKey>(
    users,
    (u, key) => u[key] ?? '',
    'name',
    'asc',
  );

  const createMutation = useMutation({
    mutationFn: () => api.post('/users', form),
    onSuccess: () => {
      setForm({ email: '', password: '', name: '', role: 'VENDEUR' });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : 'Erreur'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    createMutation.mutate();
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Utilisateurs</h1>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
          Ajouter un utilisateur
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
            <Input
              id="password"
              type="password"
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <div>
            <FieldLabel htmlFor="role">Rôle</FieldLabel>
            <Select
              id="role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
            >
              <option value="VENDEUR">Vendeur</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </div>
          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={createMutation.isPending}>
              Créer l&apos;utilisateur
            </Button>
          </div>
        </form>
      </Card>

      <Card className="overflow-x-auto p-0">
        {isLoading ? (
          <p className="p-4 text-sm text-slate-500">Chargement...</p>
        ) : !sorted || sorted.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">Aucun utilisateur.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-slate-800">
              <tr>
                <SortableHeader
                  active={sortKey === 'name'}
                  direction={sortDirection}
                  onClick={() => toggleSort('name')}
                >
                  Nom
                </SortableHeader>
                <SortableHeader
                  active={sortKey === 'email'}
                  direction={sortDirection}
                  onClick={() => toggleSort('email')}
                >
                  Email
                </SortableHeader>
                <SortableHeader
                  active={sortKey === 'role'}
                  direction={sortDirection}
                  onClick={() => toggleSort('role')}
                >
                  Rôle
                </SortableHeader>
                <SortableHeader
                  active={sortKey === 'createdAt'}
                  direction={sortDirection}
                  onClick={() => toggleSort('createdAt')}
                >
                  Inscription
                </SortableHeader>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sorted.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    <Link href={`/users/${u.id}`} className="font-medium text-slate-900 hover:underline dark:text-white">
                      {u.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{u.email}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {u.role === 'ADMIN' ? 'Admin' : 'Vendeur'}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {u.id !== currentUser?.id && (
                      <button
                        onClick={() => {
                          if (confirm('Supprimer cet utilisateur ?')) {
                            deleteMutation.mutate(u.id);
                          }
                        }}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                        aria-label="Supprimer"
                        title="Supprimer"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

export default function UsersPage() {
  return (
    <ProtectedRoute roles={['ADMIN']}>
      <UsersContent />
    </ProtectedRoute>
  );
}
