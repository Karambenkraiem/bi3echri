'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { useAuth } from '@/lib/auth-context';
import { api, getAssetUrl } from '@/lib/api';
import { User } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, FieldLabel, Textarea } from '@/components/ui/input';

function ProfileContent() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', phone: '', bio: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name, phone: user.phone ?? '', bio: user.bio ?? '' });
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: () =>
      api.patch<User>('/users/me', {
        name: form.name,
        phone: form.phone || undefined,
        bio: form.bio || undefined,
      }),
    onSuccess: async () => {
      setError(null);
      setSuccess(true);
      await refreshUser();
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : 'Erreur'),
  });

  const avatarMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.upload<User>('/users/me/avatar', formData);
    },
    onSuccess: async () => {
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['treasury'] });
    },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : "Erreur lors de l'envoi de la photo"),
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
      api.patch('/users/me/password', {
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

  if (!user) return null;

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Mon profil</h1>

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
          <label className="inline-block cursor-pointer rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
            {avatarMutation.isPending ? 'Envoi...' : 'Changer la photo'}
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </label>
          <p className="mt-1 text-xs text-slate-500">JPG, PNG ou WEBP, 5 Mo max.</p>
        </div>
      </Card>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" value={user.email} disabled className="opacity-60" />
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
          <div>
            <FieldLabel htmlFor="bio">À propos</FieldLabel>
            <Textarea
              id="bio"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Quelques informations personnelles..."
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
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
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

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
