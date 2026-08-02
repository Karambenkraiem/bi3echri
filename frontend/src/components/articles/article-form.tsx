'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getAssetUrl } from '@/lib/api';
import {
  Article,
  Category,
  MAX_PHOTOS_PER_ARTICLE,
  PC_CONCEPTS,
  PC_TYPES,
  Photo,
  Supplier,
  SupplierType,
} from '@/lib/types';
import { Input, FieldLabel, Select, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CategorySelect } from './category-select';
import { SupplierSelect } from './supplier-select';

const EMPTY_PC_SPECS = {
  marque: '',
  type: '',
  concept: '',
  processeur: '',
  carteGraphique: '',
  ram: '',
  stockage: '',
  typeEcran: '',
  tailleEcran: '',
};

function specsToForm(specs: Article['specs']) {
  return { ...EMPTY_PC_SPECS, ...(specs ?? {}) };
}

export function ArticleForm({
  article,
  onSuccess,
}: {
  article?: Article;
  onSuccess: () => void;
}) {
  const isEdit = !!article;
  const queryClient = useQueryClient();
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/categories'),
  });
  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get<Supplier[]>('/suppliers'),
  });

  const [form, setForm] = useState({
    name: article?.name ?? '',
    description: article?.description ?? '',
    categoryId: article?.categoryId ?? '',
    condition: (article?.condition ?? 'OCCASION') as 'NEUF' | 'OCCASION',
    purchasePrice: article ? String(article.purchasePrice) : '',
    purchaseDate: article ? article.purchaseDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    purchaseSource: article?.purchaseSource ?? '',
    expectedSalePrice: article?.expectedSalePrice != null ? String(article.expectedSalePrice) : '',
    floorPrice: article?.floorPrice != null ? String(article.floorPrice) : '',
    quantity: article ? String(article.quantity) : '1',
  });
  const [readyForPublication, setReadyForPublication] = useState(
    article?.readyForPublication ?? true,
  );
  const [notReadyReason, setNotReadyReason] = useState(article?.notReadyReason ?? '');
  const [pcSpecs, setPcSpecs] = useState(specsToForm(article?.specs));
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<Photo[]>(article?.photos ?? []);
  const [error, setError] = useState<string | null>(null);

  const remainingSlots = MAX_PHOTOS_PER_ARTICLE - existingPhotos.length - photos.length;

  const deletePhotoMutation = useMutation({
    mutationFn: (photoId: string) => api.delete(`/articles/${article!.id}/photos/${photoId}`),
    onSuccess: (_data, photoId) => {
      setExistingPhotos((prev) => prev.filter((p) => p.id !== photoId));
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });

  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryParentId, setNewCategoryParentId] = useState('');
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [newSupplierType, setNewSupplierType] = useState<SupplierType>('SOUK');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierLocation, setNewSupplierLocation] = useState('');
  const [supplierError, setSupplierError] = useState<string | null>(null);

  useEffect(() => {
    const urls = photos.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [photos]);

  function handleFilesSelected(e: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    setPhotos((prev) => [...prev, ...selected].slice(0, MAX_PHOTOS_PER_ARTICLE - existingPhotos.length));
    e.target.value = '';
  }

  function removePhotoAt(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  const topLevelCategories = (categories ?? []).filter((c) => !c.parentId);

  const createCategoryMutation = useMutation({
    mutationFn: () =>
      api.post<Category>('/categories', {
        name: newCategoryName,
        parentId: newCategoryParentId || undefined,
      }),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      setForm((f) => ({ ...f, categoryId: created.id }));
      setShowNewCategory(false);
      setNewCategoryName('');
      setNewCategoryParentId('');
      setCategoryError(null);
    },
    onError: (err: unknown) => {
      setCategoryError(err instanceof Error ? err.message : 'Erreur lors de la création');
    },
  });

  function handleCreateCategory(e: FormEvent) {
    e.preventDefault();
    setCategoryError(null);
    createCategoryMutation.mutate();
  }

  const createSupplierMutation = useMutation({
    mutationFn: () =>
      api.post<Supplier>('/suppliers', {
        type: newSupplierType,
        name: newSupplierName,
        phone: newSupplierType === 'PARTICULIER' ? newSupplierPhone : undefined,
        location: newSupplierType === 'PARTICULIER' ? newSupplierLocation : undefined,
      }),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setForm((f) => ({ ...f, purchaseSource: created.name }));
      setShowNewSupplier(false);
      setNewSupplierName('');
      setNewSupplierPhone('');
      setNewSupplierLocation('');
      setNewSupplierType('SOUK');
      setSupplierError(null);
    },
    onError: (err: unknown) => {
      setSupplierError(err instanceof Error ? err.message : 'Erreur lors de la création');
    },
  });

  function handleCreateSupplier(e: FormEvent) {
    e.preventDefault();
    setSupplierError(null);
    createSupplierMutation.mutate();
  }

  const selectedCategory = useMemo(() => {
    if (!categories) return undefined;
    for (const top of categories) {
      if (top.id === form.categoryId) return top;
      const child = top.children?.find((c) => c.id === form.categoryId);
      if (child) return child;
    }
    return undefined;
  }, [categories, form.categoryId]);

  const isPc = selectedCategory?.slug === 'pc';

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        categoryId: form.categoryId,
        condition: form.condition,
        purchasePrice: Number(form.purchasePrice),
        purchaseDate: form.purchaseDate,
        purchaseSource: form.purchaseSource || undefined,
        expectedSalePrice: form.expectedSalePrice ? Number(form.expectedSalePrice) : undefined,
        floorPrice: form.floorPrice ? Number(form.floorPrice) : undefined,
        quantity: Number(form.quantity),
        specs: isPc
          ? Object.fromEntries(
              Object.entries(pcSpecs).filter(([, v]) => v !== '' && v !== undefined),
            )
          : undefined,
        readyForPublication,
        notReadyReason: readyForPublication ? undefined : notReadyReason,
      };

      if (isEdit) {
        const updated = await api.patch<Article>(`/articles/${article!.id}`, payload);
        if (photos.length > 0) {
          const formData = new FormData();
          photos.forEach((file) => formData.append('files', file));
          await api.upload(`/articles/${article!.id}/photos`, formData);
        }
        return updated;
      }

      const created = await api.post<Article>('/articles', payload);
      if (photos.length > 0) {
        const formData = new FormData();
        photos.forEach((file) => formData.append('files', file));
        await api.upload(`/articles/${created.id}/photos`, formData);
      }
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['treasury'] });
      onSuccess();
    },
    onError: (err: unknown) => {
      setError(
        err instanceof Error ? err.message : `Erreur lors de ${isEdit ? 'la modification' : 'la création'}`,
      );
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!readyForPublication && !notReadyReason.trim()) {
      setError("Merci d'indiquer la raison pour laquelle l'article n'est pas encore prêt à être publié");
      return;
    }
    const message = isEdit
      ? 'Enregistrer les modifications de cet article ?'
      : 'Ajouter cet article au stock ?';
    if (!confirm(message)) return;
    mutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <FieldLabel htmlFor="name">Nom de l&apos;article</FieldLabel>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Ex: PC Gamer RTX 3060"
          required
        />
      </div>
      <div>
        <FieldLabel htmlFor="description">Description (optionnel)</FieldLabel>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Détails, état, accessoires inclus..."
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="categoryId">Catégorie</FieldLabel>
            <button
              type="button"
              onClick={() => setShowNewCategory((v) => !v)}
              className="mb-1 text-xs font-medium text-slate-500 hover:underline dark:text-slate-400"
            >
              {showNewCategory ? 'Annuler' : '+ Nouvelle catégorie'}
            </button>
          </div>
          <CategorySelect
            id="categoryId"
            categories={categories}
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            required
          />
          {showNewCategory && (
            <div className="mt-2 flex flex-col gap-2 rounded-md border border-slate-200 p-2 dark:border-slate-700">
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nom de la catégorie"
              />
              <Select
                value={newCategoryParentId}
                onChange={(e) => setNewCategoryParentId(e.target.value)}
              >
                <option value="">Catégorie principale (sans parent)</option>
                {topLevelCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    Sous-catégorie de {c.name}
                  </option>
                ))}
              </Select>
              {categoryError && <p className="text-xs text-red-600">{categoryError}</p>}
              <Button
                type="button"
                variant="secondary"
                disabled={!newCategoryName || createCategoryMutation.isPending}
                onClick={handleCreateCategory}
              >
                {createCategoryMutation.isPending ? 'Création...' : 'Créer cette catégorie'}
              </Button>
            </div>
          )}
        </div>
        <div>
          <FieldLabel htmlFor="condition">État</FieldLabel>
          <Select
            id="condition"
            value={form.condition}
            onChange={(e) =>
              setForm({ ...form, condition: e.target.value as 'NEUF' | 'OCCASION' })
            }
          >
            <option value="OCCASION">Occasion</option>
            <option value="NEUF">Neuf</option>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="purchasePrice">Prix d&apos;achat (DT)</FieldLabel>
          <Input
            id="purchasePrice"
            type="number"
            min="0"
            step="0.001"
            value={form.purchasePrice}
            onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
            required
          />
        </div>
        <div>
          <FieldLabel htmlFor="quantity">Quantité</FieldLabel>
          <Input
            id="quantity"
            type="number"
            min="1"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="expectedSalePrice">Prix affiché (DT, optionnel)</FieldLabel>
          <Input
            id="expectedSalePrice"
            type="number"
            min="0"
            step="0.001"
            value={form.expectedSalePrice}
            onChange={(e) => setForm({ ...form, expectedSalePrice: e.target.value })}
            placeholder="Ex: 250"
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Prix visible par tout le monde (boutique en ligne, préremplit le prix de vente).
          </p>
        </div>
        <div>
          <FieldLabel htmlFor="floorPrice">Dernier prix (DT, optionnel)</FieldLabel>
          <Input
            id="floorPrice"
            type="number"
            min="0"
            step="0.001"
            value={form.floorPrice}
            onChange={(e) => setForm({ ...form, floorPrice: e.target.value })}
            placeholder="Ex: 200"
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Prix plancher interne : alerte le vendeur en badge rouge pendant la
            négociation, ne descendez pas en dessous.
          </p>
          {form.floorPrice &&
            form.expectedSalePrice &&
            Number(form.floorPrice) > Number(form.expectedSalePrice) && (
              <p className="mt-1 text-xs font-medium text-red-600">
                Le dernier prix est supérieur au prix affiché.
              </p>
            )}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="purchaseDate">Date d&apos;achat</FieldLabel>
          <Input
            id="purchaseDate"
            type="date"
            value={form.purchaseDate}
            onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
            required
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="purchaseSource">Fournisseur / où acheté</FieldLabel>
            <button
              type="button"
              onClick={() => setShowNewSupplier((v) => !v)}
              className="mb-1 text-xs font-medium text-slate-500 hover:underline dark:text-slate-400"
            >
              {showNewSupplier ? 'Annuler' : '+ Nouveau fournisseur'}
            </button>
          </div>
          <SupplierSelect
            id="purchaseSource"
            suppliers={suppliers}
            value={form.purchaseSource}
            onChange={(e) => setForm({ ...form, purchaseSource: e.target.value })}
          />
          {showNewSupplier && (
            <div className="mt-2 flex flex-col gap-2 rounded-md border border-slate-200 p-2 dark:border-slate-700">
              <Select
                value={newSupplierType}
                onChange={(e) => setNewSupplierType(e.target.value as SupplierType)}
              >
                <option value="SOUK">Souk / marché</option>
                <option value="PARTICULIER">Particulier</option>
              </Select>
              <Input
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
                placeholder="Nom (ex: Sou9 Elkram, Ahmed...)"
              />
              {newSupplierType === 'PARTICULIER' && (
                <>
                  <Input
                    value={newSupplierPhone}
                    onChange={(e) => setNewSupplierPhone(e.target.value)}
                    placeholder="Téléphone"
                  />
                  <Input
                    value={newSupplierLocation}
                    onChange={(e) => setNewSupplierLocation(e.target.value)}
                    placeholder="Lieu de rendez-vous"
                  />
                </>
              )}
              {supplierError && <p className="text-xs text-red-600">{supplierError}</p>}
              <Button
                type="button"
                variant="secondary"
                disabled={
                  !newSupplierName ||
                  (newSupplierType === 'PARTICULIER' && (!newSupplierPhone || !newSupplierLocation)) ||
                  createSupplierMutation.isPending
                }
                onClick={handleCreateSupplier}
              >
                {createSupplierMutation.isPending ? 'Création...' : 'Créer ce fournisseur'}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div>
        <FieldLabel htmlFor="photos">
          Photos ({existingPhotos.length + photos.length}/{MAX_PHOTOS_PER_ARTICLE})
        </FieldLabel>

        {existingPhotos.length > 0 && (
          <div className="mb-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
            {existingPhotos.map((photo) => (
              <div
                key={photo.id}
                className="group relative aspect-square overflow-hidden rounded-md border border-slate-200 dark:border-slate-700"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getAssetUrl(photo.url)} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Supprimer cette photo ?')) {
                      deletePhotoMutation.mutate(photo.id);
                    }
                  }}
                  className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-sm text-white"
                  aria-label="Supprimer cette photo"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          id="photos"
          type="file"
          accept="image/*"
          multiple
          disabled={remainingSlots <= 0}
          onChange={handleFilesSelected}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-700 disabled:opacity-50 dark:text-slate-300 dark:file:bg-white dark:file:text-slate-900 dark:hover:file:bg-slate-200"
        />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Sur téléphone, choisissez « Appareil photo » dans la liste pour prendre une photo
          directement — elle sera aussi enregistrée dans votre galerie.
        </p>
        {previews.length > 0 && (
          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
            {previews.map((src, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <div key={src} className="group relative aspect-square overflow-hidden rounded-md border border-slate-200 dark:border-slate-700">
                <img src={src} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhotoAt(index)}
                  className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-sm text-white"
                  aria-label="Retirer cette photo"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
          <input
            type="checkbox"
            checked={readyForPublication}
            onChange={(e) => setReadyForPublication(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 dark:border-slate-600 dark:bg-slate-800"
          />
          Prêt à être publié sur le store en ligne
        </label>
        {!readyForPublication && (
          <div className="mt-2">
            <FieldLabel htmlFor="notReadyReason">Raison (pas encore prêt)</FieldLabel>
            <Textarea
              id="notReadyReason"
              value={notReadyReason}
              onChange={(e) => setNotReadyReason(e.target.value)}
              placeholder="Ex: manque des photos, prix à confirmer, nettoyage à faire..."
              required
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Cet article restera invisible sur le store public et apparaîtra dans « À préparer »
              jusqu&apos;à sa publication.
            </p>
          </div>
        )}
      </div>

      {isPc && (
        <div className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Caractéristiques PC
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="marque">Marque</FieldLabel>
              <Input
                id="marque"
                value={pcSpecs.marque}
                onChange={(e) => setPcSpecs({ ...pcSpecs, marque: e.target.value })}
                placeholder="Ex: Dell, Asus..."
              />
            </div>
            <div>
              <FieldLabel htmlFor="type">Type</FieldLabel>
              <Select
                id="type"
                value={pcSpecs.type}
                onChange={(e) => setPcSpecs({ ...pcSpecs, type: e.target.value })}
              >
                <option value="">—</option>
                {PC_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <FieldLabel htmlFor="concept">Concept</FieldLabel>
              <Select
                id="concept"
                value={pcSpecs.concept}
                onChange={(e) => setPcSpecs({ ...pcSpecs, concept: e.target.value })}
              >
                <option value="">—</option>
                {PC_CONCEPTS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <FieldLabel htmlFor="processeur">Processeur</FieldLabel>
              <Input
                id="processeur"
                value={pcSpecs.processeur}
                onChange={(e) => setPcSpecs({ ...pcSpecs, processeur: e.target.value })}
                placeholder="Ex: Intel i5-12400"
              />
            </div>
            <div>
              <FieldLabel htmlFor="carteGraphique">Carte graphique</FieldLabel>
              <Input
                id="carteGraphique"
                value={pcSpecs.carteGraphique}
                onChange={(e) => setPcSpecs({ ...pcSpecs, carteGraphique: e.target.value })}
                placeholder="Ex: RTX 3060, Intel UHD Graphics..."
              />
            </div>
            <div>
              <FieldLabel htmlFor="ram">RAM</FieldLabel>
              <Input
                id="ram"
                value={pcSpecs.ram}
                onChange={(e) => setPcSpecs({ ...pcSpecs, ram: e.target.value })}
                placeholder="Ex: 16 Go"
              />
            </div>
            <div>
              <FieldLabel htmlFor="stockage">Stockage</FieldLabel>
              <Input
                id="stockage"
                value={pcSpecs.stockage}
                onChange={(e) => setPcSpecs({ ...pcSpecs, stockage: e.target.value })}
                placeholder="Ex: 512 Go SSD"
              />
            </div>
            <div>
              <FieldLabel htmlFor="typeEcran">Type d&apos;écran</FieldLabel>
              <Input
                id="typeEcran"
                value={pcSpecs.typeEcran}
                onChange={(e) => setPcSpecs({ ...pcSpecs, typeEcran: e.target.value })}
                placeholder="Ex: Full HD, Tactile, OLED (vide si desktop)"
              />
            </div>
            <div>
              <FieldLabel htmlFor="tailleEcran">Taille écran</FieldLabel>
              <Input
                id="tailleEcran"
                value={pcSpecs.tailleEcran}
                onChange={(e) => setPcSpecs({ ...pcSpecs, tailleEcran: e.target.value })}
                placeholder="Ex: 15.6&quot; (vide si desktop)"
              />
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={mutation.isPending} className="w-full">
        {mutation.isPending
          ? isEdit
            ? 'Enregistrement...'
            : 'Ajout en cours...'
          : isEdit
            ? 'Enregistrer les modifications'
            : "Ajouter l'article"}
      </Button>
    </form>
  );
}
