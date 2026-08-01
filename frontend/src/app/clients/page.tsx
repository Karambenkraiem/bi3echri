'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { api, getAssetUrl } from '@/lib/api';
import { Client } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SortableHeader } from '@/components/ui/sortable-header';
import { useSort } from '@/lib/use-sort';

type SortKey = 'name' | 'email' | 'phone' | 'orders' | 'createdAt';

function ClientsContent() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.get<Client[]>('/clients'),
  });

  const filtered = clients?.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q) ||
      (c.phone ?? '').toLowerCase().includes(q)
    );
  });

  const { sorted, sortKey, sortDirection, toggleSort } = useSort<Client, SortKey>(
    filtered,
    (c, key) => {
      switch (key) {
        case 'name':
          return c.name;
        case 'email':
          return c.email ?? '';
        case 'phone':
          return c.phone ?? '';
        case 'orders':
          return c._count?.orders ?? 0;
        case 'createdAt':
          return c.createdAt;
      }
    },
    'createdAt',
  );

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Clients</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Comptes créés par les visiteurs de la boutique en ligne pour suivre leurs
        réservations et achats.
      </p>

      <Card>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom, email ou téléphone..."
        />
      </Card>

      <Card className="overflow-x-auto p-0">
        {isLoading ? (
          <p className="p-4 text-sm text-slate-500">Chargement...</p>
        ) : !sorted || sorted.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">Aucun client inscrit pour le moment.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3"></th>
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
                  active={sortKey === 'phone'}
                  direction={sortDirection}
                  onClick={() => toggleSort('phone')}
                >
                  Téléphone
                </SortableHeader>
                <SortableHeader
                  active={sortKey === 'orders'}
                  direction={sortDirection}
                  onClick={() => toggleSort('orders')}
                >
                  Commandes
                </SortableHeader>
                <SortableHeader
                  active={sortKey === 'createdAt'}
                  direction={sortDirection}
                  onClick={() => toggleSort('createdAt')}
                >
                  Inscrit le
                </SortableHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sorted.map((client) => (
                <tr
                  key={client.id}
                  onClick={() => router.push(`/clients/${client.id}`)}
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <td className="py-3 pl-4">
                    {client.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getAssetUrl(client.avatarUrl)}
                        alt=""
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-xs font-semibold text-white">
                        {client.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                    {client.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {client.email || '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {client.phone || '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {client._count?.orders ?? 0}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {new Date(client.createdAt).toLocaleDateString('fr-FR')}
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

export default function ClientsPage() {
  return (
    <ProtectedRoute>
      <ClientsContent />
    </ProtectedRoute>
  );
}
