'use client';

import { KeyboardEvent, useEffect, useRef, useState } from 'react';

interface EditableNumberCellProps {
  value: number | null;
  label: string;
  format: (v: number | null) => string;
  onSave: (newValue: number) => void;
  className?: string;
  step?: string;
  min?: string;
}

export function EditableNumberCell({
  value,
  label,
  format,
  onSave,
  className = '',
  step = '0.001',
  min = '0.001',
}: EditableNumberCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value != null ? String(value) : '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(value != null ? String(value) : '');
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing, value]);

  function commit() {
    const newValue = Number(draft);
    if (draft === '' || Number.isNaN(newValue) || newValue === value) {
      setEditing(false);
      return;
    }
    const confirmed = window.confirm(
      `Modifier ${label} de ${format(value)} à ${format(newValue)} ?`,
    );
    if (confirmed) {
      onSave(newValue);
    }
    setEditing(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    }
    if (e.key === 'Escape') {
      setEditing(false);
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min={min}
        step={step}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        className="w-24 rounded-md border border-violet-400 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 dark:bg-slate-900 dark:text-white"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      title="Cliquer pour modifier"
      className={`rounded-md px-1.5 py-0.5 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 ${className}`}
    >
      {format(value)}
    </button>
  );
}
