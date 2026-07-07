import { useEffect, useRef, useState } from 'react';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import {
  SUPABASE_ANON_KEY,
  SUPABASE_CONFIGURED,
  SUPABASE_URL,
  SYNC_ROOM,
} from '../lib/supabaseConfig';
import { deviceId, normalizeState, stateSignature, SYNC_TABLE, type SyncState } from '../lib/sync';

export type SyncStatus = 'off' | 'connecting' | 'connected' | 'error';

interface UseSyncArgs {
  /** Aktueller lokaler Zustand (wird bei Änderung hochgeladen). */
  state: SyncState;
  /** Wird mit dem Fremd-Stand aufgerufen, sobald er eintrifft. */
  onRemote: (state: SyncState) => void;
}

/**
 * Automatischer Echtzeit-Sync über die zentrale Supabase-Instanz aus
 * `supabaseConfig.ts`. Ist sie hinterlegt, synchronisiert sich jedes Gerät,
 * das die Seite öffnet, ohne weitere Eingabe. Ist sie leer, bleibt die App
 * rein lokal (offline). Der Supabase-Client wird erst bei aktivem Sync
 * dynamisch geladen. Eigener Upload und eingehende Änderung werden über eine
 * Zustands-Signatur entkoppelt, sodass keine Endlosschleife entsteht.
 */
export function useSync({ state, onRemote }: UseSyncArgs): SyncStatus {
  const [status, setStatus] = useState<SyncStatus>('off');

  const clientRef = useRef<SupabaseClient | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  // Signatur des zuletzt gesendeten ODER empfangenen Zustands (Echo-Schutz).
  const sigRef = useRef<string>('');
  const pushTimer = useRef<ReturnType<typeof setTimeout>>();

  // Immer aktuelle Referenzen für die asynchronen Callbacks.
  const onRemoteRef = useRef(onRemote);
  onRemoteRef.current = onRemote;
  const stateRef = useRef(state);
  stateRef.current = state;

  // Einmalig verbinden, sobald die zentrale Instanz konfiguriert ist.
  useEffect(() => {
    if (!SUPABASE_CONFIGURED) {
      setStatus('off');
      return;
    }

    let cancelled = false;
    setStatus('connecting');

    (async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        if (cancelled) return;
        const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: { persistSession: false },
        });
        clientRef.current = client;

        // Bestehenden gemeinsamen Stand holen …
        const { data, error } = await client
          .from(SYNC_TABLE)
          .select('state')
          .eq('code', SYNC_ROOM)
          .maybeSingle();
        if (cancelled) return;
        if (error && error.code !== 'PGRST116') {
          setStatus('error');
          return;
        }

        if (data?.state) {
          const remote = normalizeState(data.state);
          sigRef.current = stateSignature(remote);
          onRemoteRef.current(remote);
        } else {
          // Noch kein Stand → lokalen hochladen.
          const local = stateRef.current;
          sigRef.current = stateSignature(local);
          await client
            .from(SYNC_TABLE)
            .upsert({ code: SYNC_ROOM, state: local, device: deviceId(), updated_at: new Date().toISOString() });
        }
        if (cancelled) return;

        // … und auf Live-Änderungen lauschen.
        const channel = client
          .channel(`sync:${SYNC_ROOM}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: SYNC_TABLE, filter: `code=eq.${SYNC_ROOM}` },
            (payload) => {
              const incoming = (payload.new as { state?: unknown } | null)?.state;
              if (!incoming) return;
              const remote = normalizeState(incoming);
              const sig = stateSignature(remote);
              if (sig === sigRef.current) return; // eigenes Echo
              sigRef.current = sig;
              onRemoteRef.current(remote);
            },
          )
          .subscribe((channelStatus) => {
            if (cancelled) return;
            if (channelStatus === 'SUBSCRIBED') setStatus('connected');
            else if (channelStatus === 'CHANNEL_ERROR' || channelStatus === 'TIMED_OUT') setStatus('error');
          });
        channelRef.current = channel;
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
      const client = clientRef.current;
      const channel = channelRef.current;
      if (client && channel) client.removeChannel(channel);
      clientRef.current = null;
      channelRef.current = null;
      setStatus('off');
    };
  }, []);

  // Lokale Änderungen hochladen (entprellt, Echos übersprungen).
  useEffect(() => {
    if (status !== 'connected') return;
    const sig = stateSignature(state);
    if (sig === sigRef.current) return;

    clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      sigRef.current = sig;
      clientRef.current
        ?.from(SYNC_TABLE)
        .upsert({ code: SYNC_ROOM, state, device: deviceId(), updated_at: new Date().toISOString() })
        .then(({ error }: { error: unknown }) => {
          if (error) setStatus('error');
        });
    }, 700);

    return () => clearTimeout(pushTimer.current);
  }, [state, status]);

  return status;
}
