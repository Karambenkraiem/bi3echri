'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import {
  AnalyticsSummary,
  ChannelPerformance,
  MarginByCategory,
  RevenueOverTime,
  StockRotation,
} from '@/lib/types';
import { SummaryCards } from '@/components/dashboard/summary-cards';
import { MarginByCategoryChart } from '@/components/dashboard/margin-by-category-chart';
import { RevenueOverTimeChart } from '@/components/dashboard/revenue-over-time-chart';
import { StockRotationChart } from '@/components/dashboard/stock-rotation-chart';
import { ChannelPerformanceChart } from '@/components/dashboard/channel-performance-chart';
import { ShortcutTile } from '@/components/dashboard/shortcut-tile';
import { Modal } from '@/components/ui/modal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, FieldLabel } from '@/components/ui/input';
import { ArticleForm } from '@/components/articles/article-form';
import {
  PlusIcon,
  TagIcon,
  ReceiptIcon,
  WalletIcon,
  BuildingIcon,
  FolderIcon,
  ChartIcon,
  UsersIcon,
  GearIcon,
  BoxIcon,
} from '@/components/ui/icons';

function QuickExpenseForm({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => api.post('/expenses', { amount: Number(amount), comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['treasury'] });
      onSuccess();
    },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : 'Erreur'),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    mutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <FieldLabel htmlFor="quick-amount">Montant (DT)</FieldLabel>
        <Input
          id="quick-amount"
          type="number"
          min="0"
          step="0.001"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>
      <div>
        <FieldLabel htmlFor="quick-comment">Où / pourquoi (brièvement)</FieldLabel>
        <Input
          id="quick-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Ex: essence, transport..."
          required
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={mutation.isPending} className="w-full">
        {mutation.isPending ? 'Ajout...' : 'Ajouter la dépense'}
      </Button>
    </form>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const [showAddArticle, setShowAddArticle] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);

  const { data: summary } = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: () => api.get<AnalyticsSummary>('/analytics/summary'),
  });
  const { data: marginByCategory } = useQuery({
    queryKey: ['analytics', 'margin-by-category'],
    queryFn: () => api.get<MarginByCategory[]>('/analytics/margin-by-category'),
  });
  const { data: revenueOverTime } = useQuery({
    queryKey: ['analytics', 'revenue-over-time'],
    queryFn: () => api.get<RevenueOverTime[]>('/analytics/revenue-over-time'),
  });
  const { data: stockRotation } = useQuery({
    queryKey: ['analytics', 'stock-rotation'],
    queryFn: () => api.get<StockRotation[]>('/analytics/stock-rotation'),
  });
  const { data: channelPerformance } = useQuery({
    queryKey: ['analytics', 'channel-performance'],
    queryFn: () => api.get<ChannelPerformance[]>('/analytics/channel-performance'),
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="bg-gradient-to-r from-blue-600 via-violet-600 to-emerald-500 bg-clip-text text-xl font-bold text-transparent">
        Tableau de bord — aide à la décision
      </h1>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
          Actions rapides
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <ShortcutTile
            icon={PlusIcon}
            label="Ajouter un article"
            color="blue"
            onClick={() => setShowAddArticle(true)}
          />
          <ShortcutTile icon={TagIcon} label="Vendre un article" color="aqua" href="/articles" />
          <ShortcutTile
            icon={ReceiptIcon}
            label="Nouvelle dépense"
            color="red"
            onClick={() => setShowAddExpense(true)}
          />
          <ShortcutTile icon={WalletIcon} label="Canaouite" color="violet" href="/canaouite" />
          <ShortcutTile icon={BoxIcon} label="Stock" color="blue" href="/articles" />
          <ShortcutTile icon={ChartIcon} label="Ventes" color="orange" href="/sales" />
          <ShortcutTile icon={FolderIcon} label="Catégories" color="green" href="/categories" />
          <ShortcutTile
            icon={BuildingIcon}
            label="Fournisseurs"
            color="yellow"
            href="/fournisseurs"
          />
          {user?.role === 'ADMIN' && (
            <ShortcutTile icon={UsersIcon} label="Utilisateurs" color="magenta" href="/users" />
          )}
          {user?.role === 'ADMIN' && (
            <ShortcutTile icon={GearIcon} label="Réglages" color="red" href="/settings" />
          )}
        </div>
      </Card>

      {summary && <SummaryCards summary={summary} />}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {marginByCategory && <MarginByCategoryChart data={marginByCategory} />}
        {revenueOverTime && revenueOverTime.length > 0 && (
          <RevenueOverTimeChart data={revenueOverTime} />
        )}
        {stockRotation && stockRotation.length > 0 && (
          <StockRotationChart data={stockRotation} />
        )}
        {channelPerformance && channelPerformance.length > 0 && (
          <ChannelPerformanceChart data={channelPerformance} />
        )}
      </div>

      <Modal open={showAddArticle} onClose={() => setShowAddArticle(false)} title="Ajouter un article">
        <ArticleForm onSuccess={() => setShowAddArticle(false)} />
      </Modal>

      <Modal open={showAddExpense} onClose={() => setShowAddExpense(false)} title="Nouvelle dépense">
        <QuickExpenseForm onSuccess={() => setShowAddExpense(false)} />
      </Modal>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
// hot-reload test Thu Jul 30 01:53:59     2026
