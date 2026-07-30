'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { api } from '@/lib/api';
import { Supplier, SupplierType } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, FieldLabel } from '@/components/ui/input';
import { PencilIcon, TrashIcon } from '@/components/ui/icons';

function SupplierRow({ supplier, onDelete }: { supplier: Supplier; onDelete: (id: string) => void }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(supplier.name);
  const [phone, setPhone] = useState(supplier.phone ?? '');
  const [location, setLocation] = useState(supplier.location ?? '');
  const [error, setError] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: () =>
      api.patch(`/suppliers/${supplier.id}`, {
        name,
        phone: supplier.type === 'PARTICULIER' ? phone : undefined,
        location: supplier.type === 'PARTICULIER' ? location : undefined,
      }),
    onSuccess: () => {
      setEditing(false);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : 'Erreur'),
  });

  if (editing) {
    return (
      <li className="flex flex-wrap items-center gap-2 px-4 py-2.5">
        <Input value={name} onChange={(e) => setName(e.target.value)} className="max-w-[10rem]" />
        {supplier.type === 'PARTICULIER' && (
          <>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Téléphone"
              className="max-w-[9rem]"
            />
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Lieu"
              className="max-w-[9rem]"
            />
          </>
        )}
        <Button
          variant="secondary"
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending || !name}
        >
          Enregistrer
        </Button>
        <button
          onClick={() => {
            setEditing(false);
            setName(supplier.name);
            setPhone(supplier.phone ?? '');
            setLocation(supplier.location ?? '');
            setError(null);
          }}
          className="text-sm text-slate-500 hover:underline"
        >
          Annuler
        </button>
        {error && <p className="w-full text-xs text-red-600">{error}</p>}
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between px-4 py-2.5">
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-white">{supplier.name}</p>
        {supplier.type === 'PARTICULIER' && (
          <p className="text-xs text-slate-500">
            {supplier.phone || '—'} · {supplier.location || '—'}
          </p>
        )}
      </div>
      <div className="flex gap-1">
        <button
          onClick={() => setEditing(true)}
          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label="Modifier"
          title="Modifier"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => {
            if (confirm('Supprimer ce fournisseur ?')) {
              onDelete(supplier.id);
            }
          }}
          className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
          aria-label="Supprimer"
          title="Supprimer"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

function SupplierSection({ type, title, hint }: { type: SupplierType; title: string; hint: string }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get<Supplier[]>('/suppliers'),
  });

  const filtered = suppliers?.filter((s) => s.type === type);

  const createMutation = useMutation({
    mutationFn: () =>
      api.post('/suppliers', {
        type,
        name,
        phone: type === 'PARTICULIER' ? phone : undefined,
        location: type === 'PARTICULIER' ? location : undefined,
      }),
    onSuccess: () => {
      setName('');
      setPhone('');
      setLocation('');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : 'Erreur'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/suppliers/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    createMutation.mutate();
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
          <div>
            <FieldLabel htmlFor={`${type}-name`}>Nom</FieldLabel>
            <Input
              id={`${type}-name`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="max-w-[10rem]"
              required
            />
          </div>
          {type === 'PARTICULIER' && (
            <>
              <div>
                <FieldLabel htmlFor={`${type}-phone`}>Téléphone</FieldLabel>
                <Input
                  id={`${type}-phone`}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="max-w-[9rem]"
                  required
                />
              </div>
              <div>
                <FieldLabel htmlFor={`${type}-location`}>Lieu</FieldLabel>
                <Input
                  id={`${type}-location`}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="max-w-[9rem]"
                  required
                />
              </div>
            </>
          )}
          <Button type="submit" disabled={createMutation.isPending}>
            Ajouter
          </Button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </Card>

      <Card className="p-0">
        {isLoading ? (
          <p className="p-4 text-sm text-slate-500">Chargement...</p>
        ) : !filtered || filtered.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">Aucun fournisseur.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((supplier) => (
              <SupplierRow
                key={supplier.id}
                supplier={supplier}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function FournisseursContent() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Fournisseurs</h1>
      <SupplierSection
        type="SOUK"
        title="Souks / marchés"
        hint="Ex: Sou9 Elkram, Sou9 Radès..."
      />
      <SupplierSection
        type="PARTICULIER"
        title="Particuliers"
        hint="Nom, numéro de téléphone et lieu de rendez-vous."
      />
    </div>
  );
}

export default function FournisseursPage() {
  return (
    <ProtectedRoute>
      <FournisseursContent />
    </ProtectedRoute>
  );
}
