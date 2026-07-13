import { useMemo } from 'react';
import { getArtifactsForMap } from '../data/artifacts';
import { bossKey, getBossesForMap } from '../data/bosses';
import { getDinosForMap } from '../data/dinoDatabase';
import { getNotesForMap } from '../data/explorerNotes';
import type { DinoTracker } from '../hooks/useDinoTracker';
import type { ExplorerTracker } from '../hooks/useExplorerTracker';
import type { KeySet } from '../hooks/useKeySet';
import { ACHIEVEMENTS } from '../data/achievements';
import { TOTAL_DOSSIERS } from '../data/dossiers';
import { MAPS, type MapName } from '../types';
import { IconBook, IconCheck, IconGem, IconNote, IconSkull, IconSparkles, IconSwords, IconTrophy } from './icons';

interface CategoryRow {
  label: string;
  icon: JSX.Element;
  done: number;
  total: number;
}

interface MapReport {
  map: MapName;
  rows: CategoryRow[];
  done: number;
  total: number;
  percent: number;
}

interface DashboardViewProps {
  tracker: DinoTracker;
  dossierSet: KeySet;
  /** Eigener Spielername (für das „Wer war's?"-Duell). */
  playerName: string;
  explorer: ExplorerTracker;
  bossSet: KeySet;
  artifactSet: KeySet;
  /** Klick auf eine Karte springt zur Kreaturen-Ansicht dieser Map. */
  onOpenMap: (map: MapName) => void;
}

/**
 * 100%-Dashboard: eine Karte pro Map mit dem Fortschritt aller fünf
 * Sammel-Kategorien (Zähmungen, Tötungen, Notizen, Bosse, Artefakte) und
 * einer Gesamt-Prozentzahl – die Checkliste für den kompletten Durchlauf.
 */
