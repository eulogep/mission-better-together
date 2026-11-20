import { useSyncExternalStore } from 'react';

/**
 * Petits messages de confirmation bienveillants (« toasts »), appelables depuis n'importe où :
 *   toast('Fait enregistré', { tone: 'success' })
 */

export type ToastTone = 'success' | 'info' | 'warm';

export interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

export function toast(message: string, { tone = 'info', duration = 3200 }: { tone?: ToastTone; duration?: number } = {}) {
  const item = { id: nextId++, message, tone };
  items = [...items.slice(-2), item]; // 3 messages maximum à l'écran
  emit();
  window.setTimeout(() => dismissToast(item.id), duration);
}

export function dismissToast(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

export function useToasts(): ToastItem[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => items
  );
}
