'use client';

import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { CalculatorIcon } from '@/components/ui/icons';

type Operator = '+' | '-' | '×' | '÷';

function compute(a: number, b: number, op: Operator): number {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '×':
      return a * b;
    case '÷':
      return b === 0 ? NaN : a / b;
  }
}

function formatDisplay(value: number): string {
  if (Number.isNaN(value)) return 'Erreur';
  const rounded = Math.round(value * 1e6) / 1e6;
  return String(rounded);
}

export function CalculatorPopover() {
  const [open, setOpen] = useState(false);
  const [display, setDisplay] = useState('0');
  const [stored, setStored] = useState<number | null>(null);
  const [pendingOp, setPendingOp] = useState<Operator | null>(null);
  // True right after an operator/= is pressed: the next digit starts a fresh
  // operand instead of appending to what's on screen, and pressing another
  // operator before typing a digit just swaps it instead of recomputing.
  const [awaitingOperand, setAwaitingOperand] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  useEffect(() => {
    if (open) {
      panelRef.current?.focus();
    }
  }, [open]);

  function inputDigit(digit: string) {
    if (awaitingOperand) {
      setDisplay(digit);
      setAwaitingOperand(false);
      return;
    }
    setDisplay((prev) => (prev === '0' ? digit : prev + digit));
  }

  function inputDecimal() {
    if (awaitingOperand) {
      setDisplay('0.');
      setAwaitingOperand(false);
      return;
    }
    setDisplay((prev) => (prev.includes('.') ? prev : `${prev}.`));
  }

  function clearAll() {
    setDisplay('0');
    setStored(null);
    setPendingOp(null);
    setAwaitingOperand(false);
  }

  function backspace() {
    setDisplay((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  }

  function chooseOperator(op: Operator) {
    const current = Number(display);
    if (pendingOp && stored !== null && !awaitingOperand) {
      // A full operand was entered since the last operator: chain the result.
      const result = compute(stored, current, pendingOp);
      setStored(result);
      setDisplay(formatDisplay(result));
    } else if (stored === null) {
      setStored(current);
    }
    // else: operator pressed again before any new digit — just swap it below.
    setPendingOp(op);
    setAwaitingOperand(true);
  }

  function evaluate() {
    if (stored === null || !pendingOp) return;
    const current = Number(display);
    const result = compute(stored, current, pendingOp);
    setDisplay(formatDisplay(result));
    setStored(null);
    setPendingOp(null);
    setAwaitingOperand(true);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const { key } = e;
    if (/^[0-9]$/.test(key)) {
      inputDigit(key);
      e.preventDefault();
      return;
    }
    if (key === '.' || key === ',') {
      inputDecimal();
      e.preventDefault();
      return;
    }
    switch (key) {
      case '+':
        chooseOperator('+');
        e.preventDefault();
        break;
      case '-':
        chooseOperator('-');
        e.preventDefault();
        break;
      case '*':
      case 'x':
      case 'X':
        chooseOperator('×');
        e.preventDefault();
        break;
      case '/':
        chooseOperator('÷');
        e.preventDefault();
        break;
      case 'Enter':
      case '=':
        evaluate();
        e.preventDefault();
        break;
      case 'Backspace':
        backspace();
        e.preventDefault();
        break;
      case 'Delete':
      case 'c':
      case 'C':
        clearAll();
        e.preventDefault();
        break;
      case 'Escape':
        setOpen(false);
        break;
    }
  }

  const BTN =
    'flex h-10 items-center justify-center rounded-lg text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        aria-label="Calculatrice"
        title="Calculatrice"
      >
        <CalculatorIcon className="h-4 w-4" />
      </button>

      {open && (
        <div
          ref={panelRef}
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          className="animate-fade-in-up absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-slate-200/70 bg-white p-3 shadow-lg outline-none dark:border-slate-800/70 dark:bg-slate-900"
        >
          <div className="mb-2 rounded-lg bg-slate-100 px-3 py-2 text-right text-xl font-semibold text-slate-900 dark:bg-slate-800 dark:text-white">
            {display}
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            <button onClick={clearAll} className={`${BTN} text-red-600 dark:text-red-400`}>
              C
            </button>
            <button onClick={backspace} className={`${BTN} text-slate-500 dark:text-slate-400`}>
              ⌫
            </button>
            <button
              onClick={() => chooseOperator('÷')}
              className={`${BTN} text-violet-600 dark:text-violet-400`}
            >
              ÷
            </button>
            <button
              onClick={() => chooseOperator('×')}
              className={`${BTN} text-violet-600 dark:text-violet-400`}
            >
              ×
            </button>

            {['7', '8', '9'].map((d) => (
              <button key={d} onClick={() => inputDigit(d)} className={`${BTN} text-slate-700 dark:text-slate-200`}>
                {d}
              </button>
            ))}
            <button
              onClick={() => chooseOperator('-')}
              className={`${BTN} text-violet-600 dark:text-violet-400`}
            >
              −
            </button>

            {['4', '5', '6'].map((d) => (
              <button key={d} onClick={() => inputDigit(d)} className={`${BTN} text-slate-700 dark:text-slate-200`}>
                {d}
              </button>
            ))}
            <button
              onClick={() => chooseOperator('+')}
              className={`${BTN} text-violet-600 dark:text-violet-400`}
            >
              +
            </button>

            {['1', '2', '3'].map((d) => (
              <button key={d} onClick={() => inputDigit(d)} className={`${BTN} text-slate-700 dark:text-slate-200`}>
                {d}
              </button>
            ))}
            <button
              onClick={evaluate}
              className="row-span-2 flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              =
            </button>

            <button
              onClick={() => inputDigit('0')}
              className={`${BTN} col-span-2 text-slate-700 dark:text-slate-200`}
            >
              0
            </button>
            <button onClick={inputDecimal} className={`${BTN} text-slate-700 dark:text-slate-200`}>
              .
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
