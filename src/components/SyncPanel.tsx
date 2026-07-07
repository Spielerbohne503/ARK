import { useEffect, useRef, useState } from 'react';
import type { SyncStatus } from '../hooks/useSync';
import { SUPABASE_CONFIGURED } from '../lib/supabaseConfig';
import { IconCheck, IconClose, IconCopy, IconWarning } from './icons';

const SETUP_SQL = `create table if not exists sync_state (
  code text primary key,
  state jsonb not null default '{}'::jsonb,
  device text,
  updated_at timestamptz not null default now()
);
alter table sync_state enable row level security;
create policy "anon access" on sync_state
  for all to anon using (true) with check (true);
alter publication supabase_realtime add table sync_state;`;

const STATUS_META: Record<SyncStatus, { label: string; cls: string }> = {
  off: { label: 'Aus', cls: 'border-gray-700 bg-gray-800 text-gray-400' },
  connecting: { label: 'Verbinde …', cls: 'border-amber-500/50 bg-amber-500/10 text-amber-300' },
  connected: { label: 'Live verbunden', cls: 'border-green-500/50 bg-green-500/10 text-green-300' },
  error: { label: 'Fehler', cls: 'border-red-500/50 bg-red-500/10 text-red-300' },
};

interface SyncPanelProps {
  status: SyncStatus;
  onClose: () => void;
}

/** Info-Dialog zum automatischen Live-Sync (Konfiguration liegt in supabaseConfig.ts). */
export function SyncPanel({ status, onClose }: SyncPanelProps) {
  const [copied, setCopied] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const meta = STATUS_META[status];

  const copySql = async () => {
    try {
      await navigator.clipboard.writeText(SETUP_SQL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard nicht verfügbar – ignorieren.
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Live-Sync"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-lg animate-slide-up flex-col overflow-hidden rounded-2xl border border-gray-700 bg-ark-surface shadow-2xl shadow-black/70 ring-1 ring-white/[0.06] sm:animate-modal-in"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-800 p-5">
          <h2 className="font-display text-xl font-bold text-gray-100">Live-Sync</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-600 bg-gray-950/80 text-gray-300 transition-all duration-200 hover:scale-110 hover:border-red-500 hover:text-red-400"
          >
            <IconClose size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${meta.cls}`}>
              {status === 'connected' ? <IconCheck size={14} /> : status === 'error' ? <IconWarning size={14} /> : null}
              {meta.label}
            </span>
          </div>

          {SUPABASE_CONFIGURED ? (
            <p className="text-sm leading-relaxed text-gray-300">
              Der Sync ist eingerichtet. <span className="text-green-300">Jedes Gerät</span>, das diese
              Seite öffnet, teilt sich automatisch denselben Fortschritt – live, ohne Datei-Austausch.
              Änderungen erscheinen nach einem Augenblick auf dem anderen Gerät.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="flex items-start gap-2 rounded-lg border border-amber-600/40 bg-amber-900/20 px-3 py-2 text-sm text-amber-200">
                <IconWarning size={16} className="mt-0.5 shrink-0" />
                Noch nicht eingerichtet – die App läuft rein lokal. Trage deine Supabase-Daten in{' '}
                <code className="rounded bg-black/40 px-1 font-mono text-amber-100">src/lib/supabaseConfig.ts</code>{' '}
                ein, dann syncen sich alle Geräte automatisch.
              </p>
            </div>
          )}

          {/* Einmalige Einrichtung */}
          <details className="rounded-xl border border-gray-800 bg-gray-900/50 p-4" open={!SUPABASE_CONFIGURED}>
            <summary className="cursor-pointer text-sm font-medium text-gray-300">
              Einrichtung (einmalig, nur der Betreiber)
            </summary>
            <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-sm text-gray-400">
              <li>Auf supabase.com ein kostenloses Projekt anlegen.</li>
              <li>Im <span className="text-gray-300">SQL Editor</span> den Befehl unten einmal ausführen.</li>
              <li>
                Projekt-URL und <span className="text-gray-300">anon</span>-Key aus{' '}
                <span className="text-gray-300">Project Settings → API</span> in{' '}
                <code className="rounded bg-black/40 px-1 font-mono text-gray-300">src/lib/supabaseConfig.ts</code> eintragen.
              </li>
              <li>Neu deployen – fertig. Details stehen im README.</li>
            </ol>
            <div className="mt-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-widest text-gray-500">SQL</span>
                <button
                  type="button"
                  onClick={copySql}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-700 px-2.5 py-1 text-xs text-gray-300 transition-colors hover:border-green-600 hover:text-green-300"
                >
                  <IconCopy size={13} />
                  {copied ? 'Kopiert' : 'Kopieren'}
                </button>
              </div>
              <pre className="mt-1.5 overflow-x-auto rounded-lg border border-gray-800 bg-gray-950/70 p-3 font-mono text-[11px] leading-relaxed text-green-300">
{SETUP_SQL}
              </pre>
            </div>
          </details>

          <p className="text-[11px] leading-relaxed text-gray-600">
            Der anon-Key ist ein öffentlicher Schlüssel (für den Browser gedacht). Wer die Seite
            öffnet, teilt sich den Stand – nur an Leute weitergeben, denen du vertraust.
          </p>
        </div>
      </div>
    </div>
  );
}
