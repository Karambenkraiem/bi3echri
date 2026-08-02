'use client';

import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  // Rendu via portail directement sous <body> : un modal en position "fixed"
  // se recale sur le premier ancêtre qui a un transform actif (ex: animation
  // de page avec fill-mode both), pas sur la fenêtre — le portail contourne
  // ce piège en sortant complètement de l'arbre DOM de la page.
  return createPortal(
    <div
      className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-2 backdrop-blur-sm sm:p-4"
      onClick={onClose}
    >
      <div
        className="animate-modal-in max-h-[95vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200/70 bg-white p-4 shadow-2xl sm:p-6 dark:border-slate-800/70 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
