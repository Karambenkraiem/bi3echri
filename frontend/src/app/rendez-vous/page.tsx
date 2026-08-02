'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { api } from '@/lib/api';
import { Appointment, AppointmentType } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, FieldLabel, Select, Textarea } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { PencilIcon, TrashIcon, ClockIcon } from '@/components/ui/icons';

const TYPE_LABELS: Record<AppointmentType, string> = { ACHAT: 'Achat', VENTE: 'Vente' };
const TYPE_COLORS: Record<AppointmentType, string> = {
  ACHAT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  VENTE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

function toDatetimeLocal(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function EditAppointmentForm({
  appointment,
  onDone,
}: {
  appointment: Appointment;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [articleName, setArticleName] = useState(appointment.articleName);
  const [type, setType] = useState<AppointmentType>(appointment.type);
  const [specs, setSpecs] = useState(appointment.specs ?? '');
  const [reminderAt, setReminderAt] = useState(toDatetimeLocal(appointment.reminderAt));
  const [error, setError] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: () =>
      api.patch(`/appointments/${appointment.id}`, {
        articleName,
        type,
        specs: specs || undefined,
        reminderAt: reminderAt ? new Date(reminderAt).toISOString() : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      onDone();
    },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : 'Erreur'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/appointments/${appointment.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      onDone();
    },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : 'Erreur'),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!confirm('Enregistrer les modifications de ce rendez-vous ?')) return;
    updateMutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <FieldLabel htmlFor="edit-articleName">Nom de l&apos;article</FieldLabel>
        <Input
          id="edit-articleName"
          value={articleName}
          onChange={(e) => setArticleName(e.target.value)}
          required
        />
      </div>
      <div>
        <FieldLabel htmlFor="edit-type">Type</FieldLabel>
        <Select id="edit-type" value={type} onChange={(e) => setType(e.target.value as AppointmentType)}>
          <option value="ACHAT">Achat</option>
          <option value="VENTE">Vente</option>
        </Select>
      </div>
      <div>
        <FieldLabel htmlFor="edit-specs">Spécifications / notes</FieldLabel>
        <Textarea
          id="edit-specs"
          value={specs}
          onChange={(e) => setSpecs(e.target.value)}
          placeholder="Détails de l'article, prix discuté, lieu..."
        />
      </div>
      <div>
        <FieldLabel htmlFor="edit-reminderAt">Alarme (optionnel)</FieldLabel>
        <Input
          id="edit-reminderAt"
          type="datetime-local"
          value={reminderAt}
          onChange={(e) => setReminderAt(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={deleteMutation.isPending}
          onClick={() => {
            if (confirm('Supprimer ce rendez-vous ?')) {
              deleteMutation.mutate();
            }
          }}
          className="inline-flex items-center gap-1.5"
        >
          <TrashIcon className="h-4 w-4" />
          Supprimer
        </Button>
      </div>
    </form>
  );
}

function RendezVousContent() {
  const queryClient = useQueryClient();
  const [articleName, setArticleName] = useState('');
  const [type, setType] = useState<AppointmentType>('ACHAT');
  const [specs, setSpecs] = useState('');
  const [reminderAt, setReminderAt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Appointment | null>(null);

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => api.get<Appointment[]>('/appointments'),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post('/appointments', {
        articleName,
        type,
        specs: specs || undefined,
        reminderAt: reminderAt ? new Date(reminderAt).toISOString() : undefined,
      }),
    onSuccess: () => {
      setArticleName('');
      setType('ACHAT');
      setSpecs('');
      setReminderAt('');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : 'Erreur'),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!confirm('Ajouter ce rendez-vous ?')) return;
    createMutation.mutate();
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Rendez-vous</h1>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="articleName">Nom de l&apos;article</FieldLabel>
              <Input
                id="articleName"
                value={articleName}
                onChange={(e) => setArticleName(e.target.value)}
                placeholder="Ex: PC Gamer RTX 3060"
                required
              />
            </div>
            <div>
              <FieldLabel htmlFor="type">Type</FieldLabel>
              <Select id="type" value={type} onChange={(e) => setType(e.target.value as AppointmentType)}>
                <option value="ACHAT">Achat</option>
                <option value="VENTE">Vente</option>
              </Select>
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="specs">Spécifications / notes</FieldLabel>
            <Textarea
              id="specs"
              value={specs}
              onChange={(e) => setSpecs(e.target.value)}
              placeholder="Détails de l'article, prix discuté, lieu de rendez-vous..."
            />
          </div>
          <div>
            <FieldLabel htmlFor="reminderAt">Alarme (optionnel)</FieldLabel>
            <Input
              id="reminderAt"
              type="datetime-local"
              value={reminderAt}
              onChange={(e) => setReminderAt(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Une notification vous sera envoyée à cette date pour ne pas oublier le rendez-vous.
            </p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={createMutation.isPending} className="sm:w-auto">
            {createMutation.isPending ? 'Ajout...' : 'Ajouter le rendez-vous'}
          </Button>
        </form>
      </Card>

      <Card className="overflow-x-auto p-0">
        {isLoading ? (
          <p className="p-4 text-sm text-slate-500">Chargement...</p>
        ) : !appointments || appointments.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">Aucun rendez-vous enregistré.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {appointments.map((appointment) => (
              <li
                key={appointment.id}
                onClick={() => setEditTarget(appointment)}
                className="flex cursor-pointer flex-col gap-2 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[appointment.type]}`}
                  >
                    {TYPE_LABELS[appointment.type]}
                  </span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {appointment.articleName}
                  </span>
                  {appointment.reminderAt && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                      <ClockIcon className="h-3 w-3" />
                      {new Date(appointment.reminderAt).toLocaleString('fr-FR')}
                      {appointment.notified && ' (envoyée)'}
                    </span>
                  )}
                </div>
                {appointment.specs && (
                  <p className="text-sm text-slate-600 dark:text-slate-300">{appointment.specs}</p>
                )}
                <p className="text-xs text-slate-400">
                  Ajouté par {appointment.createdBy?.name ?? '—'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Modifier le rendez-vous">
        {editTarget && (
          <EditAppointmentForm appointment={editTarget} onDone={() => setEditTarget(null)} />
        )}
      </Modal>
    </div>
  );
}

export default function RendezVousPage() {
  return (
    <ProtectedRoute>
      <RendezVousContent />
    </ProtectedRoute>
  );
}
