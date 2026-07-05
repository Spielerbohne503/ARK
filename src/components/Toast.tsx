import { useEffect } from 'react';
import { IconCheck, IconClose, IconStarFilled, IconTrophy } from './icons';

export interface ToastData {
  id: number;
  kind: 'tamed' | 'untamed' | 'favorite' | 'complete' | 'info';
  message: string;
}

const TOAST_STYLE: Record<ToastData['kind'], { icon: JSX.Element; accent: string }> = {
  tamed: { icon: <IconCheck size={16} />, accent: 'border-green-500/50 text-green-300' },
  untamed: { icon: <IconClose size={16} />, accent: 'border-gray-600 text-gray-300' },
  favorite: { icon: <IconStarFilled size={16} />, accent: 'border-amber-500/50 text-amber-300' },
  complete: { icon: <IconTrophy size={16} />, accent: 'border-amber-400/60 text-amber-300' },
  info: { icon: <IconCheck size={16} />, accent: 'border-gray-600 text-gray-300' },
};

function ToastItem({ toast, onDismiss }: { toast: ToastData; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3200);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const style = TOAST_STYLE[toast.kind];
  return (
    <div
      role="status"
      className={`pointer-events-auto flex animate-toast-in items-center gap-2.5 rounded-lg border bg-gray-950/90 px-3.5 py-2.5 text-sm shadow-xl backdrop-blur-md ${style.accent}`}
    >
      {style.icon}
      <span className="text-gray-200">{toast.message}</span>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Meldung schließen"
        className="ml-1 text-gray-600 transition-colors hover:text-gray-300"
      >
        <IconClose size={14} />
      </button>
    </div>
  );
}

/** Gestapelte Benachrichtigungen unten rechts. */
export function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastData[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col-reverse gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
