'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useClientAuth } from '@/lib/client-auth-context';
import { api, getAssetUrl } from '@/lib/api';
import { Client } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, FieldLabel } from '@/components/ui/input';
import { ChevronLeftIcon, LockIcon, MailIcon, UserIcon } from '@/components/ui/icons';

export default function ProfilPage() {
  const { client, loading, refreshClient } = useClientAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', phone: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!loading && !client) {
      router.replace('/compte/connexion');
    }
  }, [loading, client, router]);

  useEffect(() => {
    if (client) {
      setForm({ name: client.name, phone: client.phone ?? '' });
    }
  }, [client]);

  const updateMutation = useMutation({
    mutationFn: () =>
      api.patch<Client>('/public/clients/me', {
        name: form.name,
        phone: form.phone || undefined,
      }),
    onSuccess: async () => {
      setError(null);
      setSuccess(true);
      await refreshClient();
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : 'Erreur'),
  });

  const avatarMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.upload<Client>('/public/clients/me/avatar', formData);
    },
    onSuccess: () => refreshClient(),
    onError: (err: unknown) =>
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi de la photo"),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    updateMutation.mutate();
  }

  function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      avatarMutation.mutate(file);
    }
    e.target.value = '';
  }

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const passwordMutation = useMutation({
    mutationFn: () =>
      api.patch('/public/clients/me/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      }),
    onSuccess: () => {
      setPasswordError(null);
      setPasswordSuccess(true);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordSuccess(false), 3000);
    },
    onError: (err: unknown) => setPasswordError(err instanceof Error ? err.message : 'Erreur'),
  });

  function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordSuccess(false);
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('La confirmation ne correspond pas au nouveau mot de passe.');
      return;
    }
    setPasswordError(null);
    passwordMutation.mutate();
  }

  if (loading || !client) {
    return <p className="text-sm text-slate-500">Chargement...</p>;
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <Link
        href="/compte"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:underline"
      >
        <ChevronLeftIcon className="h-3.5 w-3.5" />
        Retour à mon compte
      </Link>

      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Paramètres du profil</h1>

      <Card className="flex items-center gap-4">
        {client.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={getAssetUrl(client.avatarUrl)}
            alt={client.name}
            className="h-20 w-20 rounded-full object-cover ring-4 ring-violet-100 dark:ring-violet-900/40"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-2xl font-semibold text-white ring-4 ring-violet-100 dark:ring-violet-900/40">
            {client.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-medium text-slate-900 dark:text-white">{client.name}</p>
          <label className="mt-1 inline-block cursor-pointer rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:from-violet-500 hover:to-blue-500">
            {avatarMutation.isPending ? 'Envoi...' : 'Changer la photo'}
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </label>
          <p className="mt-1 text-xs text-slate-500">JPG, PNG ou WEBP, 5 Mo max.</p>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <UserIcon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          Informations personnelles
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <FieldLabel htmlFor="email">
              <span className="inline-flex items-center gap-1.5">
                <MailIcon className="h-3.5 w-3.5" />
                Email
              </span>
            </FieldLabel>
            <Input id="email" value={client.email ?? ''} disabled className="opacity-60" />
          </div>
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
            <FieldLabel htmlFor="phone">Téléphone</FieldLabel>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Ex: 20 123 456"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-emerald-600">Profil mis à jour.</p>}
          <Button type="submit" disabled={updateMutation.isPending} className="w-full">
            {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <LockIcon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          Changer le mot de passe
        </h2>
        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
          <div>
            <FieldLabel htmlFor="currentPassword">Mot de passe actuel</FieldLabel>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
              }
              required
            />
          </div>
          <div>
            <FieldLabel htmlFor="newPassword">Nouveau mot de passe</FieldLabel>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              required
            />
          </div>
          <div>
            <FieldLabel htmlFor="confirmPassword">Confirmer le nouveau mot de passe</FieldLabel>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
              }
              required
            />
          </div>
          {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
          {passwordSuccess && (
            <p className="text-sm text-emerald-600">Mot de passe changé avec succès.</p>
          )}
          <Button type="submit" disabled={passwordMutation.isPending} className="w-full">
            {passwordMutation.isPending ? 'Changement...' : 'Changer le mot de passe'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