export function DashboardView({ tracker, dossierSet, playerName, explorer, bossSet, artifactSet, onOpenMap }: DashboardViewProps) {
  const reports = useMemo<MapReport[]>(
    () =>
      MAPS.map((map) => {
        const dinos = getDinosForMap(map);
        const tameIds = new Set(dinos.filter((d) => d.tameable !== false).map((d) => d.id));
        const killIds = new Set(dinos.filter((d) => d.tameable === false).map((d) => d.id));
        const notes = getNotesForMap(map);
        const bossKeys = new Set(
          getBossesForMap(map).flatMap((b) => b.difficulties.map((d) => bossKey(b.id, d))),
        );
        const artifacts = getArtifactsForMap(map);

        const rows: CategoryRow[] = [
          { label: 'Gezähmt', icon: <IconSwords size={14} />, done: tracker.countTamed(map, tameIds), total: tameIds.size },
          { label: 'Getötet', icon: <IconSkull size={14} />, done: tracker.countTamed(map, killIds), total: killIds.size },
          { label: 'Notizen', icon: <IconBook size={14} />, done: explorer.countFound(new Set(notes.map((n) => n.id))), total: notes.length },
          { label: 'Bosse', icon: <IconTrophy size={14} />, done: bossSet.count(bossKeys), total: bossKeys.size },
          { label: 'Artefakte', icon: <IconGem size={14} />, done: artifactSet.count(new Set(artifacts.map((a) => a.id))), total: artifacts.length },
        ].filter((row) => row.total > 0);

        const done = rows.reduce((sum, r) => sum + r.done, 0);
        const total = rows.reduce((sum, r) => sum + r.total, 0);
        return { map, rows, done, total, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
      }),
    [tracker, explorer, bossSet, artifactSet],
  );

  const best = reports.reduce((a, b) => (b.percent > a.percent ? b : a), reports[0]);
  const anyProgress = reports.some((r) => r.done > 0);

  // „Wer war's?": Einträge nach Spielername gruppieren.
  const duel = useMemo(() => {
    const counts = new Map<string, number>();
    tracker.records.forEach((r) => {
      const who = r.by?.trim() || 'Unbekannt';
      counts.set(who, (counts.get(who) ?? 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [tracker.records]);
  const named = duel.filter(([who]) => who !== 'Unbekannt');

  // Erfolge auswerten.
  const snapshot = useMemo(
    () => ({ records: tracker.records, found: explorer.found, bossKeys: bossSet.keys, artifactKeys: artifactSet.keys, dossierKeys: dossierSet.keys }),
    [tracker.records, explorer.found, bossSet.keys, artifactSet.keys, dossierSet.keys],
  );
  const unlockedCount = ACHIEVEMENTS.filter((a) => a.check(snapshot)).length;

  return (
    <section aria-label="100%-Fortschritt pro Map" className="space-y-4">
      <p className="text-sm text-gray-400">
        Dein Weg zu <span className="text-amber-300">100 %</span>: alle Kategorien jeder Map.
        {anyProgress && best.done > 0 && (
          <> Am weitesten bist du auf <span className="text-green-300">{best.map}</span> ({best.percent} %).</>
        )}{' '}
        Klick auf eine Map öffnet ihre Kreaturen-Liste.
      </p>

      {/* Map-unabhängig: Dossier-Sammlung */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-800 bg-ark-surface/60 p-3">
        <span className="flex items-center gap-2 font-display text-xs uppercase tracking-widest text-gray-500">
          <IconNote size={14} /> Dossiers (alle Maps)
        </span>
        <span className="h-2 min-w-24 flex-1 overflow-hidden rounded-full bg-gray-950/60">
          <span
            className="block h-full rounded-full bg-gradient-to-r from-green-700 to-green-400 transition-all duration-700"
            style={{ width: `${TOTAL_DOSSIERS > 0 ? (dossierSet.keys.size / TOTAL_DOSSIERS) * 100 : 0}%` }}
          />
        </span>
        <span className="font-mono text-sm tabular-nums text-gray-400">
          <span className="font-bold text-green-300">{dossierSet.keys.size}</span>/{TOTAL_DOSSIERS}
        </span>
      </div>

      {named.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-800 bg-ark-surface/60 p-3">
          <span className="font-display text-xs uppercase tracking-widest text-gray-500">Wer war's?</span>
          {duel.map(([who, count], i) => (
            <span
              key={who}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${
                i === 0
                  ? 'border-amber-500/50 bg-amber-500/10 text-amber-200'
                  : 'border-gray-700 bg-gray-900/60 text-gray-300'
              }`}
            >
              {i === 0 && <IconTrophy size={13} />}
              {who === playerName.trim() && playerName ? `${who} (du)` : who}:
              <span className="font-mono font-bold tabular-nums">{count}</span>
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {reports.map((report, index) => {
          const complete = report.percent === 100 && report.total > 0;
          return (
            <button
              key={report.map}
              type="button"
              onClick={() => onOpenMap(report.map)}
              style={{ animationDelay: `${index * 40}ms` }}
              className={`group relative animate-fade-in-up overflow-hidden rounded-xl border p-4 text-left shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl ${
                complete
                  ? 'border-amber-500/50 bg-amber-500/[0.06] shadow-glow-amber'
                  : 'border-gray-800 bg-ark-surface/70 hover:border-green-700/60'
              }`}
            >
              {/* Fortschritts-Glow im Hintergrund */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 bg-gradient-to-r from-green-500/[0.07] to-transparent transition-all duration-700"
                style={{ width: `${Math.max(report.percent, 4)}%` }}
              />

              <div className="relative mb-3 flex items-baseline justify-between gap-2">
                <h3 className="font-display text-lg font-bold tracking-wide text-gray-100 group-hover:text-green-200">
                  {report.map}
                </h3>
                <span
                  className={`font-mono text-xl font-bold tabular-nums ${
                    complete ? 'text-amber-300' : report.percent > 0 ? 'text-green-300' : 'text-gray-600'
                  }`}
                >
                  {report.percent}%
                </span>
              </div>

              {/* Gesamt-Balken der Map */}
              <div
                role="progressbar"
                aria-valuenow={report.percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${report.map}: ${report.done} von ${report.total}`}
                className="relative mb-3 h-2 overflow-hidden rounded-full border border-black/40 bg-gray-950/60"
              >
                <span
                  className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${
                    complete
                      ? 'bg-gradient-to-r from-amber-500 to-amber-300'
                      : 'bg-gradient-to-r from-green-700 via-green-500 to-green-400'
                  }`}
                  style={{ width: `${report.percent}%` }}
                />
              </div>

              {/* Kategorie-Zeilen */}
              <ul className="relative space-y-1.5">
                {report.rows.map((row) => {
                  const rowDone = row.total > 0 && row.done === row.total;
                  return (
                    <li key={row.label} className="flex items-center gap-2 text-xs">
                      <span className={rowDone ? 'text-amber-400' : 'text-gray-500'}>{row.icon}</span>
                      <span className={`w-16 shrink-0 ${rowDone ? 'text-amber-300' : 'text-gray-400'}`}>
                        {row.label}
                      </span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-950/60">
                        <span
                          className={`block h-full rounded-full transition-all duration-500 ${
                            rowDone ? 'bg-amber-400' : 'bg-green-500/80'
                          }`}
                          style={{ width: `${row.total > 0 ? (row.done / row.total) * 100 : 0}%` }}
                        />
                      </span>
                      <span className="w-14 shrink-0 text-right font-mono tabular-nums text-gray-500">
                        {row.done}/{row.total}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {complete && (
                <p className="relative mt-3 flex items-center gap-1.5 font-display text-xs uppercase tracking-widest text-amber-300">
                  <IconTrophy size={14} /> Map komplett
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Meilenstein-Erfolge */}
      <div className="rounded-xl border border-gray-800 bg-ark-surface/60 p-4">
        <h3 className="mb-3 flex items-center gap-2 font-display text-sm uppercase tracking-widest text-gray-300">
          <IconSparkles size={16} className="text-amber-400" />
          Erfolge
          <span className="font-mono text-xs tabular-nums text-gray-500">
            {unlockedCount}/{ACHIEVEMENTS.length}
          </span>
        </h3>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ACHIEVEMENTS.map((achievement) => {
            const unlocked = achievement.check(snapshot);
            return (
              <li
                key={achievement.id}
                className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-colors ${
                  unlocked ? 'border-amber-500/40 bg-amber-500/[0.06]' : 'border-gray-800/80 bg-gray-900/40'
                }`}
              >
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                    unlocked
                      ? 'border-amber-400/70 bg-amber-400/20 text-amber-300'
                      : 'border-gray-700 bg-gray-950/60 text-gray-600'
                  }`}
                >
                  {unlocked ? <IconCheck size={13} /> : <IconTrophy size={12} />}
                </span>
                <span>
                  <span className={`block text-sm font-semibold ${unlocked ? 'text-amber-200' : 'text-gray-400'}`}>
                    {achievement.title}
                  </span>
                  <span className={`block text-xs ${unlocked ? 'text-gray-300' : 'text-gray-600'}`}>
                    {achievement.description}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
